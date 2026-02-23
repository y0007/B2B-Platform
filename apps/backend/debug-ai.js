
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testAnalysis() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const modelName = "gemini-2.5-flash"; // testing the one used in index.js
    console.log(`Testing with model: ${modelName}`);

    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = "What is in this image? Return JSON: {\"item\":\"string\"}";

    // Check if there is any image in uploads to test with
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png'));

    if (!imageFile) {
        console.error("No image file found in uploads to test with.");
        return;
    }

    const filePath = path.join(uploadsDir, imageFile);
    console.log(`Using test image: ${filePath}`);

    const imagePart = {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType: "image/jpeg"
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        console.log("✅ Analysis Result:");
        console.log(response.text());
    } catch (err) {
        console.error("❌ Analysis Failed:");
        console.error(err.message);
        if (err.response) console.error(JSON.stringify(err.response, null, 2));
    }
}

testAnalysis();
