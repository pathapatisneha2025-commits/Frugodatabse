const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL pool
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("../cloudinary"); // cloudinary config

/* ================================
   MULTER MEMORY STORAGE
================================ */
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

/* ================================
   CLOUDINARY UPLOAD HELPER
================================ */
const uploadToCloudinary = (buffer, folder = "frugo-products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

/* ======================================================
   ADD PRODUCT
====================================================== */
// ADD
router.post("/add", async (req, res) => {
  const { name, category, price, stock, unit, image, description, status, tag } = req.body;

  const result = await pool.query(
    `INSERT INTO frugo_products 
    (name, category, price, stock, unit, image, description, status, tag)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [name, category, price, stock, unit, image, description, status, tag]
  );

  res.json(result.rows[0]);
});

/* ======================================================
   UPDATE PRODUCT
====================================================== */

router.put("/update/:id", async (req, res) => {
  const { name, category, price, stock, unit, image, description, status, tag } = req.body;

  const result = await pool.query(
    `UPDATE frugo_products SET 
    name=$1, category=$2, price=$3, stock=$4, unit=$5, image=$6, description=$7, status=$8, tag=$9
    WHERE id=$10 RETURNING *`,
    [name, category, price, stock, unit, image, description, status, tag, req.params.id]
  );

  res.json(result.rows[0]);
});

/* ======================================================
   GET ALL PRODUCTS
====================================================== */
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM frugo_products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   GET PRODUCT BY ID
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM frugo_products WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   DELETE PRODUCT
====================================================== */
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM frugo_products WHERE id=$1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   SEARCH PRODUCTS
====================================================== */
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(
      "SELECT * FROM frugo_products WHERE LOWER(name) LIKE $1 ORDER BY id ASC",
      [`%${query.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;