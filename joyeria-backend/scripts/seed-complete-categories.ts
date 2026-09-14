/**
 * scripts/seed-complete-categories.ts
 *
 * Pobla la base de datos con TODAS las secciones y subrubros detallados del menú y tienda
 * para que Víctor pueda gestionar cada uno en /admin/categorias y asignarlos a los productos.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const TENANT = 'default';

const COMPLETE_CATEGORY_TREE = [
  {
    name: 'Joyería',
    slug: 'joyeria',
    description: 'Piezas artesanales en oro, plata y acero. Anillos, aros, pulseras y más.',
    sortOrder: 0,
    children: [
      { name: 'Anillos', slug: 'anillos', sortOrder: 0 },
      { name: 'Aros', slug: 'aros', sortOrder: 1 },
      { name: 'Dijes y Colgantes', slug: 'dijes', sortOrder: 2 },
      { name: 'Pulseras', slug: 'pulseras', sortOrder: 3 },
      { name: 'Gargantillas', slug: 'gargantillas', sortOrder: 4 },
      { name: 'Pulseras Bebé', slug: 'pulseras-bebe', sortOrder: 5 },
      { name: 'Hombres', slug: 'hombres', sortOrder: 6 },
      { name: 'Despertadores', slug: 'despertadores', sortOrder: 7 },
    ],
  },
  {
    name: 'Relojes',
    slug: 'relojes',
    description: 'Relojes deportivos, clásicos, smartwatches y de alta gama.',
    sortOrder: 1,
    children: [
      { name: 'Casio', slug: 'casio', sortOrder: 0 },
      { name: 'Catterpillar', slug: 'catterpillar', sortOrder: 1 },
      { name: 'Seiko', slug: 'seiko', sortOrder: 2 },
      { name: 'Orient', slug: 'orient', sortOrder: 3 },
      { name: 'Citizen', slug: 'citizen', sortOrder: 4 },
      { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', sortOrder: 5 },
      { name: 'Tressa', slug: 'tressa', sortOrder: 6 },
      { name: 'Smarts', slug: 'smarts', sortOrder: 7 },
      { name: 'Nockout', slug: 'nockout', sortOrder: 8 },
    ],
  },
  {
    name: 'Trabajos Personalizados',
    slug: 'trabajos-personalizados',
    description: 'Diseños exclusivos a medida, grabados láser y alianzas.',
    sortOrder: 2,
    children: [
      { name: 'Diseños Exclusivos', slug: 'disenos-exclusivos', sortOrder: 0 },
      { name: 'Grabados Personalizados', slug: 'grabados-personalizados', sortOrder: 1 },
      { name: 'Alianzas a Medida', slug: 'alianzas-a-medida', sortOrder: 2 },
    ],
  },
  {
    name: 'Marroquinería',
    slug: 'marroquineria',
    description: 'Billeteras, cinturones y accesorios de cuero legítimo.',
    sortOrder: 3,
    children: [
      { name: 'Billeteras', slug: 'billeteras', sortOrder: 0 },
      { name: 'Cinturones', slug: 'cinturones', sortOrder: 1 },
      { name: 'Accesorios de Cuero', slug: 'accesorios-cuero', sortOrder: 2 },
    ],
  },
  {
    name: 'Mates',
    slug: 'mates',
    description: 'Mates artesanales, bombillas y accesorios.',
    sortOrder: 4,
    children: [
      { name: 'Mates Artesanales', slug: 'mates-artesanales', sortOrder: 0 },
      { name: 'Mates Negros', slug: 'mates-negros', sortOrder: 1 },
      { name: 'Bombillas', slug: 'bombillas', sortOrder: 2 },
      { name: 'Accesorios Materos', slug: 'accesorios-materos', sortOrder: 3 },
    ],
  },
];

async function main() {
  console.log('🚀 Cargando todas las categorías y subrubros completos en la base de datos...\n');

  for (const rootDef of COMPLETE_CATEGORY_TREE) {
    const root = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: TENANT, slug: rootDef.slug } },
      update: {
        name: rootDef.name,
        description: rootDef.description,
        sortOrder: rootDef.sortOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        tenantId: TENANT,
        name: rootDef.name,
        slug: rootDef.slug,
        description: rootDef.description,
        sortOrder: rootDef.sortOrder,
        isActive: true,
      },
    });

    console.log(`📁 Sección Principal: ${root.name} (${root.slug})`);

    for (const childDef of rootDef.children) {
      const child = await prisma.category.upsert({
        where: { tenantId_slug: { tenantId: TENANT, slug: childDef.slug } },
        update: {
          name: childDef.name,
          parentId: root.id,
          sortOrder: childDef.sortOrder,
          isActive: true,
        },
        create: {
          tenantId: TENANT,
          name: childDef.name,
          slug: childDef.slug,
          parentId: root.id,
          sortOrder: childDef.sortOrder,
          isActive: true,
        },
      });
      console.log(`   └─ ${child.name} (${child.slug})`);
    }
  }

  console.log('\n✨ Todas las secciones y subrubros están cargados en la base de datos.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
