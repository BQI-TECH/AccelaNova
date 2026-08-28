# Changelog

All notable changes to the Akili Community Hub project will be documented in this file.

## [1.0.0] - 2024-10-28

### Added

- Initial release of Community Hub API Server
- User authentication with connection keys
- Support for system prompts, slash commands, agent skills, and agent flows
- Public/private item visibility
- Admin verification system
- RESTful API endpoints matching Akili client expectations
- SQLite database with migration system
- File upload support for agent skill bundles
- Download tracking and analytics
- Rate limiting and security middleware
- Docker and Docker Compose support
- CORS configuration
- Health check endpoint
- Comprehensive documentation
- Example client and test suite
- Automated setup scripts (start.sh, start.bat)
- Integration guide for Akili

### Security

- JWT-based authentication
- Helmet.js security headers
- Rate limiting on API endpoints
- Password hashing with bcrypt
- Input validation middleware
- CORS protection

### Database

- Users table with connection keys
- Items table (unified for all types)
- Teams table (for future use)
- Team members table (for future use)
- Download analytics table
- Proper indexes for performance

### API Endpoints

- `GET /health` - Health check
- `GET /v1/explore` - Browse public items
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/auth/me` - Get current user
- `POST /v1/auth/regenerate-key` - Regenerate connection key
- `GET /v1/items` - List user's items
- `GET /v1/:entityType/:entityId/pull` - Get specific item
- `POST /v1/:itemType/create` - Create item
- `POST /v1/agent-skill/upload` - Upload bundle
- `PUT /v1/items/:itemId` - Update item
- `DELETE /v1/items/:itemId` - Delete item
- `POST /v1/admin/items/:itemId/verify` - Verify item (admin)

### Documentation

- README.md - Comprehensive guide
- INTEGRATION_GUIDE.md - Step-by-step integration
- QUICK_START.md - Get started in 5 minutes
- CHANGELOG.md - Version history
- LICENSE - MIT License

### Developer Tools

- client-example.js - Test client
- Migration scripts
- Seed scripts with sample data
- Automated setup scripts

## [Unreleased]

### Planned Features

- [ ] Team management functionality
- [ ] Advanced search and filtering
- [ ] Item ratings and reviews
- [ ] Usage statistics dashboard
- [ ] PostgreSQL/MySQL support
- [ ] S3/cloud storage support
- [ ] OAuth authentication
- [ ] Web UI for hub management
- [ ] Batch operations
- [ ] Import/export functionality
- [ ] Webhooks for item updates
- [ ] API versioning
- [ ] GraphQL support
- [ ] Real-time notifications
- [ ] Multi-language support

### Known Issues

- Team features are placeholders
- No web UI yet (API only)
- SQLite only (no PostgreSQL yet)
- Local file storage only (no S3 yet)

---

For detailed information about changes, see the Git commit history.



