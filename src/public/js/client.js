// Connect to the Socket.IO server
const socket = io();

socket.on('connect', () => {
  console.log('connected, id=', socket.id);
});

socket.on('message', (msg) => {
  console.log('message from server:', msg);
  const el = document.getElementById('msg');
  if (el) el.textContent = msg;
  // send a reply back
  socket.emit('pong', { received: true, time: Date.now() });
});

socket.on('disconnect', (reason) => {
  console.log('disconnected:', reason);
  const el = document.getElementById('msg');
  if (el) el.textContent = 'Disconnected';
});
