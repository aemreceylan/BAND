const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(__dirname + "/public"));

app.use("/", (req, res) => {
  res.end();
});

io.on("connection", (socket) => {
  console.log(io.engine.clientsCount);

  socket.emit("first_message", "selam selam", (response) => {
    console.log(response);
  });

  socket.on("disconnect", (socket) => {
    console.log("disconnect");
  });
});

httpServer.listen(port, () => {
  console.log("http://localhost:" + port);
});
