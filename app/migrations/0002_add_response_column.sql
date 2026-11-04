-- Migration number: 0002 	 2026-11-04T00:06:56.788Z

ALTER TABLE thoughts ADD COLUMN response TEXT NOT NULL;
