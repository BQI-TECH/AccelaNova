-- Fix workspace user access issue
-- This SQL will add the admin user to the workspace so they can access it

-- First, find your user ID (replace 'geotech' with your actual username)
-- Run this query to find your user ID:
-- SELECT id, username, role FROM users WHERE username = 'geotech';

-- Then, add the user to the workspace_users table
-- Replace USER_ID with the ID from the query above
-- Replace WORKSPACE_ID with the workspace ID (1 in your case based on the screenshot)

-- Example: If your user ID is 1 and workspace ID is 1:
INSERT INTO "workspace_users" ("user_id", "workspace_id", "createdAt", "lastUpdatedAt")
VALUES (1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Or if you want to add ALL users with admin/manager role to ALL workspaces:
-- (This is useful if you're the only admin and want access to everything)
INSERT INTO "workspace_users" ("user_id", "workspace_id", "createdAt", "lastUpdatedAt")
SELECT 
    u.id as user_id,
    w.id as workspace_id,
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "lastUpdatedAt"
FROM users u
CROSS JOIN workspaces w
WHERE u.role IN ('admin', 'manager')
ON CONFLICT DO NOTHING;

-- Verify the relationship was created:
SELECT 
    wu.id,
    u.username,
    u.role,
    w.name as workspace_name,
    w.slug as workspace_slug
FROM workspace_users wu
JOIN users u ON wu.user_id = u.id
JOIN workspaces w ON wu.workspace_id = w.id;






