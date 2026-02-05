const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../database/schemas');

class UserModel {
  /**
   * Create a new user
   */
  async create(email, password, isAdmin = false) {
    const passwordHash = await bcrypt.hash(password, 10);
    const connectionKey = this.generateConnectionKey();

    try {
      const user = await User.create({
        email,
        password_hash: passwordHash,
        connection_key: connectionKey,
        is_admin: isAdmin
      });

      return {
        id: user._id.toString(),
        email: user.email,
        connectionKey: user.connection_key,
        isAdmin: user.is_admin
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    return user;
  }

  /**
   * Find user by connection key
   */
  async findByConnectionKey(connectionKey) {
    const user = await User.findOne({ connection_key: connectionKey }).lean();
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    const user = await User.findById(id).lean();
    return user;
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
  async regenerateConnectionKey(userId) {
    const newKey = this.generateConnectionKey();
    await User.findByIdAndUpdate(userId, {
      connection_key: newKey
    });
    return newKey;
  }

  /**
   * Update user
   */
  async update(userId, data) {
    const updates = {};

    if (data.email) {
      updates.email = data.email;
    }

    if (data.password) {
      updates.password_hash = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, updates);
    }
  }

  /**
   * Delete user
   */
  async delete(userId) {
    await User.findByIdAndDelete(userId);
  }

  /**
   * List all users (admin only)
   */
  async listAll() {
    const users = await User.find({}, {
      password_hash: 0,
      connection_key: 0
    }).sort({ created_at: -1 }).lean();
    
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      is_admin: user.is_admin,
      created_at: user.created_at
    }));
  }
}

module.exports = UserModel;




