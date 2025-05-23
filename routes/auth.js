const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login API (GET with query params)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Login successful', user: result.rows[0] });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
  // Get all users (for testing)
  router.get('/users', async (req, res) => {
    try {
      const result = await pool.query('SELECT id, email, username FROM users.');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Add Task Route
router.post('/activity', async (req, res) => {
  const { taskname, category, comment, fromdate, todate } = req.body;

  // Basic validation
  // if (!task_name || !category || !from_date || !to_date) {
  //   return res.status(400).json({ message: 'Missing required fields' });
  // }

  try {
    const result = await pool.query(
      `INSERT INTO activity (taskname, category, comment, fromdate, todate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [taskname, category, comment, fromdate, todate]
    );
    res.status(201).json({ message: 'Task created', task: result.rows[0] });
  } catch (err) {
    console.error('Error inserting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update Task Route
router.put('/activity', async (req, res) => {
  const { id } = req.params;
  const { taskname, category, comment, fromdate, todate } = req.body;

  // Basic validation
  // if (!taskname || !category || !fromdate || !todate) {
  //   return res.status(400).json({ message: 'Missing required fields' });
  // }

  try {
    const result = await pool.query(
      `UPDATE activity
       SET taskname = $1, category = $2, comment = $3, fromdate = $4, todate = $5
       WHERE taskname = $1
       RETURNING *`,
      [taskname, category, comment, fromdate, todate]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task updated', task: result.rows[0] });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete Task Route with existence check
router.delete('/activity', async (req, res) => {
  const { taskname } = req.params;

  try {
    // First, check if the task exists
    const check = await pool.query(
      `SELECT * FROM activity WHERE taskname = $1`,
      [taskname]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If exists, delete it
    const result = await pool.query(
      `DELETE FROM activity WHERE taskname = $1 RETURNING *`,
      [taskname]
    );

    res.status(200).json({ message: 'Task deleted successfully', task: result.rows[0] });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



























module.exports = router;
