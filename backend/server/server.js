const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const mongoose = require("mongoose");

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

mongoose.connect("mongodb://localhost:27017/");

app.use(express.static(__dirname + "/public"));

app.use("/", (req, res) => {
  res.end();
});

httpServer.listen(port, () => {
  console.log("http://localhost:" + port);
});
