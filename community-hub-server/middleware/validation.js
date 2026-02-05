/**
 * Validate item creation data
 */
function validateItemCreation(req, res, next) {
    const { itemType } = req.params;
    const data = req.body;

    // Validate item type
    const validTypes = ['system-prompt', 'slash-command', 'agent-skill', 'agent-flow'];
    if (!validTypes.includes(itemType)) {
        return res.status(400).json({
            error: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
    }

    // Common validations
    if (!data.name || data.name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
    }

    if (data.name.length > 200) {
        return res.status(400).json({ error: 'Name must be 200 characters or less' });
    }

    if (data.description && data.description.length > 1000) {
        return res.status(400).json({ error: 'Description must be 1000 characters or less' });
    }

    // Type-specific validations
    if (itemType === 'system-prompt') {
        if (!data.prompt || data.prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required for system prompts' });
        }
    }

    if (itemType === 'agent-flow') {
        if (!data.flow) {
            return res.status(400).json({ error: 'Flow configuration is required for agent flows' });
        }
    }

    if (itemType === 'slash-command') {
        if (!data.command || data.command.trim().length === 0) {
            return res.status(400).json({ error: 'Command is required for slash commands' });
        }
        if (!data.prompt || data.prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required for slash commands' });
        }
        // Validate command format
        if (!data.command.startsWith('/')) {
            data.command = '/' + data.command;
        }
    }

    // Validate visibility
    if (data.visibility && !['public', 'private'].includes(data.visibility)) {
        return res.status(400).json({ error: 'Visibility must be either "public" or "private"' });
    }

    // Validate tags
    if (data.tags) {
        if (!Array.isArray(data.tags)) {
            return res.status(400).json({ error: 'Tags must be an array' });
        }
        if (data.tags.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 tags allowed' });
        }
        if (data.tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
            return res.status(400).json({ error: 'Each tag must be a string of 50 characters or less' });
        }
    }

    next();
}

/**
 * Validate import ID format
 */
function validateImportId(req, res, next) {
    const importId = req.body.importId || req.params.importId;

    if (!importId) {
        return res.status(400).json({ error: 'Import ID is required' });
    }

    // Format: allm-community-id:entityType:entityId
    const parts = importId.split(':');
    if (parts.length !== 3 || parts[0] !== 'allm-community-id') {
        return res.status(400).json({ error: 'Invalid import ID format' });
    }

    const [_, entityType, entityId] = parts;

    if (!entityType || !entityId) {
        return res.status(400).json({ error: 'Invalid import ID format' });
    }

    req.parsedImportId = { entityType, entityId };
    next();
}

/**
 * Validate user registration
 */
function validateUserRegistration(req, res, next) {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    next();
}

module.exports = {
    validateItemCreation,
    validateImportId,
    validateUserRegistration
};