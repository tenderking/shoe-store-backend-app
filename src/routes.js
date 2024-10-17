// routes.js
const express = require("express");
const { showCartItems, addToCart, removeFromCart } = require("./services/cart");
const { getAllProducts, getProductById } = require("./services/products");
const { getUserByEmail, createUser, comparePasswords, blacklistToken } = require("./services/users");
const auth = require("./middleware/auth");
const jwt = require("jsonwebtoken");
const jsend = require("jsend");
const router = express.Router();
router.use(jsend.middleware);
const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

// Home route
router.get("/", (req, res) => {
  res.send("Hello World!");
});

// Get all products
router.get("/api/products", async (req, res, next) => {
  try {
    const products = await getAllProducts(BASE_URL);
    res.jsend.success(products);
  } catch (err) {
    next(err);
  }
});

// Get product by ID
router.get("/api/products/:productId", async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await getProductById(productId, BASE_URL);
    if (product) {
      res.jsend.success(product);
    } else {
      res.jsend.fail({ message: "Product not found" });
    }
  } catch (err) {
    next(err);
  }
});

// Get user cart
router.get("/api/users/:userId/cart", auth, async (req, res, next) => {
  const { userId } = req.params;
  try {
    const cartItems = await showCartItems(userId);
    res.jsend.success(cartItems);
  } catch (err) {
    next(err);
  }
});

// Add to cart
router.post("/api/users/:userId/cart", auth, async (req, res, next) => {
  const { userId } = req.params;
  const { productId } = req.body;
  try {
    const updatedCart = await addToCart(userId, productId);
    res.jsend.success(updatedCart);
  } catch (err) {
    next(err);
  }
});

// Remove from cart
router.delete("/api/users/:userId/cart/:productId", auth, async (req, res, next) => {
  const { userId, productId } = req.params;
  try {
    const updatedCart = await removeFromCart(userId, productId);
    res.jsend.success(updatedCart);
  } catch (err) {
    next(err);
  }
});

router.post("/signup", async (req, res, next) => {

  const { email, password, name } = req.body;

  try {

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.jsend.fail({ message: "Email is already registered." });
    }


    const newUser = await createUser({
      name, email, password
    });

    let token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.jsend.success({
      userId: newUser._id,
      email: newUser.email,
      token: token
    });

  } catch (err) {
    next(err);
  }
});

// Post for registered users to be able to login
router.post("/login", async (req, res, next) => {

  // #swagger.tags = ['Login / Signup']
  // #swagger.produces = ['text/html']

  let { email, password } = req.body;

  try {

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return res.status(401).jsend.fail({
        code: 401,
        message: "User not found with the provided email."
      });
    }

    const isPasswordValid = await comparePasswords(password, existingUser.hashedPassword.toString());

    if (!isPasswordValid) {
      return res.jsend.fail({
        code: 401,
        message: "Wrong password, please check your credentials."
      });
    }

    let token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.jsend.success({
      userId: existingUser._id,
      email: existingUser.email,
      token: token
    });

  } catch (err) {
    next(err);
  }
});

router.post("/logout", auth, async (req, res, next) => {
  try {
    // 1. Blacklist the Token (Optional but Recommended)
    const token = req.headers.authorization.split(" ")[1]; // Assuming "Bearer <token>" format
    await blacklistToken(token); // Add token to a blacklist (database, Redis, etc.)

    // 2. Clear the Cookie (if used)
    res.clearCookie('jwt'); // Or the name of your JWT cookie

    // 3. (For Frontend) Instruct the Client to Remove Token
    res.jsend.success({ message: "Logout successful" }); // Send a success response

  } catch (err) {
    next(err);
  }
});
module.exports = router;
