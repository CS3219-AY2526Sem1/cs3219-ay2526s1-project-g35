const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const analyticsRoutes = require('./routes/analytics.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { buildCorsConfig } = require('./utils/cors');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(buildCorsConfig()));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
