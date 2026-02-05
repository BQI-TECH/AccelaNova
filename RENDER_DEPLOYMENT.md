# Deploying Accelanova to Render using Docker

This guide will help you deploy Accelanova to Render using Docker.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Render CLI installed (optional, for command-line deployment)

## Option 1: Deploy via Render Dashboard (Recommended)

### Step 1: Connect Your Repository

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Select your repository and branch

### Step 2: Configure the Service

1. **Name**: `accelanova` (or your preferred name)
2. **Region**: Choose closest to your users (e.g., `Oregon`, `Frankfurt`, `Singapore`)
3. **Branch**: `main` (or your default branch)
4. **Root Directory**: Leave empty (root of repository)
5. **Runtime**: Select **"Docker"**
6. **Dockerfile Path**: `docker/Dockerfile`
7. **Docker Context**: `.` (root directory)
8. **Plan**: Choose based on your needs:
   - **Starter**: $7/month (512 MB RAM, 0.5 CPU)
   - **Standard**: $25/month (2 GB RAM, 1 CPU) - Recommended
   - **Pro**: $85/month (4 GB RAM, 2 CPU)

### Step 3: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `accelanova-db`
   - **Database**: `accelanova`
   - **User**: `accelanova`
   - **Region**: Same as your web service
   - **Plan**: Starter (free tier available) or higher
3. Click **"Create Database"**
4. Copy the **Internal Database URL** (you'll need this)

### Step 4: Configure Environment Variables

In your web service settings, add these environment variables:

#### Required Variables

```
NODE_ENV=production
ANYTHING_LLM_RUNTIME=docker
STORAGE_DIR=/opt/render/project/src/storage
SERVER_PORT=10000
DATABASE_URL=<paste-internal-database-url-from-postgres-service>
```

#### LLM Provider Configuration

Choose one LLM provider and configure:

**For Gemini:**
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_LLM_MODEL_PREF=gemini-2.0-flash-lite
```

**For OpenAI:**
```
LLM_PROVIDER=openai
OPEN_AI_KEY=your-openai-api-key
OPEN_MODEL_PREF=gpt-4o
```

**For Anthropic:**
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL_PREF=claude-2
```

#### Vector Database Configuration

**For Pinecone:**
```
VECTOR_DB=pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=accelanova-main
```

**For LanceDB (default, no config needed):**
```
VECTOR_DB=lancedb
```

#### Other Important Variables

```
JWT_SECRET=your-random-secret-string-min-12-chars
SIG_KEY=your-random-secret-string-min-32-chars
SIG_SALT=your-random-secret-string-min-32-chars
WHISPER_PROVIDER=local
TTS_PROVIDER=native
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will build your Docker image and deploy
3. Monitor the build logs for any issues
4. Once deployed, your app will be available at `https://your-service-name.onrender.com`

## Option 2: Deploy using Render CLI

### Install Render CLI

```bash
# macOS/Linux
curl -fsSL https://render.com/cli.sh | bash

# Windows (using Git Bash or WSL)
curl -fsSL https://render.com/cli.sh | bash
```

### Login to Render

```bash
render login
```

### Deploy using Blueprint

If you have a `render.yaml` file (already created in this repo):

```bash
render deploy
```

This will create all services defined in `render.yaml`.

### Manual CLI Deployment

```bash
# Create PostgreSQL database
render databases create \
  --name accelanova-db \
  --database accelanova \
  --user accelanova \
  --plan starter \
  --region oregon

# Create web service
render services create web \
  --name accelanova \
  --dockerfilePath ./docker/Dockerfile \
  --dockerContext . \
  --plan standard \
  --region oregon \
  --env DATABASE_URL=<your-database-url> \
  --env NODE_ENV=production \
  --env ANYTHING_LLM_RUNTIME=docker \
  --env STORAGE_DIR=/opt/render/project/src/storage \
  --env SERVER_PORT=10000
```

## Option 3: Use render.yaml Blueprint

The `render.yaml` file in this repository defines the infrastructure as code.

1. Push your code to Git
2. In Render Dashboard:
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository
   - Render will detect `render.yaml` and create all services

## Post-Deployment

### 1. Run Database Migrations

The Docker entrypoint automatically runs Prisma migrations, but you can verify:

```bash
# SSH into your service (if available) or use Render Shell
cd /app/server
npx prisma migrate deploy
```

### 2. Access Your Application

- Your app will be available at: `https://your-service-name.onrender.com`
- The health check endpoint: `https://your-service-name.onrender.com/api/system/health-check`

### 3. Set Up Persistent Storage

Render provides persistent disk storage. The `STORAGE_DIR` environment variable is set to use Render's persistent storage path.

### 4. Monitor Logs

- View logs in Render Dashboard under your service
- Use `render logs` CLI command

## Troubleshooting

### Build Fails

- Check Dockerfile path is correct: `docker/Dockerfile`
- Verify Docker context is set to root: `.`
- Check build logs for specific errors

### Database Connection Issues

- Verify `DATABASE_URL` uses the **Internal Database URL** from your PostgreSQL service
- Format: `postgresql://user:password@host:port/database`
- Ensure database and web service are in the same region

### Application Crashes

- Check environment variables are set correctly
- Verify all required API keys are provided
- Check application logs in Render Dashboard

### Storage Issues

- Ensure `STORAGE_DIR` is set to `/opt/render/project/src/storage`
- This path provides persistent storage on Render

## Updating Your Deployment

### Via Dashboard

1. Push changes to your Git repository
2. Render will auto-deploy if auto-deploy is enabled
3. Or manually trigger deploy from Dashboard

### Via CLI

```bash
render services deploy <service-id>
```

## Cost Estimation

- **Web Service (Standard)**: $25/month
- **PostgreSQL (Starter)**: Free tier available, or $7/month
- **Total**: ~$25-32/month for basic setup

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Docker Guide](https://render.com/docs/docker)
- [Accelanova Documentation](https://docs.accelanova.com)


