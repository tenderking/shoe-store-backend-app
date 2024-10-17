const { MongoClient } = require("mongodb")
require("dotenv").config()

const url = process.env.MONGODB_URI

const client = new MongoClient(url)

// Database Name
const dbName = process.env.DB_NAME

async function connectToDb() {
  // Use connect method to connect to the server
  await client.connect()
  console.log("Connected successfully to server")
  const db = client.db(dbName)
  console.log("Connected to database")

  return db
}



module.exports = connectToDb
