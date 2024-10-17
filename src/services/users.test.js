// services/users.js (example unit tests)

const connectToDb = require("../db");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { createUser, getUserById, getUserByEmail, hashPassword, comparePasswords, blacklistToken } = require("./users");

jest.mock("../db");
jest.mock("bcrypt");
jest.spyOn(console, 'error').mockImplementation(() => { });

describe("User Service", () => {
  let db;

  beforeEach(async () => {
    db = {
      collection: jest.fn().mockReturnThis(),
      insertOne: jest.fn(),
      findOne: jest.fn(),
    };
    connectToDb.mockResolvedValue(db);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
      };
      bcrypt.hashSync.mockReturnValue("hashedPassword");
      db.collection().insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      const newUser = await createUser(userData);

      expect(bcrypt.hashSync).toHaveBeenCalledWith(userData.password, 10);
      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection().insertOne).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        hashedPassword: "hashedPassword",
        cartItems: [],
      });
      expect(newUser).toBeDefined();
    });

    // Add a test case for when insertOne fails
    it("should handle database errors during user creation", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
      };
      db.collection().insertOne.mockRejectedValue(new Error("Database error"));

      await expect(createUser(userData)).rejects.toThrow("Database error");
    });
  });

  describe("getUserById", () => {
    it("should retrieve a user by ID", async () => {
      const userId = new ObjectId();
      const user = { _id: userId, name: "Test User", email: "test@example.com" };
      db.collection().findOne.mockResolvedValue(user);

      const retrievedUser = await getUserById(userId);

      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection().findOne).toHaveBeenCalledWith({ _id: userId });
      expect(retrievedUser).toEqual({ ...user, id: userId.toString() });
    });

    it("should throw an error if user is not found", async () => {
      db.collection().findOne.mockResolvedValue(null);

      await expect(getUserById(new ObjectId())).rejects.toThrow("User not found");
    });
  });

  describe("getUserByEmail", () => {
    it("should retrieve a user by email", async () => {
      const email = "test@example.com";
      const user = { _id: new ObjectId(), name: "Test User", email };
      db.collection().findOne.mockResolvedValue(user);

      const retrievedUser = await getUserByEmail(email);

      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection().findOne).toHaveBeenCalledWith({ email });
      expect(retrievedUser).toEqual({ ...user, _id: user._id.toString() });
    });

    it("should return null if user is not found", async () => {
      db.collection().findOne.mockResolvedValue(null);

      const retrievedUser = await getUserByEmail("test@example.com");

      expect(retrievedUser).toBeNull();
    });
  });

  // ... add tests for hashPassword, comparePasswords, and blacklistToken ...
});