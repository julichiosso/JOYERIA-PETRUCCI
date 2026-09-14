/**
 * scripts/clean-and-sync-db.ts
 *
 * Limpia y sincroniza las categorías en la base de datos:
 * 1. Migra productos de categorías duplicadas a las categorías oficiales.
 * 2. Elimina o desactiva categorías duplicadas/antiguas.
 * 3. Deja exactamente las secciones y subrubros oficiales limpios en la base de datos.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const TENANT = 'default';

async function main() {
  console.log('🔄 Sincronizando y limpiando categorías en la base de datos...\n');

  // 1. Asegurar categorías raíz oficiales
  const roots = [
    { name: 'Joyería', slug: 'joyeria', sortOrder: 0 },
    { name: 'Relojes', slug: 'relojes', sortOrder: 1 },
    { name: 'Trabajos Personalizados', slug: 'trabajos-personalizados', sortOrder: 2 },
    { name: 'Marroquinería', slug: 'marroquineria', sortOrder: 3 },
    { name: 'Mates', slug: 'mates', sortOrder: 4 },
  ];

  const rootMap = new Map<string, string>(); // slug -> id

  for (const r of roots) {
    const root = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: TENANT, slug: r.slug } },
      update: { name: r.name, sortOrder: r.sortOrder, isActive: true, parentId: null },
      create: { tenantId: TENANT, name: r.name, slug: r.slug, sortOrder: r.sortOrder, isActive: true },
    });
    rootMap.set(r.slug, root.id);
    console.log(`✅ Sección Principal: ${root.name} (${root.slug})`);
  }

  // 2. Subcategorías oficiales de Joyería
  const joyeriaId = rootMap.get('joyeria')!;
  const joyeriaSubs = [
    { name: 'Anillos', slug: 'anillos', sortOrder: 0 },
    { name: 'Aros', slug: 'aros', sortOrder: 1 },
    { name: 'Cadenas y Gargantillas', slug: 'gargantillas', sortOrder: 2 },
    { name: 'Dijes y Colgantes', slug: 'dijes', sortOrder: 3 },
    { name: 'Pulseras', slug: 'pulseras', sortOrder: 4 },
    { name: 'Pulseras Bebé', slug: 'pulseras-bebe', sortOrder: 5 },
  ];

  const subMap = new Map<string, string>(); // slug -> id

  for (const s of joyeriaSubs) {
    const sub = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: TENANT, slug: s.slug } },
      update: { name: s.name, parentId: joyeriaId, sortOrder: s.sortOrder, isActive: true },
      create: { tenantId: TENANT, name: s.name, slug: s.slug, parentId: joyeriaId, sortOrder: s.sortOrder, isActive: true },
    });
    subMap.set(s.slug, sub.id);
    console.log(`   └─ Joyería > ${sub.name} (${sub.slug})`);
  }

  // 3. Subcategorías oficiales de Relojes
  const relojesId = rootMap.get('relojes')!;
  const relojesSubs = [
    { name: 'Casio & Catterpillar', slug: 'casio-catterpillar', sortOrder: 0 },
    { name: 'Seiko & Orient', slug: 'seiko-orient', sortOrder: 1 },
    { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', sortOrder: 2 },
    { name: 'Tressa & Smarts', slug: 'tressa-smarts', sortOrder: 3 },
  ];

  for (const s of relojesSubs) {
    const sub = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: TENANT, slug: s.slug } },
      update: { name: s.name, parentId: relojesId, sortOrder: s.sortOrder, isActive: true },
      create: { tenantId: TENANT, name: s.name, slug: s.slug, parentId: relojesId, sortOrder: s.sortOrder, isActive: true },
    });
    subMap.set(s.slug, sub.id);
    console.log(`   └─ Relojes > ${sub.name} (${sub.slug})`);
  }

  // 4. Migrar productos de categorías duplicadas / slug viejos a los slugs oficiales
  const migrationMap: Record<string, string> = {
    'anillos-2': 'anillos',
    'aros-2': 'aros',
    'cadenas': 'gargantillas',
    'cadenas-y-gargantillas': 'gargantillas',
    'dijes': 'dijes',
    'pulseras-2': 'pulseras',
  };

  for (const [oldSlug, targetSlug] of Object.entries(migrationMap)) {
    const oldCat = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId: TENANT, slug: oldSlug } },
      include: { _count: { select: { products: true } } },
    });

    const targetId = subMap.get(targetSlug);
    if (oldCat && targetId && oldCat.id !== targetId) {
      if (oldCat._count.products > 0) {
        console.log(`📦 Migrando ${oldCat._count.products} productos de "${oldCat.name}" (${oldSlug}) a (${targetSlug})...`);
        await prisma.product.updateMany({
          where: { categoryId: oldCat.id },
          data: { categoryId: targetId },
        });
      }

      // Eliminar o desactivar la categoría vieja
      try {
        await prisma.category.delete({ where: { id: oldCat.id } });
        console.log(`🗑️  Eliminada categoría duplicada: ${oldCat.name} (${oldSlug})`);
      } catch {
        await prisma.category.update({ where: { id: oldCat.id }, data: { isActive: false } });
        console.log(`⚠️  Desactivada categoría duplicada: ${oldCat.name} (${oldSlug})`);
      }
    }
  }

  // 5. Eliminar o desactivar cualquier subcategoría duplicada bajo Joyería que no esté en la lista oficial
  const allJoyeriaChildren = await prisma.category.findMany({
    where: { parentId: joyeriaId },
  });

  const validJoyeriaSlugs = new Set(joyeriaSubs.map((s) => s.slug));

  for (const child of allJoyeriaChildren) {
    if (!validJoyeriaSlugs.has(child.slug)) {
      const prodCount = await prisma.product.count({ where: { categoryId: child.id } });
      if (prodCount > 0) {
        // Mover a la primera subcategoría válida según nombre
        const fallbackTarget = joyeriaSubs.find((s) => child.name.toLowerCase().includes(s.name.toLowerCase()))?.slug ?? 'anillos';
        const fallbackId = subMap.get(fallbackTarget)!;
        await prisma.product.updateMany({
          where: { categoryId: child.id },
          data: { categoryId: fallbackId },
        });
      }
      try {
        await prisma.category.delete({ where: { id: child.id } });
        console.log(`🗑️  Eliminada subcategoría sobrante: ${child.name} (${child.slug})`);
      } catch {
        await prisma.category.update({ where: { id: child.id }, data: { isActive: false } });
        console.log(`⚠️  Desactivada subcategoría sobrante: ${child.name} (${child.slug})`);
      }
    }
  }

  // 6. Resumen final
  console.log('\n✨ Estado final limpio en la base de datos:');
  const finalRoots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  for (const r of finalRoots) {
    console.log(`📁 ${r.name} (${r._count.products} productos directos)`);
    for (const c of r.children) {
      console.log(`   └─ ${c.name} (${c._count.products} productos)`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
