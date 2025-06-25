console.log("Server is starting...");

import config from "./config.js";

import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";
import { createServer } from "http";
import { createServer as createServer_s } from "https";
import cors from "cors";
import MongoStore from "connect-mongo";
import csrf from "@dr.pogodin/csurf";
import jwt from "jsonwebtoken";
import fs from "fs";

import db from "./mongo.js";
import ms from "./media.js";
import { emitHubSections } from "./utils.js";

import User from "./models/User.js";
import Channel from "./models/Channel.js";

import apiRouter from "./Routers/apiRouter.js";
import fileRouter from "./Routers/fileRouter.js";

const credentials = {};
if (config.server.https.status) {
  const privateKey = fs.readFileSync(
    config.server.https.privateKey.location,
    "utf8"
  );
  credentials.key = privateKey;
  const certificate = fs.readFileSync(
    config.server.https.certificate.location,
    "utf8"
  );
  credentials.cert = certificate;
}

let httpServer;
const app = express();
if (config.server.https.status) {
  httpServer = createServer_s(credentials, app);
} else {
  httpServer = createServer(app);
}
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["POST", "GET"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.text());
app.use(express.static(import.meta.dirname + "/public"));
app.use(cookieParser());
app.use(
  session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: config.server.https.status,
      httpOnly: true,
      sameSite: "Strict",
    },
    store: MongoStore.create({
      mongoUrl: config.database.url,
    }),
  })
);
app.use(csrf());

