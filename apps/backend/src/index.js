require('dotenv').config(); // MUST be first — loads .env before any module that reads process.env

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { initClient, query } = require("./db-client");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const { searchByImage, initBot, closeBot } = require('./services/alibaba-visual-bot');

// Proactively warm up the browser instance for faster first-time search
initBot().catch(err => console.error("[Bot] Failed to pre-warm browser:", err.message));

// Ensure browser is closed if server process terminates
process.on('SIGINT', async () => {
  console.log("[Server] Closing browser...");
  await closeBot();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log("[Server] Closing browser...");
  await closeBot();
  process.exit(0);
});


const logFile = path.join(__dirname, '../server.log');
const log = (msg) => {
  const line = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
};
log(">>> SERVER STARTING <<<");

// --- Configuration ---
// Alibaba Cloud Image Search
const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const ALIBABA_IMAGE_SEARCH_INSTANCE = process.env.ALIBABA_IMAGE_SEARCH_INSTANCE || 'default';
const ALIBABA_REGION = process.env.ALIBABA_REGION || 'ap-southeast-1';

// Company Internal Inventory Search API
const COMPANY_INVENTORY_API_URL = process.env.COMPANY_INVENTORY_API_URL;
const COMPANY_API_KEY = process.env.COMPANY_API_KEY;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'alibaba-datahub.p.rapidapi.com';
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;




// --- Helper: Dynamic Margin Calculation ---
const calculatePrice = async (baseCost, category = 'default') => {
  try {
    const { rows } = await query("SELECT config_value FROM system_settings WHERE config_key='margins'");
    const settings = rows.length > 0 ? rows[0].config_value : { default: 20, categories: {} };

    // Find category margin or use default
    const marginPercent = settings.categories?.[category] || settings.default || 20;
    const multiplier = 1 + (marginPercent / 100);

    return Math.ceil(baseCost * multiplier);
  } catch (err) {
    log(`[Pricing] Error calculating margin: ${err.message}`);
    return Math.ceil(baseCost * 1.2); // Default 20% fallback
  }
};

if (genAI) {
  console.log("✅ Gemini 1.5 Flash: ACTIVE");
} else {
  console.log("⚠️ Gemini 1.5 Flash: DISABLED (Using Mock Mode)");
}


const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-123";

const { initDb } = require("./db-init");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage });

// Initialize DB Client
initClient().then(() => {
  // Initialize DB Schema/Seed
  initDb();
});

// --- Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role = "BUYER" } = req.body;

    // Check if user exists
    const userCheck = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await query(
      "INSERT INTO users(email, password_hash, role) VALUES($1, $2, $3) RETURNING id, email, role",
      [email, hashedPassword, role]
    );

    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

// --- Health
app.get("/health", (_, res) => res.json({ ok: true }));

// --- Image Upload
app.post("/api/image/upload", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(500).json({ error: "File upload failed", details: err.message });
    }

    try {
      if (!req.file) return res.status(400).json({ error: "No image uploaded" });

      console.log("File uploaded successfully:", req.file);

      // Create a guest user or use existing if auth was implemented
      // For V1, we track by session/local storage, so we might create a temporary user-session

      const { rows } = await query(
        "INSERT INTO image_sessions(filename, status) VALUES($1, 'UPLOADED') RETURNING id",
        [req.file.filename]
      );
      res.json({ imageSessionId: rows[0].id, filename: req.file.filename });
    } catch (dbErr) {
      console.error("Database error after upload:", dbErr);
      res.status(500).json({ error: "Database save failed", details: dbErr.message });
    }
  });
});

// --- AI Analysis (Real + Fallback Mock)
const fileToGenerativePart = (path, mimeType) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
};

