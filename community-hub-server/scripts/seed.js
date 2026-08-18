require('dotenv').config();
const MongoDB = require('../database/mongodb');
const UserModel = require('../models/UserMongo');
const ItemModel = require('../models/ItemMongo');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Akili-hub';

async function seed() {
  console.log('Seeding database...');
  console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//*****:*****@')}`);

  try {
    const mongodb = new MongoDB(MONGODB_URI);
    await mongodb.connect();
    
    const userModel = new UserModel();
    const itemModel = new ItemModel();

    // Create admin user
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'changeme123';

    console.log('\nCreating admin user...');
    const existingAdmin = await userModel.findByEmail(adminEmail);
    
    let admin;
    if (existingAdmin) {
      console.log(`Admin user already exists: ${adminEmail}`);
      admin = existingAdmin;
    } else {
      admin = await userModel.create(adminEmail, adminPassword, true);
      console.log(`✓ Admin user created: ${adminEmail}`);
      console.log(`  Connection Key: ${admin.connectionKey}`);
    }

        // Create sample items
        console.log('\nCreating sample items...');

    // Sample system prompt
    const systemPrompt = await itemModel.create(admin.id || admin._id, {
            itemType: 'system-prompt',
            name: 'Professional Assistant',
            description: 'A system prompt for a professional and helpful AI assistant',
            prompt: 'You are a professional and helpful AI assistant. Always provide clear, accurate, and well-structured responses. Be courteous and maintain a professional tone.',
            tags: ['professional', 'assistant', 'general'],
            visibility: 'public'
        });
        console.log(`✓ Created system prompt: ${systemPrompt.name}`);

    // Sample slash command
    const slashCommand = await itemModel.create(admin.id || admin._id, {
            itemType: 'slash-command',
            name: 'Code Review',
            description: 'Review code for best practices and potential issues',
            command: '/code-review',
            prompt: 'Please review the following code for best practices, potential bugs, security issues, and performance improvements. Provide specific suggestions.',
            tags: ['code', 'review', 'development'],
            visibility: 'public'
        });
        console.log(`✓ Created slash command: ${slashCommand.name}`);

    // Sample agent flow
    const agentFlow = await itemModel.create(admin.id || admin._id, {
            itemType: 'agent-flow',
            name: 'Research Assistant',
            description: 'An agent flow for conducting research and summarizing findings',
            prompt: 'You are a research assistant. When given a topic, research it thoroughly and provide a comprehensive summary with key points and sources.',
            tags: ['research', 'summary', 'agent'],
            visibility: 'public'
        });
        console.log(`✓ Created agent flow: ${agentFlow.name}`);

        console.log('\n════════════════════════════════════════════════════════');
        console.log('✓ Database seeding completed successfully!');
        console.log('════════════════════════════════════════════════════════');
        console.log('\nAdmin Credentials:');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
        console.log(`  Connection Key: ${admin.connection_key || admin.connectionKey}`);
        console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    console.log('════════════════════════════════════════════════════════\n');

    await mongodb.disconnect();
    process.exit(0);
    } catch (error) {
        console.error('✗ Database seeding failed:', error);
        process.exit(1);
    }
}

seed();