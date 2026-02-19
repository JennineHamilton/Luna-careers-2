const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('Reading from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\nFile length:', content.length);
  console.log('First 200 chars:', JSON.stringify(content.substring(0, 200)));
  
  const lines = content.split(/\r?\n/);
  console.log('\nTotal lines:', lines.length);
  console.log('\nFirst 10 lines:');
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`Line ${i}: [${line.length} chars] "${line}"`);
  });
  
  console.log('\nLooking for DATABASE_URL:');
  lines.forEach((line, i) => {
    if (line.includes('DATABASE_URL')) {
      console.log(`Found on line ${i}: "${line}"`);
      console.log('Char codes:', [...line].map(c => c.charCodeAt(0)).join(','));
    }
  });
}

