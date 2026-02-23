
// In-memory store
const store = {
    users: [
        { id: 1, email: 'admin@gemscout.com', password_hash: '$2b$10$yX91w0dcmTU04we/9yNv5./GKX9sAN2WZ81DChWvfLMV7M1sBmw5u', role: 'ADMIN', created_at: new Date() },
        { id: 2, email: 'sales@gemscout.com', password_hash: '$2b$10$yX91w0dcmTU04we/9yNv5./GKX9sAN2WZ81DChWvfLMV7M1sBmw5u', role: 'SALES', created_at: new Date() },
        { id: 3, email: 'sourcing@gemscout.com', password_hash: '$2b$10$yX91w0dcmTU04we/9yNv5./GKX9sAN2WZ81DChWvfLMV7M1sBmw5u', role: 'SOURCING', created_at: new Date() },
        { id: 4, email: 'buyer@gemscout.com', password_hash: '$2b$10$yX91w0dcmTU04we/9yNv5./GKX9sAN2WZ81DChWvfLMV7M1sBmw5u', role: 'BUYER', created_at: new Date() }
    ],
    image_sessions: [],
    design_patterns: [],
    carts: [],
    cart_items: [],
    skus: [
        { id: 1, name: 'Classic Solitaire Ring', description: '18K Gold', image_url: 'https://images.unsplash.com/photo-1605100804763-ebea6401a71c?w=400', source: 'INTERNAL', material: 'Gold', price_range: '$800-$1200', base_cost: 800, moq: 10, lead_time_days: 7, created_at: new Date() },
        { id: 2, name: 'Vintage Art Deco Necklace', description: 'Silver with Sapphire', image_url: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=400', source: 'INTERNAL', material: 'Silver', price_range: '$300-$500', base_cost: 250, moq: 20, lead_time_days: 14, created_at: new Date() },
        { id: 3, name: 'Supplier: Hoop Earrings', description: 'Gold Plated', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', source: 'EXTERNAL', material: 'Gold Plated', price_range: '$50-$100', base_cost: 40, moq: 100, lead_time_days: 45, link: 'https://alibaba.com/sample1', created_at: new Date() },
        { id: 4, name: 'Supplier: Pearl Choker', description: 'Freshwater Pearls', image_url: 'https://images.unsplash.com/photo-1599643477877-5313557e034e?w=400', source: 'EXTERNAL', material: 'Pearl', price_range: '$120-$180', base_cost: 100, moq: 50, lead_time_days: 30, link: 'https://alibaba.com/sample2', created_at: new Date() }
    ],
    quotations: [],
    system_settings: [
        { config_key: 'margins', config_value: { default: 20, categories: { 'Ring': 25, 'Necklace': 30 } }, updated_at: new Date() }
    ]
};

// Helper to simulate async headers
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockQuery = async (text, params = []) => {
    await wait(50); // Simulate latency
    const cleanText = text.toLowerCase().trim();

    // INSERT
    if (cleanText.startsWith('insert into')) {
        if (cleanText.includes('users')) {
            const id = store.users.length + 1;
            const user = { id, email: params[0], password_hash: params[1], role: params[2] || 'BUYER', created_at: new Date() };
            store.users.push(user);
            return { rows: [user] };
        }
        if (cleanText.includes('image_sessions')) {
            const id = store.image_sessions.length + 1;
            const session = { id, filename: params[0], status: 'UPLOADED', created_at: new Date() };
            store.image_sessions.push(session);
            return { rows: [session] };
        }
        if (cleanText.includes('design_patterns')) {
            const id = store.design_patterns.length + 1;
            const pattern = {
                id,
                image_session_id: params[0],
                category: params[1],
                shape: params[2],
                material: params[3],
                stone_type: params[4],
                confidence_score: params[5],
                data: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
                created_at: new Date()
            };
            store.design_patterns.push(pattern);
            return { rows: [pattern] };
        }
        if (cleanText.includes('carts')) {
            const id = store.carts.length + 1;
            const cart = { id, user_id: params[0], status: 'DRAFT', created_at: new Date() };
            store.carts.push(cart);
            return { rows: [cart] };
        }
        if (cleanText.includes('cart_items')) {
            const id = store.cart_items.length + 1;
            const item = {
                id,
                cart_id: params[0],
                sku_id: params[1],
                quantity: params[2],
                notes: params[3],
                created_at: new Date()
            };
            store.cart_items.push(item);
            return { rows: [item] };
        }
        if (cleanText.includes('quotations')) {
            const id = store.quotations.length + 1;
            const quote = {
                id,
                cart_id: params[0],
                total_price: params[1],
                valid_until: params[2],
                status: 'SENT',
                created_at: new Date()
            };
            store.quotations.push(quote);
            return { rows: [quote] };
        }
        if (cleanText.includes('system_settings')) {
            const setting = store.system_settings.find(s => s.config_key === params[0]);
            if (!setting) {
                const newSetting = {
                    config_key: params[0],
                    config_value: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1],
                    updated_at: new Date()
                };
                store.system_settings.push(newSetting);
            }
            return { rows: [] };
        }
        if (cleanText.includes('skus')) {
            const id = store.skus.length + 1;
            const sku = {
                id, name: params[0], description: params[1], image_url: params[2],
                source: params[3], material: params[4], price_range: params[5],
                moq: params[6], lead_time_days: params[7], link: params[8], created_at: new Date()
            };
            store.skus.push(sku);
            return { rows: [sku] };
        }
    }

    // SELECT
    if (cleanText.startsWith('select')) {
        // JOIN: carts + users (request details)
        if (cleanText.includes('from carts') && cleanText.includes('join users')) {
            const cartId = params[0];
            const cart = store.carts.find(c => c.id == cartId);
            if (!cart) return { rows: [] };
            const user = store.users.find(u => u.id == cart.user_id);
            return { rows: [{ ...cart, user_email: user?.email || 'unknown' }] };
        }
        // JOIN: cart_items + skus (request items detail)
        if (cleanText.includes('from cart_items') && cleanText.includes('join skus')) {
            const cartId = params[0];
            const items = store.cart_items.filter(i => i.cart_id == cartId);
            const joined = items.map(i => {
                const sku = store.skus.find(s => s.id == i.sku_id);
                return { ...i, name: sku?.name, image_url: sku?.image_url, source: sku?.source, price_range: sku?.price_range, base_cost: sku?.base_cost, link: sku?.link };
            });
            return { rows: joined };
        }
        if (cleanText.includes('from users')) {
            if (cleanText.includes('where email')) {
                const user = store.users.find(u => u.email === params[0]);
                return { rows: user ? [user] : [] };
            }
            return { rows: [...store.users].sort((a, b) => b.created_at - a.created_at) };
        }
        if (cleanText.includes('from skus')) {
            let results = store.skus;
            if (cleanText.includes("source='internal'")) {
                results = results.filter(s => s.source === 'INTERNAL');
            } else if (cleanText.includes("source='external'")) {
                results = results.filter(s => s.source === 'EXTERNAL');
            }
            return { rows: results };
        }
        if (cleanText.includes('from cart_items')) {
            const cartId = params[0];
            const items = store.cart_items.filter(i => i.cart_id == cartId);
            const joined = items.map(i => {
                const sku = store.skus.find(s => s.id == i.sku_id);
                return { ...i, name: sku?.name, image_url: sku?.image_url, price_range: sku?.price_range, link: sku?.link };
            });
            return { rows: joined };
        }
        if (cleanText.includes('from carts')) {
            if (cleanText.includes('user_id = $1')) {
                const userId = params[0];
                const myCarts = store.carts.filter(c => c.user_id == userId);
                const rows = myCarts.map(c => {
                    const quote = store.quotations.find(q => q.cart_id == c.id);
                    return { ...c, total_price: quote?.total_price, valid_until: quote?.valid_until };
                });
                return { rows };
            }
            const submitted = store.carts.filter(c => c.status !== 'DRAFT');
            const rows = submitted.map(c => {
                const count = store.cart_items.filter(ci => ci.cart_id === c.id).length;
                return { ...c, item_count: count };
            }).sort((a, b) => b.created_at - a.created_at);
            return { rows };
        }
        if (cleanText.includes('select to_regclass')) {
            return { rows: [{ to_regclass: 'public.users' }] };
        }
        if (cleanText.includes('from image_sessions')) {
            const id = params[0];
            const session = store.image_sessions.find(s => s.id == id);
            return { rows: session ? [session] : [] };
        }
        if (cleanText.includes('from system_settings')) {
            if (cleanText.includes('where config_key')) {
                const key = cleanText.match(/config_key\s*=\s*'([^']+)'/)?.[1] || params[0];
                const setting = store.system_settings.find(s => s.config_key === key);
                return { rows: setting ? [setting] : [] };
            }
            return { rows: store.system_settings };
        }

    }

    // UPDATE
    if (cleanText.startsWith('update')) {
        if (cleanText.includes('users set role')) {
            const role = params[0];
            const id = params[1];
            const user = store.users.find(u => u.id == id);
            if (user) user.role = role;
            return { rows: [] };
        }
        if (cleanText.includes('update system_settings')) {
            // Very basic parser for UPDATE system_settings SET config_value = $1 WHERE config_key = $2
            const newValue = params[0];
            const key = params[1];
            const setting = store.system_settings.find(s => s.config_key === key);
            if (setting) {
                setting.config_value = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
                setting.updated_at = new Date();
            }
            return { rows: [] };
        }

        if (cleanText.includes('image_sessions')) {
            const id = params[0];
            const session = store.image_sessions.find(s => s.id == id);
            if (session) session.status = 'ANALYZED';
            return { rows: [] };
        }
        if (cleanText.includes('carts')) {
            const idParam = params[0];
            const cart = store.carts.find(c => c.id == idParam);
            if (cart) {
                if (cleanText.includes("'submitted'")) cart.status = 'SUBMITTED';
                if (cleanText.includes("'quoted'")) cart.status = 'QUOTED';
            }
            return { rows: [] };
        }
    }

    return { rows: [] };
};

module.exports = { mockQuery };
