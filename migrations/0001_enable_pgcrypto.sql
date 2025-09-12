-- Migration: Enable pgcrypto extension
-- This extension is required for gen_random_uuid() function used in the database schema

-- Enable pgcrypto extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is available by testing the function
SELECT gen_random_uuid() AS test_uuid;