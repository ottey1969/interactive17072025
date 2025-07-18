// Production configuration for deployment platforms
export const config = {
  port: process.env.PORT || 10000,
  host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-development-only',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.RENDER_EXTERNAL_URL || true
      : 'http://localhost:5173'
  }
};