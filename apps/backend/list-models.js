
const fetch = require('node-fetch');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;

    try {
        console.log("Fetching available models for this API key...");
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log("✅ Models Retrieved Successfully:");
            if (data.models && data.models.length > 0) {
                data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
            } else {
                console.log("No models available for this key.");
            }
        } else {
            console.error("❌ Failed to list models:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

listModels();
