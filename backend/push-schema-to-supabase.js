import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection parameters
// Using IPv6 address directly since Node.js DNS resolution is having issues
const connectionConfig = {
  host: '2406:da1a:6b0:f602:84a2:cacf:7863:e3ad', // IPv6 address from nslookup
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Rasmalai9819',
  ssl: {
    rejectUnauthorized: false // Supabase requires SSL but we don't verify the certificate
  }
};

async function pushSchema() {
  console.log('🔗 Connecting to:', connectionConfig.host + ':' + connectionConfig.port);
  
  const client = new Client(connectionConfig);

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    // Read the SQL schema file
    const schemaPath = join(__dirname, 'complete_schema.sql');
    console.log(`📖 Reading schema file: ${schemaPath}`);
    const sql = readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Execute the SQL
    console.log('🚀 Executing schema...');
    await client.query(sql);
    console.log('✅ Schema successfully pushed to Supabase!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify User table columns
    console.log('\n🔍 Verifying User table structure...');
    const userColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 User table columns:');
    userColumnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n✅ Database schema verification complete!');

  } catch (error) {
    console.error('❌ Error pushing schema:', error.message);
    if (error.code === '42P07') {
      console.log('\n⚠️  Some tables already exist. This is normal if you run the script multiple times.');
      console.log('   The schema uses IF NOT EXISTS clauses, so it should be safe to re-run.');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

pushSchema();

