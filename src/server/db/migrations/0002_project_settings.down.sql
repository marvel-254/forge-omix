-- Remove the project settings column added in 0002.

ALTER TABLE projects DROP COLUMN settings;
