import express from "express";
import argon2 from "argon2";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import MongoStore from "connect-mongo";
import csrf from "@dr.pogodin/csurf";
import jwt from "jsonwebtoken";

import DB from "./mongo.js";
import ms from "./media.js";

import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Category from "./models/Category.js";

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
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
    secret: "abc123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "Strict",
    },
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/bandDB",
    }),
  })
);
app.use(csrf());

(async () => {
  const db = DB();
  await db.init();

  async function emitHubSections() {
    try {
      io.emit(
        "sectionList",
        JSON.stringify(
          await Category.find({})
            .select({ name: 1, channels: 1 })
            .populate({ path: "channels", select: ["name", "type"] })
        )
      );
    } catch (err) {
      console.log(err);
    }
  }

  function passwordVerification(hash, plain) {
    return new Promise(async (resolve, reject) => {
      if (!(await argon2.verify(hash, plain))) reject("Wrong password");
      else resolve();
    });
  }

  async function userAuthorization(req, res, next) {
    try {
      const id = jwt.verify(req.headers.authorization, "abc123").id;
      const result = await User.findById(id).select({
        roles: 1,
      });
      if (result == null) {
        return res.status(404).json({ status: false, msg: "User not found" });
      } else if (!Array.from(result.roles).includes("1")) {
        return res
          .status(401)
          .json({ status: false, msg: "Unauthorized user" });
      }
      next();
    } catch (err) {
      console.log(err);
      return res.status(500).json({ status: false, msg: "Error" });
    }
  }

  app.get("/get-csrf", (req, res) => {
    res.status(200).json({
      status: true,
      msg: "csrf token created",
      csrfToken: req.csrfToken(),
    });
  });

  app.get("/log-out", async (req, res) => {
    try {
      await req.session.destroy();
      res.status(200).json({ status: true, msg: "Session ended" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ status: false, msg: "Error" });
    }
  });

  app.post("/get-messages", async (req, res) => {
    try {
      if (req.body.messageAmount > 50)
        throw new Error("A higher message amount was requested than allowed.");
      const data = await db.getMessages(req.body);
      res.status(200).json({
        status: true,
        msg: "Messages were fetched",
        data: data,
        isMessagesEnd: data.length < req.body.messageAmount,
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({ status: false, msg: err.message });
    }
  });

  app.post("/set-hub-settings", userAuthorization, async (req, res) => {
    switch (req.body.type) {
      case "add-channel":
        try {
          await db.createChannel(req.body.data);
          res.status(201).json({ status: true, msg: "Channel created" });
          emitHubSections();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "add-category":
        try {
          await db.createCategory(req.body.data);
          res.status(201).json({ status: true, msg: "Category created" });
          emitHubSections();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "edit-category":
        try {
          await db.editCategory(req.body.data);
          res.status(200).json({ status: true, msg: "Category edited" });
          emitHubSections();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "edit-channel":
        try {
          await db.editChannel(req.body.data);
          res.status(200).json({ status: true, msg: "Channel edited" });
          emitHubSections();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
    }
  });

  app.get("/user-validation", userAuthorization, (req, res) => {
    return res
      .status(202)
      .json({ status: true, msg: "User authorization approved" });
  });

  app.post("/login", async (req, res) => {
    try {
      const result = await db.checkUser({ nick: req.body.nick });
      await passwordVerification(result.password, req.body.password);
      const authToken = jwt.sign({ id: result.id }, "abc123");
      req.session.isAuth = true;
      req.session.authToken = authToken;
      req.session.cookie.maxAge = 86400000 * 2;
      res
        .status(202)
        .json({ status: true, msg: "Login successful", authToken: authToken });
    } catch (err) {
      res.status(400).json({ status: false, msg: "Login failed = " + err });
    }
  });

  app.post("/signup", async (req, res) => {
    if (req.body.password != req.body.password_confirm)
      res.status(400).json({ status: false, msg: "Passwords do not match" });
    else {
      try {
        req.body.password = await argon2.hash(req.body.password, {
          hashLength: 50,
          timeCost: 4,
        });
        const { password_confirm, ..._userData } = req.body;
        await db.createUser(_userData);
        res.status(201).json({ status: true, msg: "Registration successful" });
      } catch (err) {
        res
          .status(500)
          .json({ status: false, msg: "Registration failed = " + err });
      }
    }
  });

  app.get("/session-check", (req, res) => {
    if (req.session.isAuth)
      res.status(200).json({
        status: true,
        message: "Session check approved",
        authToken: req.session.authToken,
      });
    else {
      res.status(401).json({ status: false, message: "Session check failed" });
    }
  });

  app.use("/", (req, res) => {
    res.end();
  });

  const userList = (() => {
    const list = new Map();
    async function getUsersFromDB() {
      try {
        const result = await User.find({});
        for (let i of result) {
          list.set(i.id, { ...i._doc, isOnline: false });
        }
      } catch (err) {
        console.log(err);
      }
    }
    function setUserOnline(user) {
      list.set(user.id, { ...user._doc, isOnline: true });
    }
    function setUserOffline(id) {
      list.set(id, {
        ...list.get(id),
        isOnline: false,
      });
    }
    function emitList() {
      io.emit("userList", Array.from(list.values()));
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
      const _id = jwt.verify(socket.handshake.auth.authToken, "abc123").id;
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
      const result = await User.findById(socket.userId).select({
        _id: 1,
        nick: 1,
        profilePhotoURL: 1,
        roles: 1,
      });
      userList.setUserOnline(result);
      userList.emitList();
    } catch (err) {
      (err) => console.log(err);
    }

    socket.emit(
      "channelList",
      JSON.stringify(await Channel.find({}).select({ name: 1 }))
    );

    emitHubSections();

    socket.on("joinChannel", async (data, callback) => {
      try {
        const response = await Channel.findOne({ _id: data }).select({
          name: 1,
        });
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
        data = JSON.parse(data);
        data.userId = jwt.verify(data.authToken, "abc123").id;
        delete data.authToken;
        const response = await db.newMessage(data);
        io.to(data.channelName).emit(
          "newMessageFromServer",
          JSON.stringify(response)
        );
        callback("Message sent");
      } catch (err) {
        console.log(err);
        callback("Error");
      }
    });

    socket.on("msServer", async (data, callback) => {
      switch (data.type) {
        case "getRtpCap":
          callback(await ms.getRtpCap());
          break;
        case "create-producer-transport":
          callback(await ms.createTransport("produce"));
          break;
        case "connect-transport":
          callback(await ms.connectTransport(data.dtlsParameters, data.id));
          break;
        case "start-producing":
          callback(await ms.startProducing(data.params));
          break;
        case "create-consumer-transport":
          callback(await ms.createTransport("consume"));
          break;
        case "consume-media":
          callback(await ms.consumeMedia(data.rtpCapabilities));
          break;
        case "unpause-consumer":
          callback(await ms.unpauseConsumer());
          break;
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
      try {
        User.findByIdAndUpdate(socket.userId, { lastLoginDate: Date.now() });
      } catch (err) {
        console.log(err);
      }
      userList.setUserOffline(socket.userId);
      userList.emitList();
    });
  });
})();

httpServer.listen(port, () => {
  console.log("http://localhost:" + port);
});
