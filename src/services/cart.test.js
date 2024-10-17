// services/cart.js (example unit tests)

const connectToDb = require("../db");
const { getProductById } = require("./products");
const { getUserById } = require("./users");
const { ObjectId } = require("mongodb");
const { showCartItems, addToCart, removeFromCart } = require("./cart");

jest.mock("../db");
jest.mock("./products");
jest.mock("./users");
jest.spyOn(console, 'error').mockImplementation(() => { });
describe("Cart Service", () => {
  let db;

  beforeEach(async () => {
    db = {
      collection: jest.fn().mockReturnThis(),
      updateOne: jest.fn(),
      findOne: jest.fn(),
    };
    connectToDb.mockResolvedValue(db);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("showCartItems", () => {
    it("should return cart items for a user", async () => {
      const userId = new ObjectId(); // Using ObjectId for userId
      const product1 = { _id: new ObjectId(), name: "Product 1" };
      const product2 = { _id: new ObjectId(), name: "Product 2" };
      getUserById.mockResolvedValue({ cartItems: [product1._id, product2._id] });
      getProductById.mockResolvedValueOnce(product1).mockResolvedValueOnce(product2);

      const cartItems = await showCartItems(userId);

      expect(cartItems).toEqual([product1, product2]);
    });

    it("should throw an error if user is not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(showCartItems(new ObjectId())).rejects.toThrow("User not found");
    });
  });

  describe("addToCart", () => {
    it("should add a product to the user's cart", async () => {
      const userId = new ObjectId(); // Using ObjectId for userId
      const productId = new ObjectId();
      const product = { _id: productId, name: "Test Product" };
      getUserById.mockResolvedValue({ cartItems: [] });
      getProductById.mockResolvedValue(product);
      db.collection().updateOne.mockResolvedValue({ modifiedCount: 1 });

      const updatedCart = await addToCart(userId, productId);

      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection().updateOne).toHaveBeenCalledWith(
        { _id: userId }, // No need for new ObjectId(userId) here
        { $addToSet: { cartItems: product._id } }
      );
      expect(updatedCart).toBeDefined(); // Check that showCartItems is called
    });

    it("should throw an error if product is already in cart", async () => {
      const userId = new ObjectId();
      const productId = new ObjectId();
      const product = { _id: productId, name: "Test Product" };

      // Add console logs for debugging
      console.log("Before getUserById mock:", userId);
      getUserById.mockResolvedValue({ cartItems: [productId] });
      console.log("After getUserById mock");

      console.log("Before getProductById mock:", productId);
      getProductById.mockResolvedValue(product);
      console.log("After getProductById mock");

      try {
        await addToCart(userId, productId);
      } catch (error) {
        console.error("Error thrown:", error); // Log the actual error
        expect(error.message).toBe("Product already in cart"); // Check the error message
      }
    });
    // Add more tests for other scenarios (user not found, product not found, etc.)
  });

  describe("removeFromCart", () => {
    it("should remove a product from the user's cart", async () => {
      const userId = new ObjectId(); // Using ObjectId for userId
      const productId = new ObjectId();
      getUserById.mockResolvedValue({ cartItems: [productId] });
      db.collection().updateOne.mockResolvedValue({ modifiedCount: 1 });

      const updatedCart = await removeFromCart(userId, productId);

      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection().updateOne).toHaveBeenCalledWith(
        { _id: userId }, // No need for new ObjectId(userId) here
        { $pull: { cartItems: productId } } // No need for new ObjectId(productId) here
      );
      expect(updatedCart).toBeDefined(); // Check that showCartItems is called
    });

    // Add more tests for other scenarios (user not found, product not in cart, etc.)
  });
});