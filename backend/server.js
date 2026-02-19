const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", (username) => {
    socket.username = username;
    io.emit("message", {
      user: "System",
      text: `${username} joined the chat`
    });
  });

  socket.on("sendMessage", (msg) => {
    io.emit("message", {
      user: socket.username,
      text: msg
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("message", {
        user: "System",
        text: `${socket.username} left the chat`
      });
    }
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
