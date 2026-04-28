const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_req, res) =>
  res.json({ message: 'Response from backend', port: PORT, instance: process.env.HOSTNAME || 'local' })
);
app.listen(PORT, () => console.log(`Backend on ${PORT}`));
