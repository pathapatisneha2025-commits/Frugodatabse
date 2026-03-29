const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection

// ================= Add to Cart =================
router.post('/add', async (req, res) => {
  const { userId, productId, productName, price, unit, quantity, image } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO frugocart (user_id, product_id, product_name, price, unit, quantity, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(user_id, product_id)
       DO UPDATE SET quantity = frugocart.quantity + EXCLUDED.quantity, updated_at = NOW()`,
      [userId, productId, productName, price, unit, quantity, image]
    );
    res.json({ message: 'Added to cart successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Get Cart =================
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM frugocart WHERE user_id = $1`,
      [userId]
    );
    res.json({ cartItems: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Update Quantity =================
router.put('/update', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || quantity === undefined) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    if (quantity <= 0) {
      await pool.query(
        `DELETE FROM frugocart WHERE user_id = $1 AND product_id = $2`,
        [userId, productId]
      );
      return res.json({ message: 'Item removed from cart' });
    }

    await pool.query(
      `UPDATE frugocart SET quantity = $3, updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId, quantity]
    );
    res.json({ message: 'Quantity updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Remove Item =================
router.delete('/remove', async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    await pool.query(
      `DELETE FROM frugocart WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Clear Cart =================
router.delete('/clear/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query(
      `DELETE FROM frugocart WHERE user_id = $1`,
      [userId]
    );
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;