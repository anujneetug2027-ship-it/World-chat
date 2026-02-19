const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store messages temporarily in memory
let messages = [];

// Serve frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", (username) => {
    socket.username = username;

    // Send old messages only to this user
    socket.emit("oldMessages", messages);

    // Notify everyone
    io.emit("message", {
      user: "System",
      text: `${username} joined the chat`
    });
  });

  socket.on("sendMessage", (msg) => {
    if (!socket.username) return;

    const messageData = {
      user: socket.username,
      text: msg
    };

    // Save message in memory
    messages.push(messageData);

    // Optional: limit memory to last 100 messages
    if (messages.length > 100) {
      messages.shift();
    }

    // Broadcast to all users
    io.emit("message", messageData);
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

// Use dynamic port for Render deployment
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