app.post("/api/image/analyze", async (req, res) => {
  try {
    const { imageSessionId, category = "Jewelry" } = req.body; // category optional, defaults

    // Get the filename from DB
    const sessionRes = await query("SELECT filename FROM image_sessions WHERE id = $1", [imageSessionId]);
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: "Session not found" });

    console.log(`[DEBUG] Analyzing session ${imageSessionId}. API Key present: ${!!GEMINI_API_KEY}, Key length: ${GEMINI_API_KEY?.length}`);
    if (GEMINI_API_KEY) console.log(`[DEBUG] Key starts with: ${GEMINI_API_KEY.substring(0, 4)}...`);

    const filename = sessionRes.rows[0].filename;
    const filePath = path.join(uploadDir, filename);

    // Dynamic MIME Type Detection
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).json({ error: "Image file not found on server" });
    }


    let attributes;

    if (genAI) {
      const prompt = `You are an expert gemologist. Analyze this jewelry image.
Return ONLY valid JSON:
{
  "jewelry_type": "string",
  "metal_type": "string",
  "stone_type": "string",
  "stone_color": "string",
  "style": "string",
  "craftsmanship": "string",
  "pattern": "string",
  "shape": "string",
  "confidence_score": number
}`;

      const imagePart = fileToGenerativePart(filePath, mimeType);



      // Retry logic with model fallback
      let lastError;
      const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

      for (const modelName of modelsToTry) {
        console.log(`Trying analysis with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Gemini ${modelName} attempt ${attempt}/2...`);
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            console.log("Raw AI response:", text);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const rawJson = jsonMatch ? jsonMatch[0] : text;
            attributes = JSON.parse(rawJson.replace(/```json/g, '').replace(/```/g, '').trim());

            attributes._ai_powered = true;
            console.log("✅ AI Analysis successful!", JSON.stringify(attributes));
            break;
          } catch (aiErr) {
            lastError = aiErr;
            console.log(`[ERROR] ${modelName} attempt ${attempt} failed: ${aiErr.message}`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        }
        if (attributes) break;
      }


      // If AI failed after all retries, use mock
      if (!attributes) {
        console.log("⚠️ Falling back to mock due to AI failure:", lastError?.message);
        attributes = {
          jewelry_type: category || "Unknown Jewelry",
          metal_type: "Unknown Metal",
          stone_type: "Unknown Stone",
          stone_color: "N/A",
          style: "Unknown Style",
          craftsmanship: "Standard",
          pattern: "N/A",
          shape: "N/A",
          confidence_score: 0.1,
          _ai_powered: false
        };
      }
    } else {
      console.log("Gemini API Key missing, falling back to Mock Analysis");
      attributes = {
        jewelry_type: category, // Fallback to user selection
        metal_type: "Gold",
        stone_type: "Diamond",
        stone_color: "White",
        style: "Modern",
        craftsmanship: "Plain",
        pattern: "None",
        shape: "Round",
        confidence_score: 0.95
      };
    }

    // Map AI attributes to DB schema
    await query(
      "INSERT INTO design_patterns(image_session_id, category, shape, material, stone_type, confidence_score, data) VALUES($1, $2, $3, $4, $5, $6, $7)",
      [
        imageSessionId,
        category,
        attributes.shape || "N/A",
        attributes.metal_type,
        attributes.stone_type,
        attributes.confidence_score,
        JSON.stringify({
          jewelry_type: attributes.jewelry_type, // Persist identified type
          stone_color: attributes.stone_color,
          style: attributes.style,
          craftsmanship: attributes.craftsmanship,
          pattern: attributes.pattern
        })
      ]
    );

    await query("UPDATE image_sessions SET status='ANALYZED' WHERE id=$1", [imageSessionId]);

    // Format for frontend response
    const frontendAttributes = {
      category: attributes.jewelry_type || category || "Jewelry",
      material: attributes.metal_type,
      stone_type: attributes.stone_type,
      shape: attributes.shape,
      confidence_score: attributes.confidence_score,
      // Include deep attributes
      style: attributes.style,
      craftsmanship: attributes.craftsmanship,
      pattern: attributes.pattern,
      stone_color: attributes.stone_color,
      ai_powered: attributes._ai_powered !== false
    };

    res.json({ attributes: frontendAttributes });
  } catch (err) {
    console.error("Analysis Error Detailed:", {
      message: err.message,
      status: err.status,
      details: err.response?.data || err.errorDetails || "No extra details",
      stack: err.stack
    });
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

// --- REIMAGINED RECOMMENDATIONS: Scraper-Powered ---
app.post("/api/recommendations", async (req, res) => {
  try {
    const { imageSessionId } = req.body;
    if (!imageSessionId) return res.status(400).json({ error: "Missing imageSessionId" });

    // 1. Get Analyzed Patterns
    const patternRes = await query("SELECT * FROM design_patterns WHERE image_session_id = $1", [imageSessionId]);
    const sessionRes = await query("SELECT filename FROM image_sessions WHERE id = $1", [imageSessionId]);

    if (sessionRes.rows.length === 0) return res.status(404).json({ error: "Session not found" });

    const filename = sessionRes.rows[0].filename;
    const filePath = path.join(uploadDir, filename);

    // 2. Derive Query
    let searchQuery = "jewelry wholesale";
    if (patternRes.rows.length > 0) {
      const p = patternRes.rows[0];
      const data = p.data || {};
      searchQuery = `${p.material} ${p.stone_type} ${data.jewelry_type || 'jewelry'} ${data.style || ''} wholesale`.trim();
    }


    log(`[Recommendations] Triggering live scout for: "${searchQuery}"`);

    // 3. The Scout (Live Scraper)
    const liveRecs = await scrapeAlibaba(searchQuery);

    // 4. Build Final Response (Alibaba Only as requested)
    const sortedRecs = liveRecs.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));

    res.json({ recommendations: sortedRecs.slice(0, 16) });

  } catch (err) {
    console.error("[Recommendations] Error:", err);
    res.status(500).json({ error: "Fetch recommendations failed", details: err.message });
  }
});

