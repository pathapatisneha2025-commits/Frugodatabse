const express = require("express");
const router = express.Router();
const pool = require("../db"); // your PostgreSQL pool

// ================= CREATE ORDER =================
router.post("/create", async (req, res) => {
  const { userId, cartItems, subtotal, tax, discount, total, shippingInfo, paymentMethod, couponCode } = req.body;

  if (!userId || !cartItems || cartItems.length === 0 || !total) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1️⃣ Insert the order
    const result = await pool.query(
      `INSERT INTO frugorders 
       (user_id, items, subtotal, tax, discount, total, shipping_info, payment_method, coupon_code, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       RETURNING id`,
      [
        userId,
        JSON.stringify(cartItems),
        subtotal,
        tax,
        discount,
        total,
        JSON.stringify(shippingInfo),
        paymentMethod,
        couponCode || null
      ]
    );

    const orderId = result.rows[0].id;

    // 2️⃣ Clear the user's cart from backend (if you have a cart table)
    await pool.query("DELETE FROM frugcart WHERE user_id = $1", [userId]);

    // 3️⃣ Respond success
    res.json({ message: "Order placed successfully", orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM frugorders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// ================= GET USER ORDERS =================
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM frugorders WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET ORDER BY ID =================
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM frugorders WHERE id = $1", [orderId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE ORDER STATUS =================
router.put("/status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE frugorders SET status=$1, updated_at=NOW() WHERE id=$2", [status, orderId]);
    res.json({ message: "Order status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;