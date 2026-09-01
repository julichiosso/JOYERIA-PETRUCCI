"use client";

/**
 * components/admin/ImageUploader.tsx
 * Subida y previsualización de imágenes en el panel de administración.
 *
 * Flujo mobile-friendly:
 *  - El dueño selecciona fotos (cámara o galería del celular)
 *  - Se generan previews locales instantáneos (URL.createObjectURL)
 *  - Los archivos reales (File) se guardan en el estado y se suben al guardar el producto
 */

import { useRef, useCallback } from "react";
import Image from "next/image";

export interface LocalProductImage {
  id?: string;            // id si ya existía en la base de datos
  url?: string;           // url remota si ya existía
  thumbnailUrl?: string | null;
  altText?: string | null;
  order: number;
  _file?: File;           // archivo nuevo pendiente de subir
  _localPreview: string;  // preview blob o url
}

interface ImageUploaderProps {
  images: LocalProductImage[];
  onImagesChange: (images: LocalProductImage[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  images,
  onImagesChange,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      const newImages: LocalProductImage[] = fileArray.map((file, i) => ({
        _file: file,
        _localPreview: URL.createObjectURL(file),
        altText: file.name.replace(/\.[^.]+$/, ""),
        order: images.length + i,
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images, onImagesChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const target = images[index];
    if (target._localPreview.startsWith("blob:")) {
      URL.revokeObjectURL(target._localPreview);
    }
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onImagesChange(updated);
  };

  const updateAltText = (index: number, altText: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, altText } : img
    );
    onImagesChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Botón de selección / Drag & Drop */}
      <div
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        aria-label="Agregar fotos del producto"
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          border-gray-300 hover:border-amber-500 hover:bg-amber-50/50
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
          className="mx-auto mb-2 text-gray-400"
        >
          <rect x="3" y="7" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 24l8-7 6 5 5-4 11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 16v8M14 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="font-body text-sm text-gray-700 font-medium">
          Tocá para agregar fotos desde el celular o computadora
        </p>
        <p className="font-body text-xs text-gray-400 mt-0.5">
          JPG, PNG o WebP · Hasta 10 fotos
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
          aria-label="Seleccionar imágenes"
        />
      </div>

      {/* Grid de miniaturas */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div key={img.id ?? img._localPreview ?? index} className="relative group">
              <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={img._localPreview || img.thumbnailUrl || img.url || ""}
                  alt={img.altText ?? `Foto ${index + 1}`}
                  fill
                  unoptimized={img._localPreview.startsWith("blob:")}
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />

                {/* Badge principal */}
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 bg-amber-700 text-white font-body text-[8px] tracking-wide px-1.5 py-0.5 rounded shadow">
                    Principal
                  </span>
                )}

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label={`Eliminar foto ${index + 1}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2L2 8" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Alt text descriptivo */}
              <input
                type="text"
                value={img.altText ?? ""}
                onChange={(e) => updateAltText(index, e.target.value)}
                placeholder="Descripción (opcional)"
                className="mt-1 w-full text-[10px] font-body text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-600"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
