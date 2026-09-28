import { pool } from "./db";

export async function initializeDatabaseSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK (capacity > 0),
      equipment TEXT[] NOT NULL DEFAULT '{}',
      status TEXT NOT NULL CHECK (status IN ('available', 'occupied')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      participants TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CHECK (end_time > start_time)
    );
  `);
}