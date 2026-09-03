import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-display text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 font-body mb-6 text-sm">
        La página que estás buscando no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-gray-800 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
