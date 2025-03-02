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

const db = DB();

db.init();

app.use(cors({ origin: "*", methods: "*" }));
app.use(express.json());
app.use(express.static(import.meta.dirname + "/public"));

app.post("/login", (req, res) => {
  db.checkUser(req.body)
    .then(() => {
      res.status(200).end("Login successful");
    })
    .catch((err) => {
      res.status(401).end("Login failed = " + err);
    });
});

app.post("/signup", (req, res) => {
  if (req.body.password != req.body.password_confirm)
    res.status(400).end("Passwords do not match");
  else {
    const { password_confirm, ...userData } = req.body;
    db.createUser(userData)
      .then(() => {
        res.status(201).end("Registration successful");
      })
      .catch((err) => {
        res.status(500).end("Registration failed = " + err);
      });
  }
});

app.use("/", (req, res) => {
  res.end();
});

io.use((socket, next) => {
  db.checkUser(socket.handshake.auth)
    .then((id) => {
      socket.userId = id;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

const userList = new Map();

io.on("connection", (socket) => {
  console.log("Client connected: " + socket.id);
  User.findById(socket.userId)
    .select({ _id: 1, nick: 1, profilePhotoURL: 1, roles: 1 })
    .then((result) => {
      userList.set(result.id, { ...result._doc, isOnline: true });
      io.emit("userList", Array.from(userList.values()));
    })
    .catch((err) => console.log(err));
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
    User.findByIdAndUpdate(socket.userId, { lastLoginDate: Date.now() })
      .then()
      .catch();
      userList.set(socket.userId, {
      ...userList.get(socket.userId),
      isOnline: false,
    });
    io.emit("userList", Array.from(userList.values()));
  });
});

httpServer.listen(port, () => {
  console.log("http://localhost:" + port);
});
