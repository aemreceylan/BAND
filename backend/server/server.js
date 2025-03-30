import express from "express";
import argon2 from "argon2";
import { Server } from "socket.io";
import { createServer } from "http";
import DB from "./mongo.js";
import cors from "cors";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Category from "./models/Category.js";

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: "*",
  },
});

app.use(cors({ origin: "*", methods: "*" }));
app.use(express.json());
app.use(express.text());
app.use(express.static(import.meta.dirname + "/public"));

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
            .populate({ path: "channels", select: "name" })
        )
      );
    } catch (err) {
      console.log(err);
    }
  }

  async function userValidation(req, res, next) {
    try {
      const result = await User.findById(req.headers.authorization).select({
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

  app.post("/set-hub-settings", userValidation, async (req, res) => {
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
    }
  });

  app.get("/user-validation", userValidation, (req, res) => {
    return res
      .status(202)
      .json({ status: true, msg: "User authorization approved" });
  });

  app.post("/login", async (req, res) => {
    try {
      const id = await db.checkUser(req.body);
      res.status(202).json({ status: true, msg: "Login successful", id: id });
    } catch (err) {
      res.status(400).json({ status: false, msg: "Login failed = " + err });
    }
  });

  app.post("/signup", async (req, res) => {
    if (req.body.password != req.body.password_confirm)
      res.status(400).json({ status: false, msg: "Passwords do not match" });
    else {
      try {
        req.body.password = await argon2.hash(req.body.password,{
          hashLength: 50,
          timeCost:4
        });
        const { password_confirm, ..._userData } = req.body;
        await db.createUser(_userData);
        res.status(201).json({ status: true, msg: "Registration successful" });
      } catch (err) {
        res
          .status(500)
          .json({ status: false, msg: "Registration failed = "+ err });
      }
    }
  });

  app.use("/", (req, res) => {
    res.end();
  });

  io.use(async (socket, next) => {
    try {
      const id = await db.checkUser(socket.handshake.auth);
      socket.userId = id;
      next();
    } catch (err) {
      next(new Error(err));
    }
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

    socket.on("newMessageFromClient", async (data, callback) => {
      try {
        data = JSON.parse(data);
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
