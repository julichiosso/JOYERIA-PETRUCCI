"use client";

/**
 * components/admin/ImageUploader.tsx
 * Subida y previsualización de imágenes en el panel de administración.
 *
 * Diseñado especialmente para máxima comodidad en celulares (touch amigable, botones grandes):
 *  - Botón directo para "Tomar foto con la cámara"
 *  - Botón para "Elegir fotos de la galería o computadora"
 *  - Previews grandes, orden visual y badge claro de Foto Principal
 *  - Botones de borrar grandes (fáciles de presionar)
 */

import { useRef, useCallback } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    const updated = [item, ...rest].map((img, i) => ({ ...img, order: i }));
    onImagesChange(updated);
  };

  const updateAltText = (index: number, altText: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, altText } : img
    );
    onImagesChange(updated);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Botones de acción principales (grandes y cómodos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opción 1: Cámara del teléfono */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center gap-3.5 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 text-gray-900 font-body text-sm font-semibold shadow-xs"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gray-700">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <div className="text-left">
            <p className="leading-tight">Sacar foto con la cámara</p>
            <p className="text-xs font-normal text-gray-500">Abrir cámara del celular</p>
          </div>
        </button>

        {/* Opción 2: Galería / Archivos */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center gap-3.5 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 text-gray-900 font-body text-sm font-semibold shadow-xs"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gray-700">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <div className="text-left">
            <p className="leading-tight">Elegir de la galería</p>
            <p className="text-xs font-normal text-gray-500">Subir una o varias fotos</p>
          </div>
        </button>

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleCameraChange}
          disabled={disabled}
          aria-label="Tomar foto con la cámara"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleGalleryChange}
          disabled={disabled}
          aria-label="Seleccionar imágenes de la galería"
        />
      </div>

      {/* Contador de fotos */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-body px-1">
        <span>
          {images.length === 0
            ? "Ninguna foto cargada"
            : `${images.length} foto${images.length > 1 ? "s" : ""} seleccionada${images.length > 1 ? "s" : ""}`}
        </span>
        {images.length > 0 && (
          <span className="text-gray-400">
            La primera foto es la portada del producto
          </span>
        )}
      </div>

      {/* Grid de miniaturas */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, index) => {
            const rawSrc = img._localPreview || img.thumbnailUrl || img.url || "";
            const src = rawSrc.startsWith("blob:") ? rawSrc : getImageUrl(rawSrc);

            return (
              <div
                key={img.id ?? img._localPreview ?? index}
                className="relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs group"
              >
                {/* Contenedor de la foto */}
                <div className="relative aspect-square w-full bg-gray-100">
                  <Image
                    src={src}
                    alt={img.altText ?? `Foto ${index + 1}`}
                    fill
                    unoptimized={src.startsWith("blob:")}
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Badge de Foto Principal */}
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 bg-gray-900 text-white font-body text-[11px] font-medium px-2 py-0.5 rounded shadow-sm">
                      Principal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsMain(index)}
                      className="absolute top-2 left-2 bg-black/70 hover:bg-gray-900 text-white font-body text-[11px] px-2 py-0.5 rounded shadow transition-colors"
                      title="Hacer foto principal"
                    >
                      Hacer principal
                    </button>
                  )}

                  {/* Botón de borrar grande (fácil de tocar en teléfono) */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-9 h-9 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
                    aria-label={`Borrar foto ${index + 1}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Pie de foto / Descripción opcional */}
                <div className="p-2.5 bg-gray-50 border-t border-gray-100">
                  <input
                    type="text"
                    value={img.altText ?? ""}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full text-xs font-body text-gray-700 bg-white border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
