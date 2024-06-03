const express = require("express")
const app = express()
const path = require("path")
const connectToDb = require("./db")
const cors = require('cors');
const { ObjectId } = require("mongodb")
require("dotenv").config()
PORT = process.env.PORT || 8000
BASE_URL = process.env.BASE_URL || "http://localhost:8000"

// our first Route

app.use(express.json())
app.use(cors(
  {origin: 'http://localhost:5173'}
))
app.use("/images", express.static(path.join(__dirname, "../assets")))

app.get("/api/products", async (req, res) => {
  try {
    const db = await connectToDb()
    const products = await db.collection("products").find({}).toArray()

productsWithImages= products.map((product) => {
  return {
    ...product,
    imageUrl: `${BASE_URL}/images/${product.imageUrl}`,
  }
})
    res.status(200).json(productsWithImages);
  } catch (e) {
    console.log(e)
  }
})

app.get("/api/users/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params
    cartItems = await showCartItems(userId)
    cartItems= await cartItems.map((product) => {
      return {
        ...product,
        imageUrl: `${BASE_URL}/images/${product.imageUrl}`,
      }
    })

    res.status(200).json(cartItems)
  } catch (e) {
    console.log(e)
  }
})

app.get("/api/products/:productId", async (req, res) => {
  const { productId } = req.params
  const db = await connectToDb()
  const product = await db.collection("products").findOne({ id: productId })
  if (product) {
    product.imageUrl = `${BASE_URL}/images/${product.imageUrl}`
    res.status(200).json((product))
  } else {
    res.status(404).json("Could not find the product!")
  }
})

app.post("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params
  const productId = req.body.productId
  console.log(productId)
  const db = await connectToDb()
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $addToSet: { cartItems: productId },
    }
  )
  cartItems = await showCartItems(userId)

  res.status(200).json(cartItems)
})

app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  const { userId, productId } = req.params

  if (!ObjectId.isValid(userId) || !productId) {
    return res.status(400).json({ message: "Invalid userId or productId" })
  }

  try {
    const db = await connectToDb()
    const updateResult = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { cartItems: productId } }
      )

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const cartItems = await showCartItems(userId)

    return res.status(200).json(cartItems)
  } catch (error) {
    console.error("Error handling delete request:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
  
})
app.listen(PORT, () => console.log("listening on port " + PORT + "!"))

async function showCartItems(userId) {
  const db = await connectToDb()
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) })
  const cartItemsIds = user.cartItems
  const products = await db.collection("products").find({}).toArray()
  const cartItems = cartItemsIds.map((id) =>
    products.find((product) => product.id === id)
  )
  return cartItems
}

