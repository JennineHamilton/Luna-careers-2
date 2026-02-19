/**
 * Database Configuration Utility
 * Loads database credentials from environment variables
 * 
 * Usage:
 *   const { getDbClient, getConnectionString } = require('./db-config');
 *   const client = getDbClient();
 */

const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env.local
 */
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.error('   Please copy .env.example to .env.local and fill in your credentials.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  // Split by both Unix (\n) and Windows (\r\n) line endings
  const lines = envContent.split(/\r?\n/);

  lines.forEach(line => {
    // Remove any remaining carriage returns
    line = line.replace(/\r/g, '');

    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }
  });

  return envVars;
}

/**
 * Get database connection string from environment
 */
function getConnectionString() {
  const env = loadEnvVars();
  
  const connectionString = env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.error('   Please add DATABASE_URL to your .env.local file.');
    console.error('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres');
    process.exit(1);
  }

  return connectionString;
}

/**
 * Get configured PostgreSQL client
 */
function getDbClient() {
  const { Client } = require('pg');
  const connectionString = getConnectionString();

  return new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Get Supabase credentials
 */
function getSupabaseConfig() {
  const env = loadEnvVars();
  
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.error('❌ Supabase credentials not found in .env.local');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  return { url, serviceKey };
}

module.exports = {
  getConnectionString,
  getDbClient,
  getSupabaseConfig,
  loadEnvVars
};

