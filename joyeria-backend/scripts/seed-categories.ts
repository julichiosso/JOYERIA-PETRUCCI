/**
 * scripts/seed-categories.ts
 *
 * Pobla la base de datos con la estructura de categorías del menú de navegación.
 * Es idempotente: usa upsert por slug, así que puede correrse múltiples veces sin duplicar datos.
 *
 * CÓMO CORRER:
 *   cd joyeria-backend
 *   npx tsx scripts/seed-categories.ts
 *
 * Lo que hace:
 *  1. Crea/actualiza las categorías raíz (Joyería, Relojes, Personalizados, Marroquinería, Mates)
 *  2. Crea/actualiza sus subcategorías
 *  3. Desactiva (NO elimina) categorías raíz huérfanas que no deberían ser root (ej. "Aros" suelto)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Estructura del menú ────────────────────────────────────────────────────────
const CATEGORY_TREE = [
  {
    name: 'Joyería',
    slug: 'joyeria',
    description: 'Anillos, aros, pulseras, gargantillas y piezas artesanales en oro y plata.',
    sortOrder: 0,
    children: [
      { name: 'Anillos', slug: 'anillos', sortOrder: 0 },
      { name: 'Aros', slug: 'aros', sortOrder: 1 },
      { name: 'Cadenas y Gargantillas', slug: 'gargantillas', sortOrder: 2 },
      { name: 'Dijes y Colgantes', slug: 'dijes', sortOrder: 3 },
      { name: 'Pulseras', slug: 'pulseras', sortOrder: 4 },
      { name: 'Pulseras Bebé', slug: 'pulseras-bebe', sortOrder: 5 },
    ],
  },
  {
    name: 'Relojes',
    slug: 'relojes',
    description: 'Relojes de alta gama, deportivos, clásicos y de moda.',
    sortOrder: 1,
    children: [
      { name: 'Casio & Catterpillar', slug: 'casio-catterpillar', sortOrder: 0 },
      { name: 'Seiko & Orient', slug: 'seiko-orient', sortOrder: 1 },
      { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', sortOrder: 2 },
      { name: 'Tressa & Smarts', slug: 'tressa-smarts', sortOrder: 3 },
    ],
  },
  {
    name: 'Trabajos Personalizados',
    slug: 'trabajos-personalizados',
    description: 'Diseños exclusivos a medida. Grabados, alianzas únicas y piezas personalizadas.',
    sortOrder: 2,
    children: [],
  },
  {
    name: 'Marroquinería',
    slug: 'marroquineria',
    description: 'Accesorios de cuero y marroquinería.',
    sortOrder: 3,
    children: [],
  },
  {
    name: 'Mates',
    slug: 'mates',
    description: 'Mates artesanales y accesorios.',
    sortOrder: 4,
    children: [],
  },
];

// Slugs que NO deben existir como categorías raíz (ya están como hijos de otra)
// Si existen como root, los desactivamos para que no aparezcan en el menú.
const SLUG_ROOTS_TO_DEACTIVATE = ['aros-2', 'cadenas', 'anillos-2'];

async function upsertCategory(
  data: { name: string; slug: string; description?: string; sortOrder: number },
  parentId?: string
) {
  const TENANT = 'default';

  return prisma.category.upsert({
    where: {
      tenantId_slug: { tenantId: TENANT, slug: data.slug },
    },
    update: {
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder,
      isActive: true,
      ...(parentId !== undefined ? { parentId } : {}),
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      sortOrder: data.sortOrder,
      isActive: true,
      tenantId: TENANT,
      ...(parentId ? { parentId } : {}),
    },
  });
}

async function main() {
  console.log('🌱 Seeding categorías del menú...\n');

  // ── 1. Crear/actualizar las categorías raíz y sus hijos ──
  for (const rootDef of CATEGORY_TREE) {
    const root = await upsertCategory({
      name: rootDef.name,
      slug: rootDef.slug,
      description: rootDef.description,
      sortOrder: rootDef.sortOrder,
    });
    console.log(`✅ Raíz: ${root.name} (${root.slug})`);

    const validChildSlugs = new Set(rootDef.children.map(c => c.slug));

    for (const childDef of rootDef.children) {
      const child = await upsertCategory(
        { name: childDef.name, slug: childDef.slug, sortOrder: childDef.sortOrder },
        root.id
      );
      console.log(`   └─ ${child.name} (${child.slug})`);
    }

    // Desactivar subcategorías huérfanas o duplicadas que no estén en la lista oficial (excepto si son personalizadas con productos)
    // Para Joyería y Relojes, nos aseguramos que solo estén activas las subcategorías oficiales
    if (rootDef.children.length > 0) {
      const currentChildren = await prisma.category.findMany({
        where: { parentId: root.id },
      });
      for (const child of currentChildren) {
        if (!validChildSlugs.has(child.slug) && child.isActive) {
          await prisma.category.update({
            where: { id: child.id },
            data: { isActive: false },
          });
          console.log(`   ⚠️ Desactivada subcategoría antigua/duplicada: "${child.name}" (${child.slug})`);
        }
      }
    }
  }

  // ── 2. Desactivar slugs raíz duplicados/huérfanos ──
  console.log('\n🔍 Buscando categorías raíz a desactivar...');
  const allRoots = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, slug: true, name: true, isActive: true },
  });

  const validRootSlugs = new Set(CATEGORY_TREE.map((c) => c.slug));

  for (const root of allRoots) {
    if (!validRootSlugs.has(root.slug) && root.isActive) {
      await prisma.category.update({
        where: { id: root.id },
        data: { isActive: false },
      });
      console.log(`⚠️  Desactivada categoría raíz huérfana: "${root.name}" (${root.slug})`);
    }
  }

  // ── 3. Resumen ──
  console.log('\n📋 Estado final de categorías raíz activas:');
  const finalRoots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });

  for (const root of finalRoots) {
    console.log(`  ${root.name} → ${root.children.length > 0 ? root.children.map(c => c.name).join(', ') : '(sin subrubros)'}`);
  }

  console.log('\n✨ Listo. Recargá la tienda y el menú debería verse completo.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
