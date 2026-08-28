# Integration Guide: Connecting Your Hub to Akili

This guide shows you how to connect your custom Community Hub to your Akili instance.

## Step 1: Start Your Community Hub

### Using npm:

```bash
cd community-hub-server
npm install
npm run migrate
npm run seed
npm start
```

### Using Docker:

```bash
cd community-hub-server
docker-compose up -d
docker-compose exec community-hub npm run seed
```

Your hub should now be running at `http://localhost:5001`

## Step 2: Test the Hub

Visit `http://localhost:5001` in your browser or use curl:

```bash
curl http://localhost:5001/health
```

You should see:

```json
{
  "status": "ok",
  "service": "Akili Community Hub",
  "version": "1.0.0"
}
```

## Step 3: Get Your Admin Connection Key

After running the seed script, you'll see output like:

```
Admin Credentials:
  Email: admin@example.com
  Password: changeme123
  Connection Key: ahub_abc123...
```

Save this connection key - you'll need it!

Or login to get it:

```bash
curl -X POST http://localhost:5001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme123"}'
```

## Step 4: Update Akili Server

There are two ways to connect Akili to your hub:

### Method A: Environment Variable (Recommended)

Add this to your Akili server's `.env`:

```bash
# For local development
COMMUNITY_HUB_API_URL=http://localhost:5001/v1

# For production (if hub is on different server)
COMMUNITY_HUB_API_URL=https://your-hub-domain.com/v1
```

Then restart Akili server.

### Method B: Modify Source Code

Edit `server/models/communityHub.js` in your Akili directory:

```javascript
const CommunityHub = {
  importPrefix: "allm-community-id",
  apiBase:
    process.env.COMMUNITY_HUB_API_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:5001/v1"
      : "http://localhost:5001/v1"),
  // ... rest of the code
};
```

## Step 5: Configure Hub Connection in Akili UI

1. Start your Akili instance
2. Go to **Settings** → **Community Hub** (or similar section)
3. Enter your connection key: `ahub_abc123...`
4. Save settings

## Step 6: Test the Integration

### Add Your First Item

Create a system prompt in your hub:

```bash
curl -X POST http://localhost:5001/v1/system-prompt/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ahub_YOUR_CONNECTION_KEY" \
  -d '{
    "name": "Test Prompt",
    "description": "A test system prompt",
    "prompt": "You are a helpful assistant for testing.",
    "tags": ["test"],
    "visibility": "public"
  }'
```

You'll get a response like:

```json
{
  "success": true,
  "item": {
    "id": "abc-123-def-456"
  }
}
```

### Import in Akili

The import ID will be:

```
allm-community-id:system-prompt:abc-123-def-456
```

Use this in Akili's import feature!

## Step 7: Browse Items from Akili

In Akili, you should now be able to:

- Browse community items
- See your created items
- Import items to workspaces
- Create new items

## Troubleshooting

### Hub Not Accessible from Akili

**If on same machine:**

- Use `http://localhost:5001/v1`

**If in Docker containers:**

- Use Docker network names
- Or use host.docker.internal: `http://host.docker.internal:5001/v1`

**If on different servers:**

- Ensure firewall allows connection
- Use full URL: `https://hub.yourdomain.com/v1`

### CORS Errors

Add Akili's URL to hub's `.env`:

```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://your-anythingllm-url
```

Restart the hub.

### Connection Key Not Working

1. Verify the key in hub database:

```bash
# If using SQLite
sqlite3 data/hub.db "SELECT connection_key FROM users WHERE email='admin@example.com';"
```

2. Or regenerate it:

```bash
curl -X POST http://localhost:5001/v1/auth/regenerate-key \
  -H "Authorization: Bearer ahub_OLD_KEY"
```

### Items Not Showing

1. Check if items are public:

```bash
curl http://localhost:5001/v1/explore
```

2. Verify in database:

```bash
sqlite3 data/hub.db "SELECT id, name, visibility FROM items;"
```

## Advanced Configuration

### Remote Hub Deployment

If deploying hub on a separate server:

1. **Update BASE_URL in hub's .env:**

```env
BASE_URL=https://hub.yourdomain.com
```

2. **Setup HTTPS (using nginx):**

```nginx
server {
    listen 443 ssl;
    server_name hub.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Update Akili:**

```bash
COMMUNITY_HUB_API_URL=https://hub.yourdomain.com/v1
```

### Using with Multiple Akili Instances

You can use one hub for multiple Akili instances:

1. Each instance connects with same or different connection keys
2. Add all instance URLs to `ALLOWED_ORIGINS`
3. Users can share items across instances

### Team Setup

Create additional users for team members:

```bash
curl -X POST http://localhost:5001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "team@example.com",
    "password": "securepass123"
  }'
```

Each team member gets their own connection key.

## Next Steps

- [ ] Create more items (prompts, commands, skills)
- [ ] Share items with team
- [ ] Setup automated backups
- [ ] Configure SSL/HTTPS for production
- [ ] Monitor hub logs and usage
- [ ] Setup regular database maintenance

## Support

If you encounter issues:

1. Check hub logs: `docker-compose logs -f` or console output
2. Check Akili logs
3. Test API directly with curl
4. Verify network connectivity
5. Check CORS and firewall settings

## Example Full Stack Setup

**Hub Server (5001):**

```bash
cd community-hub-server
docker-compose up -d
```

**Akili Server (3001):**

```bash
cd Akili/server
# Add to .env: COMMUNITY_HUB_API_URL=http://localhost:5001/v1
yarn start
```

**Akili Frontend (3000):**

```bash
cd Akili/frontend
yarn start
```

Now your full stack is running with custom community hub! 🎉

---

Need help? Check the main README.md for more details.



