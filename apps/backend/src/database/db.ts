const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Please check apps/backend/.env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query("SELECT 1");
}