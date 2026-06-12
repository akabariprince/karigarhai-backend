import { Server as SocketServer } from 'socket.io';
import http from 'http';
import logger from '../shared/middleware/logger.middleware';

let io: SocketServer | null = null;

export const initSocket = (server: http.Server) => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // We can restrict this in production if needed
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Allow admin client to join the admin room for WhatsApp updates
    socket.on('join_admin_whatsapp', () => {
      socket.join('admin_whatsapp');
      logger.info(`Socket client ${socket.id} joined admin_whatsapp room`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToAdminWhatsapp = (event: string, data: any) => {
  if (io) {
    io.to('admin_whatsapp').emit(event, data);
    logger.info(`Socket.IO emit to admin_whatsapp room [${event}]`);
  }
};
