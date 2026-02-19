const { loadEnvVars } = require('./db-config');

const env = loadEnvVars();

console.log('Environment variables loaded:');
console.log('DATABASE_URL:', env.DATABASE_URL ? 'Found' : 'NOT FOUND');
console.log('NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'NOT FOUND');
console.log('SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'NOT FOUND');

console.log('\nAll keys:', Object.keys(env));