// --- Helper: Extract detailed technical specs from image using Gemini ---
const extractTechnicalSpecs = async (filePath) => {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


    const prompt = `You are a professional jewelry sourcing agent. Analyze this image and provide a highly technical search query for Alibaba.
    
    CRITICAL: 
    1. Identify and include the DOMINANT COLOR (e.g., Pink, Emerald Green, Ruby Red).
    2. Identify specific materials (e.g., Pearl, Kundan, Zircon, Meenakari).
    3. Use the specific style (e.g., Jhumka, Chandbali, Temple).

    Format: JUST one string (max 8 words).
    Example: "Pink Pearl Kundan Jhumka Gold Plated Earrings Wholesale"`;

    const imagePart = fileToGenerativePart(filePath, "image/jpeg");
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim().replace(/"/g, '');
    log(`[Technical Scout] Derived Specs: "${text}"`);
    return text;
  } catch (e) {
    log(`[Technical Scout] Spec extraction failed: ${e.message}`);
    return null;
  }
};

// --- Helper: Alibaba Scraper Logic ---
const scrapeAlibaba = async (queryStr) => {
  if (!SCRAPERAPI_KEY) {
    log("[Scraper] Missing SCRAPERAPI_KEY. Skipping live search.");
    return [];
  }

  try {
    const searchUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(queryStr)}`;
    const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(searchUrl)}&render=true`;

    log(`[Scraper] Initializing Alibaba Search: ${queryStr}`);
    const response = await axios.get(proxyUrl);
    const $ = cheerio.load(response.data);

    const results = [];
    // Alibaba search result selectors (current as of early 2024 patterns)
    // Primary targets: .search-card-item or .card-info
    $('.search-card-item, .card-info, .list-no-v2-main__item, .m-gallery-product-item-v2, .gallery-card-layout-item').each((i, el) => {
      if (results.length >= 12) return;

      const title = $(el).find('h2, .common-card-title, .search-card-e-title, .title-link, .title').text().trim();
      const price = $(el).find('.search-card-e-price-main, .element--price-item, .common-card-m-price-main, .price-number, .h4').text().trim();
      const link = $(el).find('a').attr('href');

      // Target EVERY image candidate in the card
      let images = [];
      $(el).find('img').each((j, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('image-src') || $(img).attr('data-image') || '';
        if (src) images.push(src);
      });

      log(`[Scraper] Card ${i} Title: ${title.substring(0, 20)}... | Found ${images.length} candidates.`);

      // SURGICAL FILTER
      let bestCandidates = [];
      let goodCandidates = [];

      for (const src of images) {
        const s = src.toLowerCase();
        // Strict Blacklist
        const isTrash = s.includes('flag') || s.includes('country') || s.includes('icon') || s.includes('logo') ||
          s.includes('sprite') || s.includes('badge') || s.includes('verified') || s.includes('cert') ||
          s.includes('check') || s.includes('dot') || s.includes('svg') || s.includes('loading') ||
          s.includes('placeholder') || s.includes('avatar') || s.includes('button');

        // Product Indicators
        const isLikelyProduct = s.includes('/kf/') || s.includes('/product/') || s.includes('sc04') || s.includes('.alicdn.com');
        const isIdealSize = s.includes('_220x220') || s.includes('_300x300') || s.includes('_450x450');

        if (!isTrash && isLikelyProduct) {
          if (isIdealSize) {
            bestCandidates.push(src);
          } else {
            goodCandidates.push(src);
          }
        }
      }

      // Selection Priority
      let image = bestCandidates[0] || goodCandidates[0] || images.find(s => {
        const l = s.toLowerCase();
        return !l.includes('flag') && !l.includes('icon') && !l.includes('logo') && l.includes('http');
      }) || '';

      if (!image && images.length > 0) image = images[0];

      if (!image) log(`[Scraper] Card ${i} - NO PRODUCT IMAGE FOUND.`);
      else log(`[Scraper] Card ${i} - Selected: ${image.substring(0, 50)}...`);

      if (title && link) {
        // Cleanup URLs
        const fullLink = link.startsWith('http') ? link : `https:${link}`;
        const fullImage = image ? (image.startsWith('http') ? image : `https:${image}`) : '';

        results.push({
          id: `ali-scrape-${Math.random().toString(36).substr(2, 9)}`,
          name: title,
          description: `Alibaba Sourced | Specs: ${queryStr.substring(0, 30)}...`,
          image_url: fullImage,
          source: 'EXTERNAL',
          price_range: price || 'Contact for Price',
          link: fullLink,
          similarity_score: 0.92 - (i * 0.01), // Initial rank based on search order
          source_label: 'Alibaba Scout'
        });
      }
    });

    log(`[Scraper] Successfully harvested ${results.length} items from Alibaba.`);
    return results;
  } catch (err) {
    log(`[Scraper] Error during harvest: ${err.message}`);
    return [];
  }
};

