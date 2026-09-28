import { pool } from "../database/db";
import { initializeDatabaseSchema } from "../database/schema";

export async function prepareTestDatabase(): Promise<void> {
  await initializeDatabaseSchema();

  await pool.query("DELETE FROM appointments");
  await pool.query("DELETE FROM rooms");
}

export async function closeTestDatabase(): Promise<void> {
  await pool.end();
}