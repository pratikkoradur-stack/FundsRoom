import bcrypt from 'bcryptjs';
import { supabase } from './src/supabaseClient';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding default role users into Supabase...');

  const rawPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const initialUsers = [
    {
      name: 'System Admin',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'admin',
    },
    {
      name: 'Sales Manager',
      email: 'sales@company.com',
      password: hashedPassword,
      role: 'sales',
    },
    {
      name: 'Warehouse Supervisor',
      email: 'warehouse@company.com',
      password: hashedPassword,
      role: 'warehouse',
    },
    {
      name: 'Accounts Executive',
      email: 'accounts@company.com',
      password: hashedPassword,
      role: 'accounts',
    },
  ];

  for (const user of initialUsers) {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (existingUser) {
      console.log(`ℹ️ User ${user.email} (${user.role}) already exists. Skipping.`);
      continue;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select();

    if (error) {
      console.error(`❌ Error inserting user ${user.email}:`, error.message);
    } else {
      console.log(`✅ Inserted user ${user.email} [Role: ${user.role}]`);
    }
  }

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