// --- REIMAGINED UNIFIED SEARCH: Visual Bot Primary ---
app.post("/api/search/unified", (req, res) => {
  log(">>> [CODE VERSION: VISUAL_BOT_RESTORED] - STARTING <<<");

  // INCREASE TIMEOUT for this specific request
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000, () => {
    log("[Scout] Request timed out after 5 minutes.");
    if (!res.headersSent) res.status(504).json({ error: "Search timed out" });
  });

  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(500).json({ error: "Upload failed", details: uploadErr.message });

    try {
      if (!req.file) return res.status(400).json({ error: "No image uploaded" });

      const filePath = path.join(uploadDir, req.file.filename);
      const category = req.body.category || 'jewelry';

      log(`[Scout] Processing sourcing request for category: ${category}`);

      let scoutedResults = [];

      // 1. Try Visual Search Bot First (EXPLICIT USER REQUEST)
      try {
        log("[Scout] Launching Visual Bot to browse Alibaba...");
        scoutedResults = await searchByImage(filePath);
        log(`[Scout] Visual Bot returned ${scoutedResults.length} matches.`);
      } catch (botErr) {
        log(`[Scout] Visual Bot failed: ${botErr.message}.`);
      }

      // NO FALLBACK - We only want visual results
      if (scoutedResults && scoutedResults.length > 0) {
        res.json(scoutedResults);
      } else {
        log("[Scout] No visual results captured from bot.");
        res.json([]);
      }

    } catch (err) {
      log(`[Scout] Critical Failure: ${err.message}`);
      if (!res.headersSent) res.status(500).json({ error: "Sourcing failed", details: err.message });
    }
  });
});

