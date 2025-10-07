// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
// in-memory (simple) store
let users = {}; // socket.id -> username
let messages = []; // last 100 messages
io.on('connection', (socket) => {
console.log('New socket:', socket.id);
socket.on('join', (username) => {
users[socket.id] = username || 'Anonymous';
socket.broadcast.emit('user-joined', users[socket.id]);
// send chat history to the new user
socket.emit('chat-history', messages);
});
socket.on('chat-message', (text) => {
const msg = {
user: users[socket.id] || 'Anonymous',
text: text,
time: new Date().toISOString()
};
messages.push(msg);
if (messages.length > 100) messages.shift();
io.emit('chat-message', msg); // broadcast to all
});
socket.on('typing', (isTyping) => {
socket.broadcast.emit('typing', { user: users[socket.id], isTyping });
});
socket.on('disconnect', () => {
const name = users[socket.id];
delete users[socket.id];
if (name) socket.broadcast.emit('user-left', name);
console.log('Disconnected:', socket.id);
});
});
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
