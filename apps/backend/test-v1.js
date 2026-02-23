
const fetch = require('node-fetch');
require('dotenv').config();

async function testV1() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;

    const body = {
        contents: [{
            parts: [{ text: "Hello" }]
        }]
    };

    try {
        console.log("Testing Gemini V1 Stable Endpoint...");
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ V1 Endpoint Works!");
            console.log("Response:", data.candidates[0].content.parts[0].text);
        } else {
            console.error("❌ V1 Endpoint Failed:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

testV1();
