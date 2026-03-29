const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');


// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, Email and Password are required',
      });
    }

    // Check user exists
    const userExist = await pool.query(
      'SELECT * FROM frugo_users WHERE email=$1',
      [email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO frugo_users(name, email, password, phone)
       VALUES($1, $2, $3, $4)
       RETURNING id, name, email, phone`,
      [name, email, hashedPassword, phone]
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: newUser.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      'SELECT * FROM frugo_users WHERE email=$1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ================= GET USER BY ID =================
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      'SELECT id, name, email, phone, created_at FROM frugo_users WHERE id=$1',
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: user.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ================= UPDATE USER =================
router.put('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const updatedUser = await pool.query(
      `UPDATE frugo_users
       SET name=$1, phone=$2, updated_at=CURRENT_TIMESTAMP
       WHERE id=$3
       RETURNING id, name, email, phone`,
      [name, phone, id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;