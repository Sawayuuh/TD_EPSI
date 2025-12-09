const express = require('express');
const { Pool } = require('pg');
const app = express();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.get('/status', (req, res) => res.send('OK'));
app.get('/items', async (req, res) => {
  const result = await pool.query('SELECT * FROM items');
  res.json(result.rows);
});

app.listen(process.env.PORT);