// --- Cart: Add Item
app.post("/api/cart/add", authenticateToken, async (req, res) => {
  try {
    const { skuId, quantity, notes, itemData } = req.body;
    const userId = req.user.id;

    let finalSkuId = skuId;

    // If it's a sourcing result (not yet in DB), create it
    if (typeof skuId === 'string' && (skuId.startsWith('ali-') || skuId.startsWith('lens-'))) {
      log(`[Cart] Creating persistent SKU for sourced item: ${skuId}`);
      // Check if this link already exists in SKUs to prevent duplicates
      const existing = await query("SELECT id FROM skus WHERE link = $1", [itemData.link]);

      if (existing.rows.length > 0) {
        finalSkuId = existing.rows[0].id;
      } else {
        const { rows } = await query(
          "INSERT INTO skus(name, description, image_url, source, material, price_range, moq, lead_time_days, link) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
          [
            itemData.name,
            itemData.description || 'Sourced via Alibaba Scout',
            itemData.image_url,
            'EXTERNAL',
            itemData.material || 'N/A',
            itemData.price_range,
            parseInt(itemData.moq) || 1,
            parseInt(itemData.lead_time_days) || 14,
            itemData.link
          ]
        );
        finalSkuId = rows[0].id;
      }
    }

    // Check for existing active cart for user
    let cartId = req.body.cartId;
    if (!cartId) {
      const cartRes = await query("INSERT INTO carts(user_id, status) VALUES($1, 'DRAFT') RETURNING id", [userId]);
      cartId = cartRes.rows[0].id;
    }

    await query(
      "INSERT INTO cart_items(cart_id, sku_id, quantity, notes) VALUES($1,$2,$3,$4)",
      [cartId, finalSkuId, quantity, notes]
    );

    res.json({ cartId, skuId: finalSkuId, status: "DRAFT" });
  } catch (err) {
    console.error("[Cart] Add error:", err);
    res.status(500).json({ error: "Add to cart failed", details: err.message });
  }
});

// --- Cart: Get Items
app.get("/api/cart/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    const { rows } = await query(
      `SELECT ci.*, s.name, s.image_url, s.price_range 
       FROM cart_items ci 
       JOIN skus s ON ci.sku_id = s.id 
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Get cart failed" });
  }
});

// --- Cart: Submit Request
app.post("/api/cart/submit", async (req, res) => {
  try {
    const { cartId } = req.body;
    await query("UPDATE carts SET status='SUBMITTED' WHERE id=$1", [cartId]);
    res.json({ status: "SUBMITTED" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submit failed" });
  }
});

// --- Internal: Get Requests (Sales Dashboard)
app.get("/api/internal/requests", async (req, res) => {
  try {
    // Determine role? Mocking 'SALES' view
    const { rows } = await query(
      `SELECT c.id, c.status, c.created_at, count(ci.id) as item_count 
       FROM carts c 
       LEFT JOIN cart_items ci ON c.id = ci.cart_id 
       WHERE c.status != 'DRAFT'
       GROUP BY c.id ORDER BY c.created_at DESC`
    );
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch requests failed" });
  }
});

// --- Internal: Update Request Status (Sourcing/Sales)
app.post("/api/internal/requests/:id/status", authenticateToken, requireRole(['SALES', 'SOURCING', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // In a real app we'd log who did this
    await query("UPDATE carts SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [status, id]);

    res.json({ message: `Status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update status failed" });
  }
});

// --- Internal: Create Quote
app.post("/api/internal/quote", async (req, res) => {
  try {
    const { cartId, totalPrice, validUntil } = req.body;

    await query(
      "INSERT INTO quotations(cart_id, total_price, valid_until, status) VALUES($1, $2, $3, 'SENT')",
      [cartId, totalPrice, validUntil]
    );

    await query("UPDATE carts SET status='QUOTED' WHERE id=$1", [cartId]);

    res.json({ message: "Quote sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Quote creation failed" });
  }
});


// --- Admin: Users
app.get("/api/admin/users", authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { rows } = await query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: "Fetch users failed" });
  }
});

app.put("/api/admin/users/:id/role", authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    res.json({ message: "Role updated" });
  } catch (err) {
    res.status(500).json({ error: "Update role failed" });
  }
});

