-- Add cooking_at column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cooking_at BIGINT;
