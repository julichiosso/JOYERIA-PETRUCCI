export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos (á, é, í, ó, ú, ñ → a, e, i, o, u, n)
    .replace(/[^a-z0-9\s-]/g, '') // saca caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // espacios → guiones
    .replace(/-+/g, '-'); // colapsa guiones múltiples
}