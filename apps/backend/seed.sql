-- Visual Sourcing Platform Seed

-- Users
INSERT INTO users (email, role, password_hash) VALUES 
('buyer@example.com', 'BUYER', 'hash123'),
('sales@example.com', 'SALES', 'hash123'),
('sourcing@example.com', 'SOURCING', 'hash123'),
('admin@example.com', 'ADMIN', 'hash123')
ON CONFLICT (email) DO NOTHING;

-- SKUs (Internal Inventory) with Cost Data
INSERT INTO skus (name, description, image_url, source, material, price_range, base_cost, moq, lead_time_days) VALUES
('Classic Solitaire Ring', '18K Gold with 1ct Diamond', 'https://via.placeholder.com/300?text=Ring+1', 'INTERNAL', 'Gold', '$800-$1200', 800.00, 10, 7),
('Vintage Art Deco Necklace', 'Silver with Sapphire', 'https://via.placeholder.com/300?text=Necklace+1', 'INTERNAL', 'Silver', '$300-$500', 250.00, 20, 14),
('Modern Geometric Earrings', 'Rose Gold Plated', 'https://via.placeholder.com/300?text=Earrings+1', 'INTERNAL', 'Rose Gold', '$150-$250', 120.00, 50, 21),
('Luxury Tennis Bracelet', 'Platinum with CZ', 'https://via.placeholder.com/300?text=Bracelet+1', 'INTERNAL', 'Platinum', '$2000-$3000', 1800.00, 5, 30);

-- SKUs (External Supplier Catalog) - Base Costs hidden from User
INSERT INTO skus (name, description, image_url, source, material, price_range, base_cost, moq, lead_time_days) VALUES
('Supplier: Hoop Earrings', 'Gold Plated Essentials', 'https://via.placeholder.com/300?text=Hoops+Ext', 'EXTERNAL', 'Gold Plated', '$50-$100', 40.00, 100, 45),
('Supplier: Pearl Choker', 'Freshwater Pearls', 'https://via.placeholder.com/300?text=Pearl+Ext', 'EXTERNAL', 'Pearl', '$120-$180', 100.00, 50, 30),
('Supplier: Statement Ring', 'Bold Gemstone Design', 'https://via.placeholder.com/300?text=Statement+Ring', 'EXTERNAL', 'Gold Plated', '$80-$150', 60.00, 50, 40),
('Supplier: Minimalist Band', 'Simple Gold Band', 'https://via.placeholder.com/300?text=Band+Ext', 'EXTERNAL', 'Gold', '$200-$300', 180.00, 20, 25);
