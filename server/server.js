require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[CiviCare API] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
  process.exit(1);
});

start();
