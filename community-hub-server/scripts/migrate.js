require('dotenv').config();
const HubDatabase = require('../database/schema');

const DATABASE_PATH = process.env.DATABASE_PATH || './data/hub.db';

console.log('Running database migrations...');
console.log(`Database path: ${DATABASE_PATH}`);

try {
    const db = new HubDatabase(DATABASE_PATH);
    console.log('✓ Database migrations completed successfully');
    db.close();
    process.exit(0);
} catch (error) {
    console.error('✗ Database migration failed:', error);
    process.exit(1);



