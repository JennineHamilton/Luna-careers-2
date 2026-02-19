/**
 * Query SCORM bucket size limit
 */

const { getDbClient } = require('./db-config');

async function queryBucketSize() {
  const client = getDbClient();

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    const result = await client.query(`
      SELECT 
        id,
        name,
        file_size_limit as size_bytes,
        ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb,
        ROUND(file_size_limit / 1024.0 / 1024.0 / 1024.0, 2) as size_gb
      FROM storage.buckets
      WHERE id = 'scorm-packages';
    `);

    if (result.rows.length === 0) {
      console.log('❌ SCORM bucket not found');
      return;
    }

    const bucket = result.rows[0];
    console.log('Bucket ID:', bucket.id);
    console.log('Bucket Name:', bucket.name);
    console.log('Size Limit (bytes):', bucket.size_bytes);
    console.log('Size Limit (MB):', bucket.size_mb);
    console.log('Size Limit (GB):', bucket.size_gb);

    const expectedSize = 10737418240; // 10GB
    if (parseInt(bucket.size_bytes) === expectedSize) {
      console.log('\n✅ Bucket is correctly set to 10GB');
    } else {
      console.log('\n❌ Bucket is NOT set to 10GB');
      console.log('Expected:', expectedSize, 'bytes (10GB)');
      console.log('Actual:', bucket.size_bytes, 'bytes');
    }

  } catch (error) {
    console.error('Query failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

queryBucketSize()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Query failed');
    process.exit(1);
  });

