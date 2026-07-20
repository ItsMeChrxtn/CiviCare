const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---------- Security ----------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(apiLimiter);

// ---------- Body parsing ----------
// Larger JSON limit accommodates the admin backup/restore JSON payload.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---------- Sanitization ----------
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ---------- Logging ----------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ---------- Routes ----------
app.get('/', (_req, res) => res.status(200).json({ success: true, message: 'Welcome to the CiviCare API' }));
app.use('/api', routes);

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
