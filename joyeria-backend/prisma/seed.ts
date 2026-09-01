import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    throw new Error('Definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en tu .env antes de correr el seed');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Usuario admin creado/existente: ${user.email}`);

  const rootCategories = [
    { name: 'Joyería', slug: 'joyeria' },
    { name: 'Marroquinería', slug: 'marroquineria' },
    { name: 'Mates', slug: 'mates' },
    { name: 'Trabajos personalizados', slug: 'trabajos-personalizados' },
  ];

    const whatsappNumber = process.env.SEED_WHATSAPP_NUMBER;
  const storeName = process.env.SEED_STORE_NAME ?? 'Joyería Petrucci';

  if (!whatsappNumber) {
    throw new Error('Definí SEED_WHATSAPP_NUMBER en tu .env antes de correr el seed (formato: 5493407123456)');
  }

  await prisma.storeConfig.upsert({
    where: { tenantId: 'default' },
    update: {},
    create: {
      tenantId: 'default',
      storeName,
      whatsappNumber,
    },
  });

  console.log(`✅ Configuración de tienda creada/existente: ${storeName}`);

for (const [index, cat] of rootCategories.entries()) {
  await prisma.category.upsert({
    where: {
      tenantId_slug: {
        tenantId: 'default',
        slug: cat.slug,
      },
    },
    update: {},
    create: {
      name: cat.name,
      slug: cat.slug,
      tenantId: 'default',
      isProtected: true,
      isActive: true,
      sortOrder: index,
    },
  });
}

  console.log(`✅ Categorías raíz creadas/existentes: ${rootCategories.map(c => c.name).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });