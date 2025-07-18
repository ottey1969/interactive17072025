import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pg = require('pg');
const { Pool } = pg;

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

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

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
