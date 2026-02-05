const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class HubDatabase {
    constructor(dbPath) {
        // Ensure data directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeTables();
    }

    initializeTables() {
        // Users table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        connection_key TEXT UNIQUE NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Items table (unified table for all item types)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        prompt TEXT,
        command TEXT,
        tags TEXT,
        visibility TEXT DEFAULT 'private',
        verified BOOLEAN DEFAULT 0,
        download_url TEXT,
        bundle_path TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

        // Teams table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

        // Team members
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

        // Item analytics
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS item_downloads (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        user_id TEXT,
        downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

        // Create indexes
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);
      CREATE INDEX IF NOT EXISTS idx_items_visibility ON items(visibility);
      CREATE INDEX IF NOT EXISTS idx_items_verified ON items(verified);
      CREATE INDEX IF NOT EXISTS idx_users_connection_key ON users(connection_key);
    `);

        console.log('Database tables initialized successfully');
    }

    close() {
        this.db.close();
    }
}




