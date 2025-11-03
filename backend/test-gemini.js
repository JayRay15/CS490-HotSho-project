import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("Testing Gemini API key and listing available models...\n");
    
    // Try different model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.0-pro",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}: ${text.substring(0, 50)}...\n`);
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed with ${modelName}: ${err.message}\n`);
      }
    }
    
    console.log("\n❌ No working model found. Your API key might be invalid or restricted.");
    console.log("Please verify your API key at: https://aistudio.google.com/app/apikey");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
