-- Banco de dados Mercado Harley
-- MySQL Schema para migração do Firebase

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    address JSON,
    isAdmin BOOLEAN DEFAULT FALSE,
    userType VARCHAR(50) DEFAULT 'customer' COMMENT 'Type: customer, pavilhao, admin',
    resetTokenHash VARCHAR(64) COMMENT 'SHA-256 hash of the active password-reset token, if any',
    resetTokenExpiresAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_isAdmin (isAdmin),
    INDEX idx_userType (userType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    images JSON,
    dimensions JSON,
    weight DECIMAL(8, 2),
    description LONGTEXT,
    category VARCHAR(100),
    partType VARCHAR(100),
    partner VARCHAR(100),
    product_condition VARCHAR(30) COMMENT 'Model attribute name is "condition"; column is product_condition',
    rating INT DEFAULT 5,
    profitMargin DECIMAL(5, 2) DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    featuredCarousel BOOLEAN DEFAULT FALSE,
    specs JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_stock (stock),
    FULLTEXT INDEX ft_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    orderNumber VARCHAR(100) UNIQUE NOT NULL,
    userId VARCHAR(255),
    items JSON NOT NULL,
    customer JSON NOT NULL,
    shipping JSON NOT NULL,
    payment JSON,
    total DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    method VARCHAR(50),
    sellerName VARCHAR(255) COMMENT 'Nome do vendedor (para vendas pavilhão)',
    orderType VARCHAR(50) DEFAULT 'online' COMMENT 'Type: online, pavilhao',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    paidAt TIMESTAMP NULL,
    shippedAt TIMESTAMP NULL,
    deliveredAt TIMESTAMP NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_status (status),
    INDEX idx_orderNumber (orderNumber),
    INDEX idx_createdAt (createdAt),
    INDEX idx_orderType (orderType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BANNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    image VARCHAR(500),
    link VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    displayOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active),
    INDEX idx_displayOrder (displayOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHIPPING RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shipping_rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    states JSON NOT NULL,
    minWeight DECIMAL(8, 2) NOT NULL,
    maxWeight DECIMAL(8, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    deliveryDays INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resourceId VARCHAR(255),
    changes JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESSIONS TABLE — NOT IMPLEMENTED.
-- Refresh tokens are stateless JWTs (see backend/services/authService.js);
-- nothing in the codebase reads or writes this table. Kept here only so a
-- future implementation of revocable refresh tokens has a starting point —
-- do not assume it is populated or in active use.
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    refreshToken VARCHAR(500) NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUPPLIERS TABLE (internal stock module)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    source ENUM('manual', 'partner_import') NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRICING CONFIG TABLE (internal stock module — single global row)
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    site_markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    marketplace_markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    rounding_strategy VARCHAR(20) NOT NULL DEFAULT '2_decimals',
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INTERNAL STOCK ITEMS TABLE (internal stock module)
-- ============================================================
CREATE TABLE IF NOT EXISTS internal_stock_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12, 2) NOT NULL,
    site_sale_price DECIMAL(12, 2) NOT NULL,
    ml_sale_price DECIMAL(12, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    supplier_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    INDEX idx_internal_stock_supplier (supplier_id),
    INDEX idx_internal_stock_name (name),
    INDEX idx_internal_stock_active (active),
    INDEX idx_internal_stock_active_supplier (active, supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
