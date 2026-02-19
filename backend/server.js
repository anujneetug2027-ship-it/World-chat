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

// Function to clean messages older than 24 hours
function cleanOldMessages() {
  const now = Date.now();
  messages = messages.filter(msg => now - msg.createdAt < 24 * 60 * 60 * 1000);
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    if (!username) return;

    users[socket.id] = username;

    cleanOldMessages();

    // Send only last 10 messages
    const lastMessages = messages.slice(-10);
    socket.emit("oldMessages", lastMessages);

    io.emit("message", {
      user: "System",
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("sendMessage", (msg) => {
    const username = users[socket.id];
    if (!username || !msg.trim()) return;

    cleanOldMessages();

    const messageData = {
      user: username,
      text: msg,
      time: new Date().toLocaleTimeString(),
      createdAt: Date.now()
    };

    messages.push(messageData);

    // Keep only last 10 stored
    if (messages.length > 10) {
      messages.shift();
    }

    io.emit("message", messageData);
  });

  socket.on("clearChat", () => {
    messages = [];
    io.emit("chatCleared");
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      io.emit("message", {
        user: "System",
        text: `${username} left the chat`,
        time: new Date().toLocaleTimeString()
      });
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
