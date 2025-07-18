# Render Shell Commands to Fix Database

## What to do in Render Shell:

Since `npm run db:push` failed because drizzle-kit is missing, try these commands in order:

### Command 1: Install drizzle-kit and run push
```bash
npm install drizzle-kit --save-dev && npm run db:push
```

### Command 2: If that fails, install missing dependencies
```bash
npm install --include=dev && npm run db:push
```

### Command 3: Alternative - Direct SQL execution
```bash
npx tsx -e "
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

await db.execute(sql\`
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  unlimited_credits BOOLEAN DEFAULT false,
  grant_writing_access BOOLEAN DEFAULT false,
  monthly_questions_used INTEGER DEFAULT 0,
  current_month VARCHAR,
  total_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);\`);

console.log('Database initialized successfully!');
process.exit(0);
"
```

## Expected Result:
After running any of these successfully:
- Database tables will be created
- Registration will work
- You can create accounts and login

Try Command 1 first, then Command 2 if it fails.