# Quick Start Guide

Get your Community Hub running in under 5 minutes!

## Prerequisites

- Node.js 18+ or Docker
- 100MB free disk space

## Option 1: Quick Start with npm (Recommended)

### Windows:

```cmd
cd community-hub-server
start.bat
```

### Linux/Mac:

```bash
cd community-hub-server
chmod +x start.sh
./start.sh
```

That's it! The script will:

1. Install dependencies
2. Create database
3. Seed with sample data
4. Start the server

## Option 2: Docker (One Command)

```bash
cd community-hub-server
docker-compose up -d
docker-compose exec community-hub npm run seed
```

## Access Your Hub

- **API**: http://localhost:5001
- **Health**: http://localhost:5001/health
- **Explore**: http://localhost:5001/v1/explore

## Default Admin Login

After seeding, use these credentials:

- **Email**: `admin@example.com`
- **Password**: `changeme123`

⚠️ **Change these immediately in production!**

## Get Your Connection Key

### Via Login:

```bash
curl -X POST http://localhost:5001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme123"}'
```

Look for `connectionKey` in the response - this is what you'll use in Akili!

### From Seed Output:

Check the terminal output after running the seed script.

## Connect to Akili

1. Add to your Akili server's `.env`:

   ```bash
   COMMUNITY_HUB_API_URL=http://localhost:5001/v1
   ```

2. Restart Akili server

3. In Akili UI, go to Settings → Community Hub

4. Enter your connection key

5. Done! 🎉

## Test the API

Run the example client:

```bash
node client-example.js
```

## Next Steps

- [ ] Change admin password
- [ ] Create your first items
- [ ] Configure for production (see README.md)
- [ ] Setup HTTPS with reverse proxy
- [ ] Enable backups

## Need Help?

- Full Documentation: [README.md](README.md)
- Integration Guide: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- Issues: Create a GitHub issue

## Common Issues

### Port 5001 already in use?

Change `PORT` in `.env` file

### Can't connect from Akili?

Check CORS settings in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Database errors?

Delete and recreate:

```bash
rm -rf data/
npm run migrate
npm run seed
```

---

Happy sharing! 🚀



