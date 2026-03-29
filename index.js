const express = require("express");
const cors = require("cors");
const FrugoUsers = require("./routes/user");
const Frugocart = require("./routes/cart");
const Frugoorders= require("./routes/orders");
const Frugoproducts= require("./routes/products");





const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/users",FrugoUsers);
app.use("/cart",Frugocart);
app.use("/orders",Frugoorders);
app.use("/products",Frugoproducts);





// Test Route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
