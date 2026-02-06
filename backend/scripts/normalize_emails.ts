import { prisma } from '../utils/prismaClient.js';

async function normalize() {
  console.log('Starting email normalization...');

  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  // map lowercased email -> users
  const map = new Map<string, { id: string; email: string }[]>();
  for (const u of users) {
    const key = u.email.trim().toLowerCase();
    const arr = map.get(key) ?? [];
    arr.push(u);
    map.set(key, arr);
  }

  // check for conflicts
  const conflicts = Array.from(map.entries()).filter(([, arr]) => arr.length > 1);
  if (conflicts.length > 0) {
    console.error('Found email normalize conflicts. Resolve duplicates before running the script.');
    for (const [email, arr] of conflicts) {
      console.error(`- normalized ${email} would collide for user ids: ${arr.map((a) => a.id).join(', ')}`);
    }
    process.exit(1);
  }

  // perform updates
  let updated = 0;
  for (const [email, arr] of map.entries()) {
    const u = arr[0];
    if (u.email !== email) {
      await prisma.user.update({ where: { id: u.id }, data: { email } });
      updated++;
    }
  }

  console.log(`Finished. Updated ${updated} users.`);
  process.exit(0);
}

normalize().catch((err) => {
  console.error('Normalization failed', err);
  process.exit(2);
});