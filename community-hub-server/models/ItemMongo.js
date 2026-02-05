const { Item, ItemDownload } = require('../database/schemas');

class ItemModel {
  /**
   * Create a new item
   */
  async create(userId, itemData) {
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

    const item = await Item.create({
      user_id: userId,
      item_type: itemType,
      name,
      description: description || null,
      prompt: prompt || null,
      command: command || null,
      tags: tags || [],
      visibility,
      download_url: downloadUrl || null,
      bundle_path: bundlePath || null,
      metadata: metadata || {}
    });

    return this.formatItem(item.toObject());
  }

  /**
   * Find item by ID
   */
  async findById(id) {
    try {
      const item = await Item.findById(id).lean();
      return item ? this.formatItem(item) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find public items by type
   */
  async findPublicByType(itemType, limit = 50, offset = 0) {
    const items = await Item.find({
      item_type: itemType,
      visibility: 'public'
    })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return items.map(item => this.formatItem(item));
  }

  /**
   * Count public items by type
   */
  async countPublicByType(itemType) {
    return await Item.countDocuments({
      item_type: itemType,
      visibility: 'public'
    });
  }

  /**
   * Find all public items (for explore)
   */
  async findAllPublic(limit = 20) {
    const agentSkills = await this.findPublicByType('agent-skill', limit);
    const systemPrompts = await this.findPublicByType('system-prompt', limit);
    const slashCommands = await this.findPublicByType('slash-command', limit);
    const agentFlows = await this.findPublicByType('agent-flow', limit);

    return {
      agentSkills: {
        items: agentSkills,
        hasMore: agentSkills.length === limit,
        totalCount: await this.countPublicByType('agent-skill')
      },
      systemPrompts: {
        items: systemPrompts,
        hasMore: systemPrompts.length === limit,
        totalCount: await this.countPublicByType('system-prompt')
      },
      slashCommands: {
        items: slashCommands,
        hasMore: slashCommands.length === limit,
        totalCount: await this.countPublicByType('slash-command')
      },
      agentFlows: {
        items: agentFlows,
        hasMore: agentFlows.length === limit,
        totalCount: await this.countPublicByType('agent-flow')
      }
    };
  }

  /**
   * Find items by user
   */
  async findByUser(userId) {
    const items = await Item.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

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
  async update(itemId, userId, updates) {
    const allowedFields = ['name', 'description', 'prompt', 'command', 'tags', 'visibility', 'metadata'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) return false;

    const result = await Item.findOneAndUpdate(
      { _id: itemId, user_id: userId },
      updateData
    );

    return result !== null;
  }

  /**
   * Delete item
   */
  async delete(itemId, userId) {
    const result = await Item.findOneAndDelete({
      _id: itemId,
      user_id: userId
    });
    
    return result !== null;
  }

  /**
   * Mark item as verified (admin only)
   */
  async setVerified(itemId, verified = true) {
    await Item.findByIdAndUpdate(itemId, { verified });
  }

  /**
   * Record a download
   */
  async recordDownload(itemId, userId = null) {
    await ItemDownload.create({
      item_id: itemId,
      user_id: userId
    });
  }

  /**
   * Get download count
   */
  async getDownloadCount(itemId) {
    return await ItemDownload.countDocuments({ item_id: itemId });
  }

  /**
   * Format item for API response
   */
  formatItem(item) {
    return {
      id: item._id.toString(),
      userId: item.user_id.toString(),
      itemType: item.item_type,
      name: item.name,
      description: item.description,
      prompt: item.prompt,
      command: item.command,
      tags: item.tags || [],
      visibility: item.visibility,
      verified: Boolean(item.verified),
      downloadUrl: item.download_url,
      bundlePath: item.bundle_path,
      metadata: item.metadata || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }
}

module.exports = ItemModel;




