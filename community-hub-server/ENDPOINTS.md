# Community Hub API Endpoints

This document lists ALL endpoints supported by the Community Hub server.

## Path Formats Supported

The hub supports multiple path formats for compatibility:

1. **Standard Paths**: `/v1/*`
2. **Firebase Cloud Functions Paths**: `/anythingllm-hub/us-central1/external/v1/*`
3. **AnythingLLM Proxy Paths**: `/community-hub/*`

## Public Endpoints (No Authentication Required)

### Health & Info

- `GET /health` - Health check
- `GET /` - API documentation

### Explore Public Items

- `GET /v1/explore`
- `GET /anythingllm-hub/us-central1/external/v1/explore`
- `GET /community-hub/explore`

### Authentication

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login and get connection key
- `POST /anythingllm-hub/us-central1/external/v1/auth/register`
- `POST /anythingllm-hub/us-central1/external/v1/auth/login`

## Authenticated Endpoints (Require Connection Key)

### User Profile & Settings

- `GET /v1/auth/me` - Get current user info
- `POST /v1/auth/regenerate-key` - Regenerate connection key
- `GET /me` - Get profile (alternative)
- `GET /settings` - Get user settings
- `GET /community-hub/settings` - Get hub settings
- `POST /community-hub/settings` - Update hub settings

### Items Management

#### List Items

- `GET /v1/items` - Get user's items
- `GET /anythingllm-hub/us-central1/external/v1/items`
- `GET /community-hub/items`

#### Get Specific Item

- `GET /v1/:entityType/:entityId/pull` - Get item by type and ID
- `GET /anythingllm-hub/us-central1/external/v1/:entityType/:entityId/pull`
- `POST /community-hub/item` - Get item by import ID

#### Create Items

- `POST /v1/system-prompt/create` - Create system prompt
- `POST /v1/slash-command/create` - Create slash command
- `POST /v1/agent-flow/create` - Create agent flow
- `POST /v1/agent-skill/upload` - Upload agent skill bundle
- `POST /anythingllm-hub/us-central1/external/v1/system-prompt/create`
- `POST /anythingllm-hub/us-central1/external/v1/slash-command/create`
- `POST /anythingllm-hub/us-central1/external/v1/agent-flow/create`
- `POST /community-hub/system-prompt/create`
- `POST /community-hub/slash-command/create`
- `POST /community-hub/agent-flow/create`

#### Update & Delete Items

- `PUT /v1/items/:itemId` - Update item
- `DELETE /v1/items/:itemId` - Delete item
- `PUT /anythingllm-hub/us-central1/external/v1/items/:itemId`
- `DELETE /anythingllm-hub/us-central1/external/v1/items/:itemId`

#### Apply & Import Items

- `POST /community-hub/apply` - Apply item (system prompts, slash commands)
- `POST /community-hub/import` - Import bundle item

### Downloads

- `GET /downloads/:filename` - Download bundle files

## Admin Endpoints (Require Admin Privileges)

- `POST /v1/admin/items/:itemId/verify` - Mark item as verified
- `POST /anythingllm-hub/us-central1/external/v1/admin/items/:itemId/verify`

## Request Headers

### For Authenticated Endpoints:

```http
Authorization: Bearer ahub_your_connection_key_here
Content-Type: application/json
```

## Response Formats

### Success Response (Items):

```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "itemType": "system-prompt",
    "name": "Item Name",
    "description": "Description",
    "prompt": "Prompt text",
    "tags": ["tag1", "tag2"],
    "visibility": "public",
    "verified": false,
    "createdAt": "2025-10-28 12:00:00"
  },
  "error": null
}
```

### Error Response:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Import ID Format

Items are referenced using the format:

```
allm-community-id:<itemType>:<itemId>
```

Example:

```
allm-community-id:system-prompt:f1683578-520b-47f4-be9a-2892629f0ce2
```

## Item Types

- `system-prompt` - System prompts for workspaces
- `slash-command` - Custom slash commands
- `agent-skill` - Agent skills (with bundle files)
- `agent-flow` - Agent workflow configurations

## CORS Configuration

The server allows cross-origin requests from configured origins.
Set `ALLOWED_ORIGINS=*` in `.env` to allow all origins (development only).

## Rate Limiting

- Window: 15 minutes (configurable)
- Max Requests: 100 per window (configurable)
- Applies to all `/v1/*` endpoints

## Examples

### Get Explore Items

```bash
curl http://localhost:5001/v1/explore
```

### Login

```bash
curl -X POST http://localhost:5001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme123"}'
```

### Create System Prompt

```bash
curl -X POST http://localhost:5001/v1/system-prompt/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ahub_your_key" \
  -d '{
    "name": "My Prompt",
    "description": "A custom prompt",
    "prompt": "You are helpful",
    "tags": ["custom"],
    "visibility": "public"
  }'
```

### Get Specific Item

```bash
curl http://localhost:5001/v1/system-prompt/ITEM_ID/pull \
  -H "Authorization: Bearer ahub_your_key"
```

## Testing

Use the included `client-example.js` to test all endpoints:

```bash
node client-example.js
```

---

For more information, see:

- [README.md](README.md) - Main documentation
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration with AnythingLLM
- [QUICK_START.md](QUICK_START.md) - Quick start guide



