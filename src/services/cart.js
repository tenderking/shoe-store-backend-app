// cart.js
const connectToDb = require("../db");

async function showCartItems(userId) {
  const db = await connectToDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  const cartItemsIds = user.cartItems;
  const products = await db.collection("products").find({}).toArray();
  const cartItems = cartItemsIds.map((id) => products.find((product) => product.id === id));
  return cartItems;
}

async function addToCart(userId, productId) {
  const db = await connectToDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { cartItems: productId } }
  );
  return await showCartItems(userId);
}

async function removeFromCart(userId, productId) {
  const db = await connectToDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { cartItems: productId } }
  );
  return await showCartItems(userId);
}

module.exports = { showCartItems, addToCart, removeFromCart };
