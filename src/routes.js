// routes.js
const express = require("express");
const { showCartItems, addToCart, removeFromCart } = require("./services/cart");
const { getAllProducts, getProductById } = require("./services/products");
const { getUserByEmail, createUser, comparePasswords, blacklistToken } = require("./services/users");
const auth = require("./middleware/auth");
const jwt = require("jsonwebtoken");
const jsend = require("jsend");
const cookieParser = require("cookie-parser");
const router = express.Router();
router.use(jsend.middleware);
router.use(cookieParser());
const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

// Home route
router.get("/", (req, res) => {
  res.status(200).send("Hello World!");
});

// Get all products
router.get("/api/products", async (req, res, next) => {
  try {
    const products = await getAllProducts(BASE_URL);
    res.status(200).jsend.success(products);
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
      res.status(200).jsend.success(product);
    } else {
      res.status(404).jsend.fail({ message: "Product not found" });
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
    res.status(200).jsend.success(cartItems);
  } catch (err) {
    next(err);
  }
})
router.post("/api/users/:userId/cart", auth, async (req, res, next) => {
  const { userId } = req.params;
  const { productId } = req.body;

  try {
    const updatedCart = await addToCart(userId, productId);
    res.status(201).jsend.success(updatedCart);
  } catch (err) {
    // More specific error handling
    if (err.message === "Product already in cart") {
      res.status(400).jsend.fail({ message: err.message });
    } else {
      next(err); // Pass other errors to the error handling middleware
    }
  }
});

// Remove from cart
router.delete("/api/users/:userId/cart/:productId", auth, async (req, res, next) => {
  const { userId, productId } = req.params;
  try {
    const updatedCart = await removeFromCart(userId, productId);
    res.status(204).jsend.success(updatedCart);
  } catch (err) {
    next(err);
  }
});

router.post("/signup", async (req, res, next) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).jsend.fail({ message: "Email is already registered." });
    }

    const newUser = await createUser({ name, email, password });

    let token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).jsend.success({
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
      return res.status(401).jsend.fail({
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
    res.cookie('jwt', token, {
      httpOnly: true, // Prevent client-side JavaScript access 
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 3600000 // 1 hour (same as token expiration)
    });
    console.log({ userId: existingUser._id, email: existingUser.email, token: token });
    return res.status(200).jsend.success({
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
    const token = req.headers.authorization; // Assuming "Bearer <token>" format
    await blacklistToken(token); // Add token to a blacklist (database, Redis, etc.)

    res.clearCookie('jwt'); // Or the name of your JWT cookie

    res.status(200).jsend.success({ message: "Logout successful" });

  } catch (err) {
    next(err);
  }
});

router.get("/token", auth, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Token is invalid');
    }
    res.status(200).jsend.success({ message: "Token is valid" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