(async () => {
  await db.init();

  app.use("/api", apiRouter);
  app.use("/file", fileRouter);

  app.use((req, res) => {
    res.status(404).end("Error");
  });

  const userList = (() => {
    const list = new Map();
    async function getUsersFromDB() {
      try {
        const result = await User.find({ isBanned: false }).select({
          password: 0,
        });
        for (let i of result) {
          list.set(i.id, { ...i._doc, isOnline: false });
        }
      } catch (err) {
        console.log(err);
      }
    }
    function setUserOnline(id) {
      list.set(id, {
        ...list.get(id),
        isOnline: true,
      });
    }
    function setUserOffline(id) {
      list.set(id, {
        ...list.get(id),
        isOnline: false,
      });
    }
    function emitList() {
      io.emit("userList", Array.from(list.entries()));
    }
    return {
      getUsersFromDB,
      setUserOnline,
      setUserOffline,
      emitList,
    };
  })();
  userList.getUsersFromDB();

  io.use(async (socket, next) => {
    try {
      const _id = jwt.verify(
        socket.handshake.auth.authToken,
        config.jwt.secret
      ).id;
      const id = (await db.checkUser({ _id: _id })).id;
      socket.userId = id;
      next();
    } catch (err) {
      next(new Error(err));
      console.log("Socket error : " + err);
    }
  });

  io.on("connection", async (socket) => {
    console.log("Client connected: " + socket.id);

    socket.emit("welcome", "WS:Client accepted");

    try {
      userList.setUserOnline(socket.userId);
      userList.emitList();
    } catch (err) {
      (err) => console.log(err);
    }

    socket.emit(
      "channelList",
      JSON.stringify(await Channel.find({}).select({ name: 1 }))
    );

    emitHubSections();

    let rtcInx;
    let roomName;
    let msLeaveData = {};
    let closeTransportsInxQueue = [];

    socket.on("joinChannel", async (data, callback) => {
      try {
        const response = await Channel.findOne({ _id: data }).select({
          name: 1,
        });
        if (ms.rtcChannelMsData.has(response.id)) {
          rtcInx = ms.rtcChannelMsData.get(response.id);
          closeTransportsInxQueue.push(rtcInx);
          roomName = response.name;
        }
        if (socket.rooms.has(response.name))
          throw new Error("User already in the room.");
        socket.join(response.name);
        console.log("Client joined: " + response.name + " --> " + socket.id);
        callback("Connected to " + response.name);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("leaveChannel", async (data, callback) => {
      try {
        const response = await Channel.findOne({ _id: data }).select({
          name: 1,
        });
        if (!socket.rooms.has(response.name)) {
          callback({
            msg: "User is not already in the room: " + response.name,
            status: false,
          });
          return;
        }
        socket.leave(response.name);
        console.log("Client left: " + response.name + " --> " + socket.id);
        callback({ msg: "User left from " + response.name, status: true });
      } catch (err) {
        console.log(err);
        callback({ msg: "Error", status: false });
      }
    });

    socket.on("newMessageFromClient", async (data, callback) => {
      try {
        data.userId = jwt.verify(data.authToken, config.jwt.secret).id;
        delete data.authToken;
        data.text = data.text.trim();
        if (data.text == "" && (!data.files || data.files.length == 0))
          throw new Error("Invalid text");
        if (!data.files || data.files.length == 0) {
          const response = await db.newMessage(data);
          io.to(data.channelName).emit(
            "newMessageFromServer",
            JSON.stringify(response)
          );
        } else {
          const { files, ...other } = data;
          files.forEach(async (element) => {
            const response = await db.newMessage({ ...other, file: element });
            io.to(data.channelName).emit(
              "newMessageFromServer",
              JSON.stringify(response)
            );
          });
        }
        callback("Message sent");
      } catch (err) {
        console.log(err);
        callback("Error");
      }
    });

    socket.on("msServer", async (data, callback) => {
      switch (data.type) {
        case "getRtpCap":
          try {
            callback(await ms.getRtpCap(rtcInx[0], rtcInx[1]));
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "create-producer-transport":
          try {
            const data = await ms.createTransport(
              "produce",
              rtcInx[0],
              rtcInx[1]
            );
            callback(data);
            msLeaveData.p_id = data.id;
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "connect-transport":
          try {
            callback(await ms.connectTransport(data.dtlsParameters, data.id));
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "start-producing":
          try {
            callback(
              await ms.startProducing(
                socket.broadcast.to(roomName),
                data.params,
                data.id,
                socket.userId
              )
            );
          } catch (err) {
            console.log(err);
            callback(-1);
          }
          break;
        case "create-consumer-transport":
          try {
            const data = await ms.createTransport(
              "consume",
              rtcInx[0],
              rtcInx[1]
            );
            callback(data);
            msLeaveData.c_id = data.id;
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "consume-media":
          try {
            callback(
              await ms.consumeMedia(data.rtpCapabilities, data.c_id, data.p_id)
            );
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "unpause-consumer":
          try {
            callback(await ms.unpauseConsumer(data.id));
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "get-producer-list":
          try {
            callback(
              await ms.getProducers(
                data.produceTransportId,
                rtcInx[0],
                rtcInx[1]
              )
            );
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "close-transports":
          try {
            callback(
              await ms.closeTransports(
                data.p_id,
                data.c_id,
                closeTransportsInxQueue[0]
              )
            );
            closeTransportsInxQueue.shift();
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
        case "close-producer":
          try {
            callback(await ms.closeProducer(data.id, rtcInx));
          } catch (err) {
            console.log(err);
            callback(false);
          }
          break;
      }
    });

    socket.on("error", (err) => {
      console.error("Socket.IO Error: ", err);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected: " + socket.id);
      try {
        await ms.closeTransports(msLeaveData.p_id, msLeaveData.c_id, rtcInx);
        User.findByIdAndUpdate(socket.userId, { lastLoginDate: Date.now() });
      } catch (err) {
        console.log(err);
      }
      userList.setUserOffline(socket.userId);
      userList.emitList();
    });

    socket.on("error", (err) => {
      console.error("Socket.IO Error: ", err);
    });
  });
})();

httpServer.listen(config.server.http.port, () => {
  console.log(
    "Server address : https://" +
      config.server.http.ip +
      ":" +
      config.server.http.port
  );
});
