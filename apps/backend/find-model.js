
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const commonModels = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.0-pro",
        "gemini-pro"
    ];

    console.log("Checking for working models...");

    for (const name of commonModels) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("test");
            if (result.response) {
                console.log(`✅ FOUND WORKING MODEL: ${name}`);
                return;
            }
        } catch (err) {
            console.log(`❌ ${name} failed: ${err.message}`);
        }
    }
    console.log("No common models found. This API key might have restricted access or the Generative Language API is not enabled.");
}

findWorkingModel();
