-- Add project settings (theme, locales, basePath) to the projects table.
-- Stored as JSON so the canonical project's `settings` object round-trips.

ALTER TABLE projects ADD COLUMN settings TEXT;
