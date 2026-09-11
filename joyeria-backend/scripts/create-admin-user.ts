import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'webya@joyeriapetrucci.com';
  const rawPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  console.log('--- USUARIOS ACTUALES ---');
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(existingUsers);

  // Crear o actualizar usuario desarrollador (ADMIN)
  const devUser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: 'WebYa (Admin Dev)',
      role: 'ADMIN',
    },
    create: {
      email,
      password: hashedPassword,
      name: 'WebYa (Admin Dev)',
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuario ADMIN CREADO / ACTUALIZADO:');
  console.log({
    id: devUser.id,
    email: devUser.email,
    name: devUser.name,
    role: devUser.role,
  });

  console.log('--- LISTA FINAL DE USUARIOS ---');
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(finalUsers);
}

main()
  .catch((e) => {
    console.error('Error creando usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
