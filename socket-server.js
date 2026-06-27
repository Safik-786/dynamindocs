const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;

const io = new Server(PORT, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a document room
  socket.on("join-document", (documentId) => {
    socket.join(documentId);
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  // Handle Yjs updates
  socket.on("yjs-update", ({ documentId, update }) => {
    // Broadcast the update to everyone else in the document room
    // The update is a base64 string
    socket.to(documentId).emit("yjs-update", update);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
