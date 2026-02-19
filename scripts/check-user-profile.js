/**
 * Check user profile data in database
 * Run with: node scripts/check-user-profile.js <user_email>
 */

const { getDbClient } = require('./db-config');

async function checkUserProfile() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('❌ Please provide a user email');
    console.error('Usage: node scripts/check-user-profile.js user@example.com');
    process.exit(1);
  }

  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Query user data
    const result = await client.query(
      `SELECT 
        id,
        email,
        first_name,
        last_name,
        profession,
        phone,
        bio,
        city,
        state,
        country,
        location,
        avatar_url,
        linkedin_url,
        portfolio_url,
        account_type,
        user_role,
        created_at
      FROM public.users 
      WHERE email = $1`,
      [userEmail]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No user found with email: ${userEmail}`);
      return;
    }

    const user = result.rows[0];
    console.log('=== USER PROFILE DATA ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.first_name, user.last_name);
    console.log('Profession:', user.profession || '(null)');
    console.log('Phone:', user.phone || '(null)');
    console.log('Bio:', user.bio || '(null)');
    console.log('City:', user.city || '(null)');
    console.log('State:', user.state || '(null)');
    console.log('Country:', user.country || '(null)');
    console.log('Location (old field):', user.location || '(null)');
    console.log('Avatar URL:', user.avatar_url || '(null)');
    console.log('LinkedIn:', user.linkedin_url || '(null)');
    console.log('Portfolio:', user.portfolio_url || '(null)');
    console.log('Account Type:', user.account_type);
    console.log('User Role:', user.user_role);
    console.log('Created:', user.created_at);
    console.log('========================\n');

    // Check if any profile fields are filled
    const hasData = user.profession || user.phone || user.bio || 
                    user.city || user.state || user.country;
    
    if (hasData) {
      console.log('✅ User has profile data');
    } else {
      console.log('⚠️  User profile fields are empty');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserProfile();

