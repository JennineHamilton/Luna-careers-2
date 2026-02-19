/**
 * Generate TypeScript types from extracted schema data
 * Converts schema-data.json into Supabase-compatible TypeScript types
 */

const fs = require('fs');
const path = require('path');

// Map PostgreSQL types to TypeScript types
const typeMap = {
  'uuid': 'string',
  'text': 'string',
  'character varying': 'string',
  'varchar': 'string',
  'integer': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'boolean': 'boolean',
  'jsonb': 'Json',
  'json': 'Json',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'timestamptz': 'string',
  'date': 'string',
  'time': 'string',
  'inet': 'string',
  'USER-DEFINED': 'enum', // Will be replaced with actual enum name
};

function mapPostgresType(dataType, udtName, enumsMap) {
  if (dataType === 'USER-DEFINED' && enumsMap[udtName]) {
    return `Database['public']['Enums']['${udtName}']`;
  }
  return typeMap[dataType] || 'unknown';
}

function generateTypes() {
  const schemaPath = path.join(__dirname, '..', 'types', 'schema-data.json');
  const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  console.log('🔧 Generating TypeScript types from schema data...\n');

  // Create enums map
  const enumsMap = {};
  schemaData.enums.forEach(e => {
    enumsMap[e.enum_name] = e.enum_values;
  });

  // Group columns by table
  const tableColumns = {};
  schemaData.columns.forEach(col => {
    if (!tableColumns[col.table_name]) {
      tableColumns[col.table_name] = [];
    }
    tableColumns[col.table_name].push(col);
  });

  // Group relationships by table
  const tableRelationships = {};
  schemaData.relationships.forEach(rel => {
    if (!tableRelationships[rel.table_name]) {
      tableRelationships[rel.table_name] = [];
    }
    tableRelationships[rel.table_name].push(rel);
  });

  // Start building the TypeScript file
  let output = `/**
 * Auto-generated TypeScript types from Supabase database schema
 * Generated on: ${new Date().toISOString()}
 * DO NOT EDIT MANUALLY - Regenerate using: node scripts/generate-typescript-types.js
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

  // Generate table types
  schemaData.tables.forEach(table => {
    const tableName = table.table_name;
    const columns = tableColumns[tableName] || [];
    const relationships = tableRelationships[tableName] || [];

    output += `      ${tableName}: {\n`;
    output += `        Row: {\n`;

    // Row type (all columns)
    columns.forEach(col => {
      const tsType = mapPostgresType(col.data_type, col.udt_name, enumsMap);
      const nullable = col.is_nullable === 'YES' ? ' | null' : '';
      output += `          ${col.column_name}: ${tsType}${nullable}\n`;
    });

    output += `        }\n`;
    output += `        Insert: {\n`;

    // Insert type (optional columns with defaults)
    columns.forEach(col => {
      const tsType = mapPostgresType(col.data_type, col.udt_name, enumsMap);
      const hasDefault = col.column_default !== null;
      const nullable = col.is_nullable === 'YES' ? ' | null' : '';
      const optional = hasDefault || col.is_nullable === 'YES' ? '?' : '';
      output += `          ${col.column_name}${optional}: ${tsType}${nullable}\n`;
    });

    output += `        }\n`;
    output += `        Update: {\n`;

    // Update type (all optional except id)
    columns.forEach(col => {
      if (col.column_name !== 'id') {
        const tsType = mapPostgresType(col.data_type, col.udt_name, enumsMap);
        const nullable = col.is_nullable === 'YES' ? ' | null' : '';
        output += `          ${col.column_name}?: ${tsType}${nullable}\n`;
      }
    });

    output += `        }\n`;

    // Relationships
    if (relationships.length > 0) {
      output += `        Relationships: [\n`;
      relationships.forEach(rel => {
        output += `          {\n`;
        output += `            foreignKeyName: '${rel.constraint_name}'\n`;
        output += `            columns: ['${rel.column_name}']\n`;
        output += `            isOneToOne: false\n`;
        output += `            referencedRelation: '${rel.foreign_table_name}'\n`;
        output += `            referencedColumns: ['${rel.foreign_column_name}']\n`;
        output += `          },\n`;
      });
      output += `        ]\n`;
    } else {
      output += `        Relationships: []\n`;
    }

    output += `      }\n`;
  });

  output += `    }\n`;

  console.log('✅ Generated table types');

  // Generate Views
  output += `    Views: {\n`;

  schemaData.views.forEach(view => {
    const viewName = view.table_name;
    const columns = tableColumns[viewName] || [];

    output += `      ${viewName}: {\n`;
    output += `        Row: {\n`;

    columns.forEach(col => {
      const tsType = mapPostgresType(col.data_type, col.udt_name, enumsMap);
      const nullable = col.is_nullable === 'YES' ? ' | null' : '';
      output += `          ${col.column_name}: ${tsType}${nullable}\n`;
    });

    output += `        }\n`;
    output += `        Relationships: []\n`;
    output += `      }\n`;
  });

  output += `    }\n`;
  console.log('✅ Generated view types');

  // Generate Functions
  output += `    Functions: {\n`;

  schemaData.functions.forEach(func => {
    output += `      ${func.function_name}: {\n`;
    output += `        Args: Record<string, never>\n`;
    output += `        Returns: unknown\n`;
    output += `      }\n`;
  });

  output += `    }\n`;
  console.log('✅ Generated function types');

  // Generate Enums
  output += `    Enums: {\n`;

  schemaData.enums.forEach(enumDef => {
    // Parse PostgreSQL array format: {value1,value2,value3}
    let enumValues = enumDef.enum_values;
    if (typeof enumValues === 'string') {
      // Remove curly braces and split by comma
      enumValues = enumValues.replace(/[{}]/g, '').split(',');
    }
    const values = enumValues.map(v => `'${v}'`).join(' | ');
    output += `      ${enumDef.enum_name}: ${values}\n`;
  });

  output += `    }\n`;
  console.log('✅ Generated enum types');

  // Close the Database interface
  output += `    CompositeTypes: {\n`;
  output += `      [_ in never]: never\n`;
  output += `    }\n`;
  output += `  }\n`;
  output += `}\n`;

  // Write to file
  const outputPath = path.join(__dirname, '..', 'types', 'database.types.ts');
  fs.writeFileSync(outputPath, output);

  console.log(`\n💾 TypeScript types saved to: ${outputPath}`);
  console.log('\n✅ Type generation complete!');
  console.log('\nNext steps:');
  console.log('1. Remove all "as any" assertions from Supabase queries');
  console.log('2. Run npm run build to verify types work correctly');
  console.log('3. Compare with backup: types/database.types.ts.bak');
}

generateTypes();

