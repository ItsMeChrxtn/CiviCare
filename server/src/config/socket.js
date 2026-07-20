const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initializes Socket.IO on top of the HTTP server.
 * Clients authenticate with their JWT access token and are placed into
 * a room named after their user id + a room named after their role,
 * so events can be targeted at one user or broadcast to a whole role.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.role}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
      socket.leave(`role:${socket.role}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

/** Emit an event to a single user's room */
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/** Emit an event to every socket belonging to a role (e.g. all officials) */
const emitToRole = (role, event, payload) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
};

/** Broadcast an event to every connected client */
const emitToAll = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToRole, emitToAll };
