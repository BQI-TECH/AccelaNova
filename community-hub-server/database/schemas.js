const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User Schema
 */
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  connection_key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  is_admin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

/**
 * Item Schema
 */
const ItemSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  item_type: {
    type: String,
    required: true,
    enum: ['system-prompt', 'slash-command', 'agent-skill', 'agent-flow'],
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  prompt: {
    type: String,
    default: null
  },
  command: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private',
    index: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  download_url: {
    type: String,
    default: null
  },
  bundle_path: {
    type: String,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for better query performance
ItemSchema.index({ item_type: 1, visibility: 1 });
ItemSchema.index({ user_id: 1, item_type: 1 });

/**
 * Team Schema
 */
const TeamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joined_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

/**
 * Item Download Schema (Analytics)
 */
const ItemDownloadSchema = new Schema({
  item_id: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  downloaded_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Item = mongoose.model('Item', ItemSchema);
const Team = mongoose.model('Team', TeamSchema);
const ItemDownload = mongoose.model('ItemDownload', ItemDownloadSchema);

module.exports = {
  User,
  Item,
  Team,
  ItemDownload
};




