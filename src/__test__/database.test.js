const mongoose = require("mongoose");
const logger = require("../config/winston");
const { connectDB } = require("../config/database");

// Mock mongoose.connect directly using Jest
jest.mock("mongoose", () => ({
  connect: jest.fn().mockResolvedValue({
    connection: { host: "localhost" },
  }),
}));

// Mock the logger to avoid side effects
jest.mock("../config/winston", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("connectDB", () => {
  it("should connect successfully and log the connection host", async () => {
    // Execute connectDB
    await connectDB();

    // Assertions to verify correct logging
    expect(mongoose.connect).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      `MongoDB connected successfully: localhost`,
    );
  });

  it("should handle connection failure and log the error", async () => {
    // Make mongoose.connect throw an error
    const errorMessage = "Connection failed";
    mongoose.connect.mockRejectedValue(new Error(errorMessage));

    // Execute connectDB
    try {
      await connectDB();
    } catch (error) {
      // Assertions to verify error handling and logging
      expect(mongoose.connect).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        `MongoDB connection failed: ${errorMessage}`,
      );
    }
  });
});
