
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  console.error(
    'POSTGRES_URL environment variable is not set. Database operations will fail. ' +
    'Please check your .env file and ensure your PostgreSQL server is running and accessible.'
  );
  console.warn(
    "IMPORTANT: This update introduces a new database schema. If you have existing tables from the previous schema, " +
    "they will NOT be automatically migrated. You will need to manually DROP old tables (users, courses, images, user_courses, user_sessions with old schema) " +
    "for the new schema to be created correctly."
  );
}

const sql = process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL) : (()=>{
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally' || typeof prop === 'symbol') {
        return undefined;
      }
      throw new Error(
        'Database connection failed: POSTGRES_URL environment variable is not set or is invalid. ' +
        'Please check your .env file and ensure your PostgreSQL server is running and accessible.'
      );
    }
  }) as postgres.Sql;
})();

/**
 * Ensures that all necessary database tables exist, creating them if they don't.
 * This function is typically called once during application startup.
 * @param dbClient - The PostgreSQL client instance.
 */
async function ensureTablesExist(dbClient: postgres.Sql) {
  try {
    // Users Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor')),
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Courses Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          thumbnail_url TEXT,
          due_date DATE,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Enrollments Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS enrollments (
          id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          marked_completed BOOLEAN DEFAULT FALSE,
          enrolled_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(student_id, course_id)
      );
    `;

    // Course Progress Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS course_progress (
          id SERIAL PRIMARY KEY,
          enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
          progress_percent NUMERIC(5,2) DEFAULT 0.0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(enrollment_id)
      );
    `;

    // Chat Sessions Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS chat_sessions (
          id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          started_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Chat Messages Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
          sender VARCHAR(20) NOT NULL CHECK (sender IN ('student', 'bot')),
          message TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Notifications Table
    await dbClient`
      CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          seen BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // User Sessions Table (NEW SCHEMA)
    await dbClient`
      CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
    await dbClient`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);`;

  } catch (error: any) {
    console.error('Error during table existence check or creation:', error.message);
    console.warn(
        "An error occurred during database setup. This update introduces a new database schema. " +
        "If you have existing tables from the previous schema (e.g., with different column structures or user_sessions table with old schema), " +
        "they will NOT be automatically migrated. " +
        "You may need to manually DROP these old tables from your database for them to be recreated correctly with the new schema."
      );
  }
}

if (process.env.POSTGRES_URL) {
  (async () => {
    try {
      await sql`SELECT 1`; // Test connection
      await ensureTablesExist(sql);
    } catch (err: any) {
      console.error(
        "Failed to connect to the database for initial table check/creation. " +
        "Ensure the database is accessible and the connection string is correct.",
        err.message
      );
       console.warn(
        "IMPORTANT: This update introduces a new database schema. If you have existing tables from the previous schema, " +
        "they will NOT be automatically migrated. You will need to manually DROP old tables for the new schema to be created correctly."
      );
    }
  })();
}

export default sql;
