const { v4: uuidv4 } = require('uuid');

class Item {
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new item
     */
    create(userId, itemData) {
        const id = uuidv4();
        const {
            itemType,
            name,
            description,
            prompt,
            command,
            tags,
            visibility = 'private',
            downloadUrl,
            bundlePath,
            metadata
        } = itemData;

        const stmt = this.db.prepare(`
      INSERT INTO items (
        id, user_id, item_type, name, description, prompt, command,
        tags, visibility, download_url, bundle_path, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            userId,
            itemType,
            name,
            description || null,
            prompt || null,
            command || null,
            tags ? JSON.stringify(tags) : null,
            visibility,
            downloadUrl || null,
            bundlePath || null,
            metadata ? JSON.stringify(metadata) : null
        );

        return this.findById(id);
    }

    /**
     * Find item by ID
     */
    findById(id) {
        const stmt = this.db.prepare('SELECT * FROM items WHERE id = ?');
        const item = stmt.get(id);
        return item ? this.formatItem(item) : null;
    }

    /**
     * Find public items by type
     */
    findPublicByType(itemType, limit = 50, offset = 0) {
        const stmt = this.db.prepare(`
      SELECT * FROM items
      WHERE item_type = ? AND visibility = 'public'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
        const items = stmt.all(itemType, limit, offset);
        return items.map(item => this.formatItem(item));
    }

    /**
     * Count public items by type
     */
    countPublicByType(itemType) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM items
      WHERE item_type = ? AND visibility = 'public'
    `);
        return stmt.get(itemType).count;
    }

    /**
     * Find all public items (for explore)
     */
    findAllPublic(limit = 20) {
        const agentSkills = this.findPublicByType('agent-skill', limit);
        const systemPrompts = this.findPublicByType('system-prompt', limit);
        const slashCommands = this.findPublicByType('slash-command', limit);
        const agentFlows = this.findPublicByType('agent-flow', limit);

        return {
            agentSkills: {
                items: agentSkills,
                hasMore: agentSkills.length === limit,
                totalCount: this.countPublicByType('agent-skill')
            },
            systemPrompts: {
                items: systemPrompts,
                hasMore: systemPrompts.length === limit,
                totalCount: this.countPublicByType('system-prompt')
            },
            slashCommands: {
                items: slashCommands,
                hasMore: slashCommands.length === limit,
                totalCount: this.countPublicByType('slash-command')
            },
            agentFlows: {
                items: agentFlows,
                hasMore: agentFlows.length === limit,
                totalCount: this.countPublicByType('agent-flow')
            }
        };
    }

    /**
     * Find items by user
     */
    findByUser(userId) {
        const stmt = this.db.prepare(`
      SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC
    `);
        const items = stmt.all(userId);

        // Group by type
        const grouped = {
            agentSkills: [],
            systemPrompts: [],
            slashCommands: [],
            agentFlows: []
        };

        items.forEach(item => {
            const formatted = this.formatItem(item);
            switch (item.item_type) {
                case 'agent-skill':
                    grouped.agentSkills.push(formatted);
                    break;
                case 'system-prompt':
                    grouped.systemPrompts.push(formatted);
                    break;
                case 'slash-command':
                    grouped.slashCommands.push(formatted);
                    break;
                case 'agent-flow':
                    grouped.agentFlows.push(formatted);
                    break;
            }
        });

        return grouped;
    }

    /**
     * Update item
     */
    update(itemId, userId, updates) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'description', 'prompt', 'command', 'tags', 'visibility', 'metadata'];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (field === 'tags' || field === 'metadata') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
            }
        });

        if (fields.length === 0) return false;

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(itemId, userId);

        const stmt = this.db.prepare(`
      UPDATE items SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

        const result = stmt.run(...values);
        return result.changes > 0;
    }

    /**
     * Delete item
     */
    delete(itemId, userId) {
        const stmt = this.db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?');
        const result = stmt.run(itemId, userId);
        return result.changes > 0;
    }

    /**
     * Mark item as verified (admin only)
     */
    setVerified(itemId, verified = true) {
        const stmt = this.db.prepare(`
      UPDATE items SET verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
        stmt.run(verified ? 1 : 0, itemId);
    }

    /**
     * Record a download
     */
    recordDownload(itemId, userId = null) {
        const stmt = this.db.prepare(`
      INSERT INTO item_downloads (id, item_id, user_id) VALUES (?, ?, ?)
    `);
        stmt.run(uuidv4(), itemId, userId);
    }

    /**
     * Get download count
     */
    getDownloadCount(itemId) {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM item_downloads WHERE item_id = ?
    `);
        return stmt.get(itemId).count;
    }

    /**
     * Format item for API response
     */
    formatItem(item) {
        return {
            id: item.id,
            userId: item.user_id,
            itemType: item.item_type,
            name: item.name,
            description: item.description,
            prompt: item.prompt,
            command: item.command,
            tags: item.tags ? JSON.parse(item.tags) : [],
            visibility: item.visibility,
            verified: Boolean(item.verified),
            downloadUrl: item.download_url,
            bundlePath: item.bundle_path,
            metadata: item.metadata ? JSON.parse(item.metadata) : {},
            createdAt: item.created_at,
            updatedAt: item.updated_at
        };
    }
}

module.exports = Item;