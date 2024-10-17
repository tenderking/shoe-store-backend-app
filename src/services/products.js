// product.js
const connectToDb = require("../db");

async function getAllProducts(baseUrl) {
  const db = await connectToDb();
  const products = await db.collection("products").find({}).toArray();
  return products.map((product) => ({
    ...product,
    imageUrl: `${baseUrl}/images/${product.imageUrl}`,
  }));
}

async function getProductById(productId, baseUrl) {
  const db = await connectToDb();
  const product = await db.collection("products").findOne({ id: productId });
  if (product) {
    product.imageUrl = `${baseUrl}/images/${product.imageUrl}`;
    return product;
  }
  return null;
}

module.exports = { getAllProducts, getProductById };
