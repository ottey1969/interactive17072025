import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Dynamically import the 'pg' module to handle its CommonJS nature
// This ensures 'pg' is loaded correctly regardless of build tool transformations
let Pool;

// Use an async IIFE to load Pool before it's used
(async () => {
  const pgModule = await import('pg');
  Pool = pgModule.Pool;
})();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionConfig: any = { 
  connectionString: process.env.DATABASE_URL 
};

// Add SSL configuration for production
if (process.env.NODE_ENV === 'production') {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

// Export the pool and db after Pool is guaranteed to be loaded
export const pool = new Promise<any>(async (resolve) => {
  // Wait for Pool to be loaded
  while (!Pool) {
    await new Promise(res => setTimeout(res, 50)); // Small delay to prevent busy-waiting
  }
  resolve(new Pool(connectionConfig));
});

export const db = new Promise<any>(async (resolve) => {
  const resolvedPool = await pool;
  resolve(drizzle(resolvedPool, { schema }));
});
