const connectToDb = require("../db");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

async function createUser({ name, email, password }) {
  const db = await connectToDb();
  const user = await db.collection("users").insertOne({ name, email, hashedPassword: hashPassword(password), cartItems: [] });
  return user;
}

async function getUserById(userId) {
  const db = await connectToDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }
  return { ...user, id: user._id.toString() };
}

async function getUserByEmail(email) {
  const db = await connectToDb();
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    return null;
  }
  return { ...user, _id: user._id.toString() };
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePasswords(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

async function blacklistToken(token) {
  const db = await connectToDb();
  if (await db.collection("blacklist").findOne({ token })) {
    return;
  }
  await db.collection("blacklist").insertOne({ token });
}
module.exports = { createUser, getUserById, getUserByEmail, hashPassword, comparePasswords, blacklistToken };