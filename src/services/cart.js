// cart.js
const connectToDb = require("../db");
const { getProductById } = require("./products");
const { getUserById } = require("./users");
const { ObjectId } = require("mongodb");
const BASE_URL = process.env.BASE_URL

async function showCartItems(userId) {
  try {
    const user = await getUserById(userId.toString());
    if (!user) {
      throw new Error("User not found");
    }
    const cartItemsIds = user.cartItems;
    const cartItems = await Promise.all(
      cartItemsIds.map((productId) => getProductById(productId, BASE_URL))
    );
    return cartItems;
  } catch (error) {
    console.error("Error showing cart items:", error);
    throw error;
  }
}
async function addToCart(userId, productId) {
  try {
    const product = await getProductById(productId, BASE_URL);
    const user = await getUserById(userId.toString());

    if (!user) {
      throw new Error("User not found");
    }

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product is already in cart BEFORE attempting to update
    if (user.cartItems.some(item => item.toString() === productId.toString())) {
      throw new Error("Product already in cart");
    }

    const db = await connectToDb();
    const updateResult = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { cartItems: product._id } }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to add product to cart");
    }

    return await showCartItems(userId);
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}
async function removeFromCart(userId, productId) {
  try {
    const db = await connectToDb();
    // check if product exists in the user's cart
    const user = await getUserById(userId.toString());
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.cartItems.map(id => id.toString()).includes(productId.toString())) {
      throw new Error("Product not in cart");
    }

    // remove product from the user's cart
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { cartItems: new ObjectId(productId) } }
    );

    return await showCartItems(userId);

  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error
  }
}

module.exports = { showCartItems, addToCart, removeFromCart };
