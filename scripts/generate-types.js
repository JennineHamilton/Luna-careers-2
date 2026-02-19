/**
 * Generate TypeScript types from Supabase database schema
 * Uses direct PostgreSQL connection to introspect the database
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function generateTypes() {
  const client = getDbClient();
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Get all tables in public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📋 Found tables:', tablesResult.rows.map(r => r.table_name).join(', '));

    // Get all columns for each table
    const columnsResult = await client.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.udt_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `);

    // Get all enums
    const enumsResult = await client.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    console.log('\n🏷️  Found enums:', enumsResult.rows.map(r => r.enum_name).join(', '));

    // Get foreign key relationships
    const relationshipsResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    // Get views
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n👁️  Found views:', viewsResult.rows.map(r => r.table_name).join(', '));

    // Get functions
    const functionsResult = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname;
    `);

    console.log('\n⚙️  Found functions:', functionsResult.rows.map(r => r.function_name).join(', '));

    // Save raw schema data
    const schemaData = {
      tables: tablesResult.rows,
      columns: columnsResult.rows,
      enums: enumsResult.rows,
      relationships: relationshipsResult.rows,
      views: viewsResult.rows,
      functions: functionsResult.rows,
    };

    const outputPath = path.join(__dirname, '..', 'types', 'schema-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(schemaData, null, 2));
    console.log(`\n💾 Schema data saved to: ${outputPath}`);

    console.log('\n✅ Schema extraction complete!');
    console.log('\nNext: Run the type generator to create TypeScript types from this schema data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

generateTypes().catch(console.error);

