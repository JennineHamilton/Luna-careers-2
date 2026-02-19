/**
 * Test Together.AI API Connection
 * Run with: node scripts/test-together-ai.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    }
  });

  return env;
}

async function testTogetherAI() {
  const env = loadEnv();
  const apiKey = env.TOGETHER_AI_API_KEY;
  const model = env.TOGETHER_AI_MODEL;

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  console.log('🤖 Model:', model);
  console.log('\n📝 Generating typing test passage...\n');

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates typing test passages. Only respond with the passage text, no additional commentary.'
          },
          {
            role: 'user',
            content: `Generate a simple typing test passage with exactly 60-80 words.
Use common, everyday English words that anyone can understand.
Write short, clear sentences about relatable topics like work, communication, or daily activities.
Avoid technical terms, jargon, or complex vocabulary.
Use proper grammar and punctuation.
Make it engaging but easy to read.
Only output the passage text, nothing else.`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const passage = data.choices[0].message.content.trim();
    const wordCount = passage.split(/\s+/).length;

    console.log('✅ SUCCESS! Generated passage:\n');
    console.log('─'.repeat(60));
    console.log(passage);
    console.log('─'.repeat(60));
    console.log(`\n📊 Word count: ${wordCount} words`);
    console.log(`📏 Character count: ${passage.length} characters`);
    console.log('\n✨ Together.AI is working correctly!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your API key in .env.local');
    console.error('   2. Verify your Together.AI account has credits');
    console.error('   3. Check your internet connection\n');
    process.exit(1);
  }
}

testTogetherAI();

