import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI;

async function checkInterviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const Interview = mongoose.model("Interview", new mongoose.Schema({}, { strict: false }));
    
    // Get a sample interview
    const sample = await Interview.findOne().lean();
    console.log("\n=== SAMPLE INTERVIEW ===");
    console.log(JSON.stringify(sample, null, 2));

    // Check total count
    const total = await Interview.countDocuments();
    console.log(`\n=== TOTAL INTERVIEWS: ${total} ===`);

    // Check by interviewType
    const types = await Interview.aggregate([
      { $group: { _id: "$interviewType", count: { $sum: 1 } } }
    ]);
    console.log("\n=== BY INTERVIEW TYPE ===");
    console.log(types);

    // Check by outcome.result
    const outcomes = await Interview.aggregate([
      { $group: { _id: "$outcome.result", count: { $sum: 1 } } }
    ]);
    console.log("\n=== BY OUTCOME ===");
    console.log(outcomes);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkInterviews();
