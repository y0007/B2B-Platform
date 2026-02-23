
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModels() {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("Using API Key starting with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : "MISSING");

    for (const modelName of models) {
        try {
            console.log(`\nTesting connectivity with '${modelName}'...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Respond with 'OK' if you can read this.");
            console.log(`✅ ${modelName} Response:`, result.response.text());
        } catch (err) {
            console.error(`❌ ${modelName} Failed:`, err.message);
        }
    }
}

testModels();
