# Akili Community Hub API Server

A custom, self-hosted community hub API server for Akili/AnythingLLM. This allows you to create your own marketplace for sharing system prompts, slash commands, agent skills, and agent flows.

## Features

- 🔐 **Authentication** - JWT-based authentication with connection keys
- 📦 **Item Management** - Create, update, delete system prompts, slash commands, agent skills, and agent flows
- 🌐 **Public/Private Items** - Control visibility of your shared items
- ✅ **Verification System** - Admin verification for trusted items
- 📊 **Analytics** - Track downloads and usage
- 🚀 **Bundle Support** - Upload and distribute agent skill bundles
- 🐳 **Docker Ready** - Easy deployment with Docker/Docker Compose
- 🔒 **Secure** - Rate limiting, CORS, helmet protection

## Quick Start

### Option 1: Using npm

1. **Install dependencies:**

```bash
cd community-hub-server
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Run migrations and seed:**

```bash
npm run migrate
npm run seed
```

4. **Start the server:**

```bash
# Development
npm run dev

# Production
npm start
```

### Option 2: Using Docker

1. **Build and run:**

```bash
docker-compose up -d
```

2. **Seed the database:**

```bash
docker-compose exec community-hub npm run seed
```

The server will be available at `http://localhost:5001`

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5001
NODE_ENV=development
BASE_URL=http://localhost:5001

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
DATABASE_PATH=./data/hub.db

# File Storage
STORAGE_PATH=./storage/bundles
MAX_BUNDLE_SIZE_MB=50

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Setup
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=changeme123
```

## Connecting to Akili/AnythingLLM

### Update the AnythingLLM Server

In your AnythingLLM server code, modify `server/models/communityHub.js`:

```javascript
apiBase: process.env.COMMUNITY_HUB_API_URL ||
         (process.env.NODE_ENV === "development" ?
           "http://localhost:5001/v1" :
           "http://localhost:5001/v1"),
```

Or set the environment variable:

```bash
COMMUNITY_HUB_API_URL=http://localhost:5001/v1
```

### For Remote Hub

If hosting remotely, update `BASE_URL` in the hub's `.env`:

```env
BASE_URL=https://your-domain.com
```

And in AnythingLLM:

```bash
COMMUNITY_HUB_API_URL=https://your-domain.com/v1
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /v1/explore` - List public items
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login

### Authenticated Endpoints

Require `Authorization: Bearer <connection_key>` header:

- `GET /v1/auth/me` - Get current user
- `POST /v1/auth/regenerate-key` - Regenerate connection key
- `GET /v1/items` - Get user's items
- `GET /v1/:entityType/:entityId/pull` - Get specific item
- `POST /v1/:itemType/create` - Create new item
- `POST /v1/agent-skill/upload` - Upload agent skill bundle
- `PUT /v1/items/:itemId` - Update item
- `DELETE /v1/items/:itemId` - Delete item

### Admin Endpoints

- `POST /v1/admin/items/:itemId/verify` - Verify item

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:5001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Create a System Prompt

```bash
curl -X POST http://localhost:5001/v1/system-prompt/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ahub_your_connection_key" \
  -d '{
    "name": "Code Expert",
    "description": "Expert coding assistant",
    "prompt": "You are an expert programmer...",
    "tags": ["code", "expert"],
    "visibility": "public"
  }'
```

### Create a Slash Command

```bash
curl -X POST http://localhost:5001/v1/slash-command/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ahub_your_connection_key" \
  -d '{
    "name": "Summarize",
    "description": "Summarize content",
    "command": "/summarize",
    "prompt": "Please summarize the following:",
    "tags": ["utility"],
    "visibility": "public"
  }'
```

### Upload Agent Skill Bundle

```bash
curl -X POST http://localhost:5001/v1/agent-skill/upload \
  -H "Authorization: Bearer ahub_your_connection_key" \
  -F "bundle=@skill.zip" \
  -F "name=My Skill" \
  -F "description=Custom agent skill" \
  -F 'tags=["skill","agent"]' \
  -F "visibility=public"
```

### Browse Public Items

```bash
curl http://localhost:5001/v1/explore
```

## Import ID Format

Items are referenced using the format:

```
allm-community-id:<itemType>:<itemId>
```

Example: `allm-community-id:system-prompt:abc123-def456`

## Database

The server uses SQLite by default, stored at `./data/hub.db`. The schema includes:

- **users** - User accounts and connection keys
- **items** - All community hub items
- **teams** - Team management (future)
- **team_members** - Team membership (future)
- **item_downloads** - Download analytics

## Security Considerations

1. **Change Default Credentials** - Update admin password after seeding
2. **Use Strong JWT Secret** - Generate a strong random string
3. **Enable HTTPS** - Use reverse proxy (nginx/caddy) with SSL
4. **Rate Limiting** - Configured by default, adjust as needed
5. **CORS** - Restrict origins in production
6. **Bundle Validation** - Verify agent skill bundles before uploading
7. **File Size Limits** - Adjust `MAX_BUNDLE_SIZE_MB` as needed

## Production Deployment

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name hub.yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Using PM2

```bash
npm install -g pm2
pm2 start index.js --name community-hub
pm2 save
pm2 startup
```

## Backup

Regularly backup your database and storage:

```bash
# Backup database
cp data/hub.db data/hub.db.backup

# Backup storage
tar -czf storage-backup.tar.gz storage/
```

## Troubleshooting

### Port Already in Use

```bash
# Change PORT in .env or kill the process
lsof -ti:5001 | xargs kill -9
```

### Permission Errors

```bash
# Ensure directories are writable
chmod -R 755 data storage
```

### Database Locked

```bash
# Close all connections and restart
rm data/hub.db-shm data/hub.db-wal
```

## Development

### Run Tests

```bash
npm test  # (Add tests as needed)
```

### Watch Mode

```bash
npm run dev
```

### Database Reset

```bash
rm data/hub.db
npm run migrate
npm run seed
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues related to:

- **This Hub Server**: Create an issue in this repository
- **AnythingLLM Integration**: Refer to AnythingLLM documentation
- **General Questions**: Check the AnythingLLM community

## Roadmap

- [ ] Team management functionality
- [ ] Advanced search and filtering
- [ ] Item ratings and reviews
- [ ] Usage statistics dashboard
- [ ] PostgreSQL/MySQL support
- [ ] S3/cloud storage support
- [ ] OAuth authentication
- [ ] Web UI for hub management

---

Made with ❤️ for the Akili/AnythingLLM community



