/**
 * Example client for testing the Community Hub API
 * 
 * Usage:
 *   node client-example.js
 */

const BASE_URL = 'http://localhost:5001';
let connectionKey = null;

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, auth = false) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (auth && connectionKey) {
        headers['Authorization'] = `Bearer ${connectionKey}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test functions
async function testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    const result = await apiCall('/health');
    console.log('Result:', result.data);
    return result.success;
}

async function testRegister() {
    console.log('\n=== Testing User Registration ===');
    const result = await apiCall('/v1/auth/register', 'POST', {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123'
    });

    if (result.success) {
        connectionKey = result.data.user.connectionKey;
        console.log('✓ Registration successful!');
        console.log('Connection Key:', connectionKey);
    } else {
        console.log('✗ Registration failed:', result.data);
    }

    return result.success;
}

async function testLogin() {
    console.log('\n=== Testing Login ===');
    const result = await apiCall('/v1/auth/login', 'POST', {
        email: 'admin@example.com',
        password: 'changeme123'
    });

    if (result.success) {
        connectionKey = result.data.user.connectionKey;
        console.log('✓ Login successful!');
        console.log('Connection Key:', connectionKey);
    } else {
        console.log('✗ Login failed:', result.data);
    }

    return result.success;
}

async function testExplore() {
    console.log('\n=== Testing Explore Public Items ===');
    const result = await apiCall('/v1/explore');

    if (result.success) {
        console.log('✓ Explore successful!');
        console.log('System Prompts:', result.data.systemPrompts.totalCount);
        console.log('Slash Commands:', result.data.slashCommands.totalCount);
        console.log('Agent Skills:', result.data.agentSkills.totalCount);
        console.log('Agent Flows:', result.data.agentFlows ? .totalCount || 0);
    } else {
        console.log('✗ Explore failed:', result.data);
    }

    return result.success;
}

async function testCreateSystemPrompt() {
    console.log('\n=== Testing Create System Prompt ===');
    const result = await apiCall('/v1/system-prompt/create', 'POST', {
        name: 'Test System Prompt',
        description: 'A test system prompt created by client example',
        prompt: 'You are a helpful test assistant.',
        tags: ['test', 'example'],
        visibility: 'public'
    }, true);

    if (result.success) {
        console.log('✓ System prompt created!');
        console.log('Item ID:', result.data.item.id);
        console.log('Import ID:', `allm-community-id:system-prompt:${result.data.item.id}`);
        return result.data.item.id;
    } else {
        console.log('✗ Creation failed:', result.data);
        return null;
    }
}

async function testCreateSlashCommand() {
    console.log('\n=== Testing Create Slash Command ===');
    const result = await apiCall('/v1/slash-command/create', 'POST', {
        name: 'Test Command',
        description: 'A test slash command',
        command: '/test',
        prompt: 'Execute a test command with the following input:',
        tags: ['test', 'command'],
        visibility: 'public'
    }, true);

    if (result.success) {
        console.log('✓ Slash command created!');
        console.log('Item ID:', result.data.item.id);
        console.log('Import ID:', `allm-community-id:slash-command:${result.data.item.id}`);
        return result.data.item.id;
    } else {
        console.log('✗ Creation failed:', result.data);
        return null;
    }
}

async function testGetItem(itemType, itemId) {
    console.log(`\n=== Testing Get Item (${itemType}) ===`);
    const result = await apiCall(`/v1/${itemType}/${itemId}/pull`, 'GET', null, true);

    if (result.success && result.data.item) {
        console.log('✓ Item retrieved!');
        console.log('Name:', result.data.item.name);
        console.log('Description:', result.data.item.description);
        console.log('Visibility:', result.data.item.visibility);
    } else {
        console.log('✗ Get item failed:', result.data);
    }

    return result.success;
}

async function testListUserItems() {
    console.log('\n=== Testing List User Items ===');
    const result = await apiCall('/v1/items', 'GET', null, true);

    if (result.success) {
        console.log('✓ User items retrieved!');
        console.log('System Prompts:', result.data.createdByMe.systemPrompts ? .length || 0);
        console.log('Slash Commands:', result.data.createdByMe.slashCommands ? .length || 0);
        console.log('Agent Skills:', result.data.createdByMe.agentSkills ? .length || 0);
    } else {
        console.log('✗ List items failed:', result.data);
    }

    return result.success;
}

// Run all tests
async function runTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Community Hub API - Client Example & Test Suite     ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    let testsPassed = 0;
    let testsFailed = 0;

    // Health check
    if (await testHealthCheck()) testsPassed++;
    else testsFailed++;

    // Try to login first
    const loginSuccess = await testLogin();
    if (loginSuccess) {
        testsPassed++;
    } else {
        // If login fails, try register
        testsFailed++;
        if (await testRegister()) testsPassed++;
        else testsFailed++;
    }

    if (!connectionKey) {
        console.log('\n✗ Cannot continue without authentication');
        return;
    }

    // Explore items
    if (await testExplore()) testsPassed++;
    else testsFailed++;

    // Create items
    const promptId = await testCreateSystemPrompt();
    if (promptId) {
        testsPassed++;
        // Get the created item
        if (await testGetItem('system-prompt', promptId)) testsPassed++;
        else testsFailed++;
    } else {
        testsFailed++;
    }

    const commandId = await testCreateSlashCommand();
    if (commandId) {
        testsPassed++;
        // Get the created item
        if (await testGetItem('slash-command', commandId)) testsPassed++;
        else testsFailed++;
    } else {
        testsFailed++;
    }

    // List user items
    if (await testListUserItems()) testsPassed++;
    else testsFailed++;

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    Test Summary                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`✓ Tests Passed: ${testsPassed}`);
    console.log(`✗ Tests Failed: ${testsFailed}`);
    console.log(`  Total Tests: ${testsPassed + testsFailed}`);
    console.log('\n');
}

// Run the tests



