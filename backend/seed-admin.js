require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 6) {
    console.log('Usage: node seed-admin.js <email> <password (min 6)>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB:', mongoose.connection.name);
  const users = mongoose.connection.collection('users');
  console.log('Existing users:', await users.countDocuments());
  const hash = await bcrypt.hash(password, 10);
  const r = await users.updateOne(
    { email },
    {
      $set: { password: hash, role: 'admin', updatedAt: new Date() },
      $setOnInsert: { name: 'Admin User', email, createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(r.upsertedCount ? 'Admin created.' : 'Admin password updated.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
