const { searchByImage } = require('./src/services/alibaba-visual-bot');
const path = require('path');
const fs = require('fs');

async function test() {
    console.log(">>> STARTING BOT TEST <<<");

    // Use a dummy image from the uploads folder if it exists, or create one?
    // Let's assume there is at least one file in uploads, or fail gracefully
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    // Find a jpg/png to test with
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

    if (files.length === 0) {
        console.log("No images found in uploads/ to test. Please manually put an image there.");
        return;
    }

    const testImage = path.join(uploadDir, files[0]);
    console.log(`Testing with image: ${testImage}`);

    try {
        const results = await searchByImage(testImage);
        console.log(">>> BOT SUCCESS <<<");
        console.log("Results found:", results.length);
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(">>> BOT FAILED <<<");
        console.error(e);
    }
}

test();
