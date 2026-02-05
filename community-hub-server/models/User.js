const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class User {
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new user
     */
    async create(email, password, isAdmin = false) {
        const id = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);
        const connectionKey = this.generateConnectionKey();

        const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, connection_key, is_admin)
      VALUES (?, ?, ?, ?, ?)
    `);

        try {
            stmt.run(id, email, passwordHash, connectionKey, isAdmin ? 1 : 0);
            return { id, email, connectionKey, isAdmin };
        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find user by email
     */
    findByEmail(email) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }

    /**
     * Find user by connection key
     */
    findByConnectionKey(connectionKey) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE connection_key = ?');
        return stmt.get(connectionKey);
    }

    /**
     * Find user by ID
     */
    findById(id) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    }

    /**
     * Verify password
     */
    async verifyPassword(password, passwordHash) {
        return await bcrypt.compare(password, passwordHash);
    }

    /**
     * Generate a connection key
     */
    generateConnectionKey() {
        return `ahub_${crypto.randomBytes(32).toString('hex')}`;
    }

    /**
     * Regenerate connection key
     */
    regenerateConnectionKey(userId) {
        const newKey = this.generateConnectionKey();
        const stmt = this.db.prepare(`
      UPDATE users SET connection_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        stmt.run(newKey, userId);
        return newKey;
    }

    /**
     * Update user
     */
    update(userId, data) {
        const fields = [];
        const values = [];

        if (data.email) {
            fields.push('email = ?');
            values.push(data.email);
        }

        if (data.password) {
            fields.push('password_hash = ?');
            values.push(bcrypt.hashSync(data.password, 10));
        }

        if (fields.length === 0) return;

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);
        stmt.run(...values);
    }

    /**
     * Delete user
     */
    delete(userId) {
        const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
        stmt.run(userId);
    }

    /**
     * List all users (admin only)
     */
    listAll() {
        const stmt = this.db.prepare(`
      SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC
    `);
        return stmt.all();
    }
}

module.exports = User;

