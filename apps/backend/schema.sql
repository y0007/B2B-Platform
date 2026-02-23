-- Visual Sourcing Platform Schema

-- Users & Roles
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('BUYER', 'SALES', 'SOURCING', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products / SKUs
DROP TABLE IF EXISTS skus CASCADE;
CREATE TABLE skus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    source VARCHAR(50) CHECK (source IN ('INTERNAL', 'EXTERNAL')),
    material VARCHAR(100),
    price_range VARCHAR(100), -- Stored as range string for simplicity in MVP
    base_cost DECIMAL(10, 2), -- Internal Cost (Platform Only)
    moq INTEGER DEFAULT 1,
    lead_time_days INTEGER DEFAULT 14,
    link TEXT UNIQUE, -- Direct external product link
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image Upload Sessions
DROP TABLE IF EXISTS image_sessions CASCADE;
CREATE TABLE image_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'UPLOADED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted Design Patterns
DROP TABLE IF EXISTS design_patterns CASCADE;
CREATE TABLE design_patterns (
    id SERIAL PRIMARY KEY,
    image_session_id INTEGER REFERENCES image_sessions(id),
    category VARCHAR(100),
    shape VARCHAR(100),
    material VARCHAR(100),
    stone_type VARCHAR(100),
    confidence_score FLOAT,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carts (Requests)
DROP TABLE IF EXISTS carts CASCADE;
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'QUOTED', 'ORDERED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items
DROP TABLE IF EXISTS cart_items CASCADE;
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(id),
    sku_id INTEGER REFERENCES skus(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotations
DROP TABLE IF EXISTS quotations CASCADE;
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(id),
    total_price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    valid_until TIMESTAMP,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    items JSONB, -- Stores specific pricing/qty snapshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings (Margins & Configurations)
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Setup for Settings (Default Margins)
INSERT INTO system_settings (config_key, config_value) VALUES 
('margins', '{"default": 20, "categories": {"Ring": 25, "Necklace": 30}}');
