const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let messages = [];
let users = {}; // socket.id -> username

app.use(express.static(path.join(__dirname, "../frontend")));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    if (!username) return;

    users[socket.id] = username;

    // Send old messages ONLY to this user
    socket.emit("oldMessages", messages);

    // Notify others (not duplicate for same reconnect)
    io.emit("message", {
      user: "System",
      text: `${username} joined the chat`
    });
  });

  socket.on("sendMessage", (msg) => {
    const username = users[socket.id];
    if (!username || !msg.trim()) return;

    const messageData = {
      user: username,
      text: msg
    };

    messages.push(messageData);

    // Keep only last 200 messages
    if (messages.length > 200) {
      messages.shift();
    }

    io.emit("message", messageData);
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      io.emit("message", {
        user: "System",
        text: `${username} left the chat`
      });
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