// --- Admin: Catalog
app.get("/api/admin/skus", authenticateToken, requireRole(['ADMIN', 'SALES']), async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM skus ORDER BY created_at DESC");
    res.json({ skus: rows });
  } catch (err) {
    res.status(500).json({ error: "Fetch catalog failed" });
  }
});

app.post("/api/admin/skus", authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, image_url, source, material, price_range, moq, lead_time_days } = req.body;
    const { rows } = await query(
      "INSERT INTO skus(name, description, image_url, source, material, price_range, moq, lead_time_days) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [name, description, image_url, source, material, price_range, moq, lead_time_days]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Create SKU failed" });
  }
});

// --- Admin: Settings (Margins)
app.get("/api/admin/settings/margins", authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { rows } = await query("SELECT config_value FROM system_settings WHERE config_key='margins'");
    if (rows.length > 0) res.json(rows[0].config_value);
    else res.json({ default: 20 });
  } catch (err) {
    res.status(500).json({ error: "Fetch settings failed" });
  }
});

app.put("/api/admin/settings/margins", authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const configValue = req.body;
    // Upsert logic
    // Postgres specific: INSERT ... ON CONFLICT (config_key) DO UPDATE ...
    // Mock DB: handled by update parser or manual check
    // Let's try standard SQL valid for Postgres
    const check = await query("SELECT * FROM system_settings WHERE config_key='margins'");
    if (check.rows.length === 0) {
      await query("INSERT INTO system_settings(config_key, config_value) VALUES($1, $2)", ['margins', JSON.stringify(configValue)]);
    } else {
      await query("UPDATE system_settings SET config_value=$1, updated_at=CURRENT_TIMESTAMP WHERE config_key=$2", [JSON.stringify(configValue), 'margins']);
    }
    res.json({ message: "Settings updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update settings failed" });
  }
});

// --- Internal: Detailed Request View
app.get("/api/internal/requests/:id", authenticateToken, requireRole(['SALES', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    // Get Cart + User + Items + SKU details
    const cartRes = await query(`
      SELECT c.*, u.email as user_email 
      FROM carts c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = $1
    `, [id]);

    if (cartRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });

    const itemsRes = await query(`
      SELECT ci.*, s.name, s.image_url, s.source, s.price_range, s.base_cost 
      FROM cart_items ci 
      JOIN skus s ON ci.sku_id = s.id 
      WHERE ci.cart_id = $1
    `, [id]);

    const itemsWithPricing = await Promise.all(itemsRes.rows.map(async (item) => {
      let suggestedPrice = null;
      if (item.base_cost) {
        // Try to get category from design patterns to apply correct margin
        const patternRes = await query("SELECT category FROM design_patterns WHERE image_session_id = (SELECT image_session_id FROM carts WHERE id = $1)", [id]);
        const category = patternRes.rows[0]?.category || 'default';
        suggestedPrice = await calculatePrice(parseFloat(item.base_cost), category);
      }
      return { ...item, suggested_price: suggestedPrice };
    }));

    res.json({ request: cartRes.rows[0], items: itemsWithPricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch request details failed" });
  }
});

// --- Buyer: My Requests
app.get("/api/requests/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await query(
      `SELECT c.id, c.status, c.created_at, q.total_price, q.currency, q.valid_until
       FROM carts c 
       LEFT JOIN quotations q ON c.id = q.cart_id 
       WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [userId]
    );
    res.json({ requests: rows });
  } catch (err) {
    res.status(500).json({ error: "Fetch my requests failed" });
  }
});

// --- Buyer: Accept Quote
app.post("/api/requests/:id/accept", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const cartRes = await query("SELECT * FROM carts WHERE id = $1 AND user_id = $2", [id, userId]);
    if (cartRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });

    await query("UPDATE carts SET status='ORDERED', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [id]);

    // In a real app, this would trigger order fulfillment
    res.json({ message: "Quote accepted, order placed!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Accept quote failed" });
  }
});

// --- Production: Serve frontend build ---
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Serving frontend from:', frontendBuildPath);
  app.use(express.static(frontendBuildPath));
  // SPA catch-all: send index.html for any non-API route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
} else {
  console.log('ℹ️ No frontend build found. API-only mode.');
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on port ${PORT}`));
