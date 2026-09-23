const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173' // Frontend URL mattum allow pandrom
}));
app.use(express.json());

app.use('/api', fileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler - never leaks raw SQL/db errors to the client.
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Something went wrong. Please try again.';

  if (!err.statusCode) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
