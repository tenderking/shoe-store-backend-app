// product.js
const connectToDb = require("../db");
const { ObjectId } = require("mongodb");
async function getAllProducts(baseUrl) {
  try {
    const db = await connectToDb();
    const products = await db.collection("products").find({}).toArray();
    return products.map((product) => ({
      ...product,
      imageUrl: `${baseUrl}/images/${product.imageUrl}`,
    }));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return { status: "error", message: error.message }
  }
}

async function getProductById(productId, baseUrl) {
  try {
    const db = await connectToDb();
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });
    if (product) {
      product.imageUrl = `${baseUrl}/images/${product.imageUrl}`;
      return product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return { status: "error", message: error.message }
  }
}

module.exports = { getAllProducts, getProductById };
