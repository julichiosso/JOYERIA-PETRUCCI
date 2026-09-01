"use client";

/**
 * components/admin/ImageUploader.tsx
 * Subida de imágenes para el formulario de productos.
 *
 * Flujo:
 *  1. El dueño selecciona una o varias fotos (picker del celular o drag & drop)
 *  2. Por cada foto, se hace POST /admin/media con FormData
 *  3. Se muestra preview inmediato + indicador de progreso individual
 *  4. Las URLs resultantes se pasan al padre vía onImagesChange
 *
 * POST /admin/media devuelve: { url: string, thumbnailUrl: string | null }
 */

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { adminFetchMultipart } from "@/lib/auth";

export interface UploadedImage {
  id?: string;          // id si ya existía en la DB (edición)
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  order: number;
  /** estado local — no se envía al backend */
  _uploading?: boolean;
  _error?: string;
  _localPreview?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  /** Deshabilitar durante el submit del formulario */
  disabled?: boolean;
}

interface MediaResponse {
  url: string;
  thumbnailUrl: string | null;
}

export default function ImageUploader({
  images,
  onImagesChange,
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const uploadFile = useCallback(
    async (file: File, order: number, currentImages: UploadedImage[]) => {
      // Preview local inmediato
      const localPreview = URL.createObjectURL(file);
      const placeholder: UploadedImage = {
        url: "",
        thumbnailUrl: null,
        altText: file.name.replace(/\.[^.]+$/, ""),
        order,
        _uploading: true,
        _localPreview: localPreview,
      };

      const withPlaceholder = [...currentImages, placeholder];
      onImagesChange(withPlaceholder);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await adminFetchMultipart<MediaResponse>(
          "/admin/media",
          formData
        );

        onImagesChange(
          withPlaceholder.map((img) =>
            img._localPreview === localPreview
              ? {
                  ...img,
                  url: result.url,
                  thumbnailUrl: result.thumbnailUrl,
                  _uploading: false,
                  _localPreview: localPreview,
                }
              : img
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir la imagen";
        onImagesChange(
          withPlaceholder.map((img) =>
            img._localPreview === localPreview
              ? { ...img, _uploading: false, _error: message }
              : img
          )
        );
      }
    },
    [onImagesChange]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const startOrder = images.length;
      fileArray.forEach((file, i) => uploadFile(file, startOrder + i, images));
    },
    [images, uploadFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    // Reset input para permitir subir la misma foto de nuevo
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
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
      {/* Drop zone / botón de selección */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragging ? "border-amber-500 bg-amber-50" : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"}
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        aria-label="Agregar fotos del producto"
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="mx-auto mb-3 text-gray-400">
          <rect x="3" y="7" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 24l8-7 6 5 5-4 11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 16v8M14 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="font-body text-sm text-gray-600 font-medium">
          Tocá para agregar fotos
        </p>
        <p className="font-body text-xs text-gray-400 mt-1">
          JPG, PNG o WebP · Máx. 10 MB por foto
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

      {/* Grid de previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div key={img._localPreview ?? img.url ?? index} className="relative group">
              {/* Preview imagen */}
              <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={img._localPreview ?? img.thumbnailUrl ?? img.url}
                  alt={img.altText ?? `Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 25vw"
                  unoptimized={!!img._localPreview} // blob URL no pasa por next/image optimizer
                />

                {/* Spinner de carga */}
                {img._uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" aria-label="Subiendo…" />
                  </div>
                )}

                {/* Error de upload */}
                {img._error && (
                  <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-1 gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-500">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8 5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <p className="font-body text-[9px] text-red-600 text-center leading-tight">{img._error}</p>
                  </div>
                )}

                {/* Badge principal (primera foto) */}
                {index === 0 && !img._uploading && !img._error && (
                  <span className="absolute bottom-1 left-1 bg-amber-700 text-white font-body text-[8px] tracking-wide px-1.5 py-0.5 rounded">
                    Principal
                  </span>
                )}

                {/* Botón eliminar */}
                {!img._uploading && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label={`Eliminar foto ${index + 1}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 2l6 6M8 2L2 8" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Alt text (accesibilidad + SEO) */}
              <input
                type="text"
                value={img.altText ?? ""}
                onChange={(e) => updateAltText(index, e.target.value)}
                placeholder="Descripción de la foto"
                className="mt-1.5 w-full text-[10px] font-body text-gray-600 placeholder:text-gray-400 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
                aria-label={`Descripción accesible foto ${index + 1}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
