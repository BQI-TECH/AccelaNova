#!/usr/bin/env node

/**
 * Comprehensive Test Script for Community Hub
 * Tests all endpoints and functionality
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5001';
let authToken = '';
let testUserId = '';
let testItemIds = {};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
    console.log(`\n${colors.cyan}━━━ Testing: ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
        method: options.method || 'GET',
        headers,
        ...options
    };

    if (options.body && typeof options.body === 'object' && !options.formData) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return { status: response.status, data, ok: response.ok };
    } catch (error) {
        logError(`Request failed: ${error.message}`);
        return { status: 0, data: null, ok: false, error: error.message };
    }
}

// Test 1: Health Check
async function testHealthCheck() {
    logTest('Health Check');
    const result = await makeRequest('/health', { skipAuth: true });

    // Handle both JSON and text responses
    const isOk = (typeof result.data === 'string' && result.data.includes('OK')) ||
        (typeof result.data === 'object' && result.data.status === 'ok');

    if (result.ok && isOk) {
        logSuccess('Health check passed');
        return true;
    } else {
        logError(`Health check failed: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 2: Login
async function testLogin() {
    logTest('Authentication - Login');
    const result = await makeRequest('/v1/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: {
            email: 'admin@example.com',
            password: 'changeme123'
        }
    });

    if (result.ok && result.data.success && result.data.user.connectionKey) {
        authToken = result.data.user.connectionKey;
        testUserId = result.data.user.email;
        logSuccess(`Login successful. Token: ${authToken.substring(0, 20)}...`);
        return true;
    } else {
        logError(`Login failed: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 3: Get User Profile
async function testGetProfile() {
    logTest('Get User Profile');
    const result = await makeRequest('/v1/auth/me');

    if (result.ok && result.data.user) {
        logSuccess(`Profile retrieved: ${result.data.user.email}`);
        return true;
    } else {
        logError(`Failed to get profile: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 4: Get Explore Items
async function testExploreItems() {
    logTest('Get Explore Items (Public)');
    const result = await makeRequest('/v1/explore', { skipAuth: true });

    if (result.ok && result.data && typeof result.data === 'object') {
        let totalCount = 0;
        Object.keys(result.data).forEach(category => {
            if (result.data[category] && result.data[category].items) {
                const count = result.data[category].items.length;
                totalCount += count;
                log(`  - ${category}: ${count} items`, 'blue');
            }
        });
        logSuccess(`Retrieved ${totalCount} public items across all categories`);
        return true;
    } else {
        logError(`Failed to get explore items: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 5: Create System Prompt
async function testCreateSystemPrompt() {
    logTest('Create System Prompt');
    const result = await makeRequest('/v1/system-prompt/create', {
        method: 'POST',
        body: {
            name: 'Test System Prompt',
            description: 'A test system prompt created by automated testing',
            prompt: 'You are a helpful assistant designed to help with testing.',
            tags: ['test', 'automation'],
            visibility: 'public'
        }
    });

    if (result.ok && result.data.success && result.data.item) {
        testItemIds.systemPrompt = result.data.item.id;
        logSuccess(`System prompt created: ${result.data.item.id}`);
        return true;
    } else {
        logError(`Failed to create system prompt: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 6: Create Slash Command
async function testCreateSlashCommand() {
    logTest('Create Slash Command');
    const result = await makeRequest('/v1/slash-command/create', {
        method: 'POST',
        body: {
            name: 'Test Command',
            description: 'A test slash command',
            command: '/test',
            prompt: 'Execute test: {{input}}',
            tags: ['test'],
            visibility: 'public'
        }
    });

    if (result.ok && result.data.success && result.data.item) {
        testItemIds.slashCommand = result.data.item.id;
        logSuccess(`Slash command created: ${result.data.item.id}`);
        return true;
    } else {
        logError(`Failed to create slash command: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 7: Create Agent Flow
async function testCreateAgentFlow() {
    logTest('Create Agent Flow');
    const result = await makeRequest('/v1/agent-flow/create', {
        method: 'POST',
        body: {
            name: 'Test Agent Flow',
            description: 'A test agent flow',
            flow: JSON.stringify({
                steps: [
                    { id: '1', name: 'Start', type: 'start' },
                    { id: '2', name: 'Process', type: 'process' },
                    { id: '3', name: 'End', type: 'end' }
                ]
            }),
            tags: ['test', 'flow'],
            visibility: 'public'
        }
    });

    if (result.ok && result.data.success && result.data.item) {
        testItemIds.agentFlow = result.data.item.id;
        logSuccess(`Agent flow created: ${result.data.item.id}`);
        return true;
    } else {
        logError(`Failed to create agent flow: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 8: Get User Items
async function testGetUserItems() {
    logTest('Get User Items');
    const result = await makeRequest('/v1/items');

    if (result.ok && result.data && typeof result.data === 'object') {
        let totalCount = 0;
        Object.keys(result.data).forEach(category => {
            if (Array.isArray(result.data[category])) {
                const count = result.data[category].length;
                totalCount += count;
                log(`  - ${category}: ${count} items`, 'blue');
            }
        });
        logSuccess(`Retrieved ${totalCount} user items across all categories`);
        return true;
    } else {
        logError(`Failed to get user items: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 9: Get Specific Item by Import ID
async function testGetItemByImportId() {
    logTest('Get Item by Import ID');

    if (!testItemIds.systemPrompt) {
        logWarning('Skipping - no test item created');
        return true;
    }

    const importId = `allm-community-id:system-prompt:${testItemIds.systemPrompt}`;
    const result = await makeRequest('/community-hub/item', {
        method: 'POST',
        body: { importId }
    });

    if (result.ok && result.data.success && result.data.item) {
        logSuccess(`Item retrieved by import ID: ${result.data.item.name}`);
        return true;
    } else {
        logError(`Failed to get item by import ID: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 10: Update Item
async function testUpdateItem() {
    logTest('Update Item');

    if (!testItemIds.systemPrompt) {
        logWarning('Skipping - no test item to update');
        return true;
    }

    const result = await makeRequest(`/v1/items/${testItemIds.systemPrompt}`, {
        method: 'PUT',
        body: {
            name: 'Updated Test System Prompt',
            description: 'Updated description',
            visibility: 'private'
        }
    });

    if (result.ok && result.data.success) {
        logSuccess(`Item updated: ${testItemIds.systemPrompt}`);
        return true;
    } else {
        logError(`Failed to update item: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 11: Apply Item (for AnythingLLM integration)
async function testApplyItem() {
    logTest('Apply Item (AnythingLLM Integration)');

    if (!testItemIds.systemPrompt) {
        logWarning('Skipping - no test item to apply');
        return true;
    }

    const importId = `allm-community-id:system-prompt:${testItemIds.systemPrompt}`;
    const result = await makeRequest('/community-hub/apply', {
        method: 'POST',
        body: { importId }
    });

    if (result.ok && result.data.success && result.data.item) {
        logSuccess(`Item applied successfully: ${result.data.item.name}`);
        return true;
    } else {
        logError(`Failed to apply item: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 12: Get Settings
async function testGetSettings() {
    logTest('Get User Settings');
    const result = await makeRequest('/community-hub/settings');

    if (result.ok && result.data.success) {
        logSuccess('Settings retrieved successfully');
        return true;
    } else {
        logError(`Failed to get settings: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 13: Update Settings
async function testUpdateSettings() {
    logTest('Update User Settings');
    const result = await makeRequest('/community-hub/settings', {
        method: 'POST',
        body: {
            connectionKey: authToken, // The endpoint requires connectionKey in body
            username: 'testuser',
            bio: 'Test user bio'
        }
    });

    if (result.ok && result.data.success) {
        logSuccess('Settings updated successfully');
        return true;
    } else {
        logError(`Failed to update settings: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 14: Delete Item
async function testDeleteItem() {
    logTest('Delete Item');

    if (!testItemIds.systemPrompt) {
        logWarning('Skipping - no test item to delete');
        return true;
    }

    const result = await makeRequest(`/v1/items/${testItemIds.systemPrompt}`, {
        method: 'DELETE'
    });

    if (result.ok && result.data.success) {
        logSuccess(`Item deleted: ${testItemIds.systemPrompt}`);
        return true;
    } else {
        logError(`Failed to delete item: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Test 15: Firebase Path Compatibility
async function testFirebasePaths() {
    logTest('Firebase Cloud Functions Path Compatibility');

    const firebasePath = '/anythingllm-hub/us-central1/external/v1/explore';
    const result = await makeRequest(firebasePath, { skipAuth: true });

    if (result.ok && result.data && typeof result.data === 'object') {
        logSuccess('Firebase path compatibility working');
        return true;
    } else {
        logError(`Firebase path failed: ${JSON.stringify(result.data)}`);
        return false;
    }
}

// Main Test Runner
async function runAllTests() {
    console.log('\n');
    log('═══════════════════════════════════════════════════════', 'cyan');
    log('         COMMUNITY HUB COMPREHENSIVE TEST SUITE        ', 'cyan');
    log('═══════════════════════════════════════════════════════', 'cyan');
    console.log('\n');

    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Login', fn: testLogin },
        { name: 'Get Profile', fn: testGetProfile },
        { name: 'Explore Items', fn: testExploreItems },
        { name: 'Create System Prompt', fn: testCreateSystemPrompt },
        { name: 'Create Slash Command', fn: testCreateSlashCommand },
        { name: 'Create Agent Flow', fn: testCreateAgentFlow },
        { name: 'Get User Items', fn: testGetUserItems },
        { name: 'Get Item by Import ID', fn: testGetItemByImportId },
        { name: 'Update Item', fn: testUpdateItem },
        { name: 'Apply Item', fn: testApplyItem },
        { name: 'Get Settings', fn: testGetSettings },
        { name: 'Update Settings', fn: testUpdateSettings },
        { name: 'Delete Item', fn: testDeleteItem },
        { name: 'Firebase Path Compatibility', fn: testFirebasePaths }
    ];

    const results = [];

    for (const test of tests) {
        try {
            const passed = await test.fn();
            results.push({ name: test.name, passed });
        } catch (error) {
            logError(`Test crashed: ${error.message}`);
            results.push({ name: test.name, passed: false });
        }
    }

    // Print summary
    console.log('\n');
    log('═══════════════════════════════════════════════════════', 'cyan');
    log('                     TEST SUMMARY                      ', 'cyan');
    log('═══════════════════════════════════════════════════════', 'cyan');
    console.log('\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(result => {
        if (result.passed) {
            logSuccess(`${result.name.padEnd(40)} PASSED`);
        } else {
            logError(`${result.name.padEnd(40)} FAILED`);
        }
    });

    console.log('\n');
    log(`Total Tests: ${results.length}`, 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    console.log('\n');

    if (failed === 0) {
        log('═══════════════════════════════════════════════════════', 'green');
        log('         ✓ ALL TESTS PASSED SUCCESSFULLY! ✓           ', 'green');
        log('═══════════════════════════════════════════════════════', 'green');
    } else {
        log('═══════════════════════════════════════════════════════', 'red');
        log('              ✗ SOME TESTS FAILED ✗                   ', 'red');
        log('═══════════════════════════════════════════════════════', 'red');
    }
    console.log('\n');

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});