"use client";

/**
 * components/admin/ImageUploader.tsx
 *
 * IMPORTANTE — Por qué existe la compresión en cliente:
 * Vercel funciones serverless tienen un límite fijo de 4.5MB por request (plan Hobby/gratuito).
 * Una foto de cámara de iPhone sin comprimir suele pesar entre 5-15MB, superando ese límite
 * y causando "Internal Server Error" antes de que el request llegue al handler de Fastify.
 * La solución definitiva es comprimir y redimensionar en el navegador ANTES del upload,
 * llevando el peso de ~10MB a <1MB, muy por debajo del límite de Vercel.
 */

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

export interface LocalProductImage {
  id?: string;
  url?: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  order: number;
  _file?: File;
  _localPreview: string;
}

interface ImageUploaderProps {
  images: LocalProductImage[];
  onImagesChange: (images: LocalProductImage[]) => void;
  disabled?: boolean;
}

// ─── Compresión en cliente ───────────────────────────────────────────────────
// Redimensiona y comprime una imagen en el canvas del navegador antes de subirla.
// - Lado más largo: máx. 2000px (mantiene relación de aspecto)
// - Calidad JPEG: 0.82 (buen balance calidad/peso)
// - Resultado típico: 8MB iPhone → ~700KB

const MAX_SIDE_PX = 2000;
const JPEG_QUALITY = 0.82;
const MAX_UPLOAD_MB = 4; // por debajo del límite de Vercel de 4.5MB

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const { naturalWidth: w, naturalHeight: h } = img;

      // Calcular nuevas dimensiones
      let newW = w;
      let newH = h;
      if (w > MAX_SIDE_PX || h > MAX_SIDE_PX) {
        if (w >= h) {
          newW = MAX_SIDE_PX;
          newH = Math.round((h / w) * MAX_SIDE_PX);
        } else {
          newH = MAX_SIDE_PX;
          newW = Math.round((w / h) * MAX_SIDE_PX);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, newW, newH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = blobUrl;
  });
}

export default function ImageUploader({
  images,
  onImagesChange,
  disabled = false,
}: ImageUploaderProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArray.length === 0) return;

      setCompressing(true);
      setCompressError(null);

      try {
        const compressedFiles: File[] = [];
        const tooHeavy: string[] = [];

        for (const file of fileArray) {
          let processed: File;

          // Si ya es pequeña (< 2MB), subir tal cual sin pasar por canvas
          if (file.size < 2 * 1024 * 1024) {
            processed = file;
          } else {
            processed = await compressImage(file);
          }

          // Verificar que quedó por debajo del límite seguro para Vercel
          if (processed.size > MAX_UPLOAD_MB * 1024 * 1024) {
            tooHeavy.push(file.name);
            continue;
          }

          compressedFiles.push(processed);
        }

        if (tooHeavy.length > 0) {
          setCompressError(
            `${tooHeavy.length > 1 ? "Algunas fotos son" : "Esta foto es"} muy pesada${tooHeavy.length > 1 ? "s" : ""} incluso después de comprimir. Probá sacar otra foto desde más cerca o con menos zoom.`
          );
        }

        if (compressedFiles.length === 0) return;

        const newImages: LocalProductImage[] = compressedFiles.map((file, i) => ({
          _file: file,
          _localPreview: URL.createObjectURL(file),
          altText: file.name.replace(/\.[^.]+$/, ""),
          order: images.length + i,
        }));

        onImagesChange([...images, ...newImages]);
      } catch {
        setCompressError("No se pudieron procesar las fotos. Intentá de nuevo.");
      } finally {
        setCompressing(false);
      }
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
      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Cámara */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || compressing}
          className="flex items-center justify-center gap-3.5 p-5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 text-gray-900 text-base font-semibold shadow-xs"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gray-700 shrink-0">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <div className="text-left">
            <p className="leading-tight">📷 Sacar foto con la cámara</p>
            <p className="text-sm font-normal text-gray-500">Se comprime automáticamente</p>
          </div>
        </button>

        {/* Galería */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || compressing}
          className="flex items-center justify-center gap-3.5 p-5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 text-gray-900 text-base font-semibold shadow-xs"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gray-700 shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <div className="text-left">
            <p className="leading-tight">🖼️ Elegir de la galería</p>
            <p className="text-sm font-normal text-gray-500">Una o varias fotos a la vez</p>
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
          disabled={disabled || compressing}
          aria-label="Tomar foto con la cámara"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleGalleryChange}
          disabled={disabled || compressing}
          aria-label="Seleccionar imágenes de la galería"
        />
      </div>

      {/* Estado de compresión */}
      {compressing && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-medium">
          <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Comprimiendo foto para que se pueda subir... un momento.</span>
        </div>
      )}

      {/* Error de compresión */}
      {compressError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
          ⚠️ {compressError}
        </div>
      )}

      {/* Contador de fotos */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>
          {images.length === 0
            ? "Ninguna foto cargada todavía"
            : `${images.length} foto${images.length > 1 ? "s" : ""} seleccionada${images.length > 1 ? "s" : ""}`}
        </span>
        {images.length > 0 && (
          <span className="text-gray-400 text-xs">La primera foto es la portada</span>
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
                className="relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs group"
              >
                <div className="relative aspect-square w-full bg-gray-100">
                  <Image
                    src={src}
                    alt={img.altText ?? `Foto ${index + 1}`}
                    fill
                    unoptimized={src.startsWith("blob:")}
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {index === 0 ? (
                    <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                      Principal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsMain(index)}
                      className="absolute top-2 left-2 bg-black/70 hover:bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow transition-colors"
                      title="Hacer foto principal"
                    >
                      Hacer principal
                    </button>
                  )}

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

                <div className="p-2.5 bg-gray-50 border-t border-gray-100">
                  <input
                    type="text"
                    value={img.altText ?? ""}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:border-amber-600"
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
