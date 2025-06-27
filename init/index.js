const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing");
require("dotenv").config();


const MONGO_URL = process.env.MONGODB_URI;
async function main() {
  try {
    await mongoose.connect(
      MONGO_URL
    );
    console.log("Connected to DB");

    await initDB(); // ✅ Only run after successful DB connection
    mongoose.connection.close(); // ✅ Close the connection
  } catch (err) {
    console.error("Error:", err);
  }
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("Data Was initialized");
  } catch (err) {
    console.error("Data initialization failed:", err);
  }
};

main(); // ✅ Kick off the async process
