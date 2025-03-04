import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import DB from "./mongo.js";
import cors from "cors";
import User from "./models/User.js";

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

const db = DB();

(async () => {
  await db.init();

  app.get("/get", async (req, res) => {
    try {
      const result = await User.findById(req.headers["authorization"]).select({
        roles: 1,
      });
      if (result == null) return res.status(404).json({status:false,msg:"User not found"});
      if (!Array.from(result.roles).includes("1"))
        return res.status(401).json({status:false,msg:"Unauthorized user"});
      return res.status(202).json({status:true,msg:"User authorization approved"})
    } catch (err) {
      console.log(err);
      return res.status(500).json({status:false,msg:"Error"});
    }
  });

  app.post("/login", async (req, res) => {
    try {
      const id = await db.checkUser(req.body);
      res.status(200).json({ msg: "Login successful", id: id });
    } catch (err) {
      res.status(401).json({ msg: "Login failed = " + err });
    }
  });

  app.post("/signup", async (req, res) => {
    if (req.body.password != req.body.password_confirm)
      res.status(400).end("Passwords do not match");
    else {
      const { password_confirm, ...userData } = req.body;
      try {
        const userData = await db.createUser(userData);
        res.status(201).json({ msg: "Registration successful" });
      } catch (err) {
        res.status(500).json({ msg: "Registration failed = " + err });
      }
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
      const id = await db.checkUser(socket.handshake.auth);
      socket.userId = id;
      next();
    } catch (err) {
      next(new Error(err));
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
