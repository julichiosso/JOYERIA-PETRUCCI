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
import { adminFetch } from "@/lib/auth";
import { useToast } from "@/hooks/useToast";

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
  productId?: string;
}

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
  productId,
}: ImageUploaderProps) {
  const toast = useToast();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingAltId, setSavingAltId] = useState<string | null>(null);

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

          if (file.size < 2 * 1024 * 1024) {
            processed = file;
          } else {
            processed = await compressImage(file);
          }

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
          altText: file.name.replace(/\.[^.]+$/, "").slice(0, 100),
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

  const removeImage = async (index: number) => {
    const target = images[index];

    // Si ya existe en el backend y tiene ID
    if (target.id) {
      setDeletingId(target.id);
      try {
        await adminFetch(`/admin/media/images/${target.id}`, {
          method: "DELETE",
        });
        toast.success("Foto eliminada correctamente.");
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message ?? "No se pudo eliminar la foto del servidor.");
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
    } else if (target._localPreview.startsWith("blob:")) {
      URL.revokeObjectURL(target._localPreview);
    }

    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onImagesChange(updated);
  };

  const syncReorder = async (newImages: LocalProductImage[]) => {
    onImagesChange(newImages);

    // Si todas las imágenes tienen id y tenemos productId, sincronizar con el backend
    const existingIds = newImages.map((img) => img.id).filter(Boolean) as string[];
    if (productId && existingIds.length === newImages.length && existingIds.length > 0) {
      try {
        await adminFetch(`/admin/media/products/${productId}/images/reorder`, {
          method: "POST",
          body: JSON.stringify({ imageIds: existingIds }),
        });
        toast.success("Orden de fotos actualizado.");
      } catch {
        toast.error("Error al guardar el nuevo orden de fotos.");
      }
    }
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    const updated = [item, ...rest].map((img, i) => ({ ...img, order: i }));
    syncReorder(updated);
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((img, i) => ({ ...img, order: i }));
    syncReorder(updated);
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, altText } : img
    );
    onImagesChange(updated);
  };

  const handleAltTextBlur = async (index: number) => {
    const img = images[index];
    if (!img.id || !img.altText) return;

    const trimmed = img.altText.trim();
    if (trimmed.length < 3) return;

    setSavingAltId(img.id);
    try {
      await adminFetch(`/admin/media/images/${img.id}`, {
        method: "PATCH",
        body: JSON.stringify({ altText: trimmed.slice(0, 125) }),
      });
    } catch {
      // Silencioso o toast opcional
    } finally {
      setSavingAltId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cámara */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || compressing}
          className="flex items-center justify-center gap-2.5 p-4 bg-[#1D1D1F] hover:bg-black active:scale-[0.98] text-white rounded-2xl transition-all disabled:opacity-50 cursor-pointer min-h-[56px] shadow-xs"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Tomar foto con cámara</span>
        </button>

        {/* Galería */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || compressing}
          className="flex items-center justify-center gap-2.5 p-4 bg-[#F5F5F7] hover:bg-gray-200/70 active:scale-[0.98] text-[#1D1D1F] border border-gray-200/80 rounded-2xl transition-all disabled:opacity-50 cursor-pointer min-h-[56px]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Elegir de galería</span>
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
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-xs font-semibold">
          <span className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Optimizando foto para que suba rápido y sin errores… un momento.</span>
        </div>
      )}

      {/* Error de compresión */}
      {compressError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold">
          ⚠️ {compressError}
        </div>
      )}

      {/* Contador de fotos */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          {images.length === 0
            ? "Ninguna foto cargada todavía"
            : `${images.length} foto${images.length > 1 ? "s" : ""} seleccionada${images.length > 1 ? "s" : ""}`}
        </span>
        {images.length > 0 && (
          <span className="text-gray-400 text-[11px]">La primera foto es la portada</span>
        )}
      </div>

      {/* Grid de miniaturas */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {images.map((img, index) => {
            const rawSrc = img._localPreview || img.thumbnailUrl || img.url || "";
            const src = rawSrc.startsWith("blob:") ? rawSrc : getImageUrl(rawSrc);
            const isDeleting = deletingId === img.id;

            return (
              <div
                key={img.id ?? img._localPreview ?? index}
                className={`relative flex flex-col bg-white border rounded-2xl overflow-hidden shadow-2xs group transition-all ${
                  isDeleting ? "opacity-30 pointer-events-none" : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="relative aspect-square w-full bg-[#F5F5F7]">
                  <Image
                    src={src}
                    alt={img.altText ?? `Foto ${index + 1}`}
                    fill
                    unoptimized={src.startsWith("blob:")}
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />

                  {/* Badge Principal o Botón para hacer principal */}
                  {index === 0 ? (
                    <span className="absolute top-2.5 left-2.5 bg-[#1D1D1F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Portada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsMain(index)}
                      className="absolute top-2.5 left-2.5 bg-black/70 hover:bg-[#1D1D1F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors cursor-pointer"
                      title="Hacer foto de portada"
                    >
                      Hacer portada
                    </button>
                  )}

                  {/* Controles de Reorden (Flechas izquierda/derecha) */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => moveImage(index, "left")}
                        disabled={index === 0}
                        className="p-1 text-white hover:text-blue-300 disabled:opacity-20 disabled:hover:text-white transition-colors cursor-pointer"
                        title="Mover a la izquierda"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, "right")}
                        disabled={index === images.length - 1}
                        className="p-1 text-white hover:text-blue-300 disabled:opacity-20 disabled:hover:text-white transition-colors cursor-pointer"
                        title="Mover a la derecha"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Botón Borrar */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
                    aria-label={`Borrar foto ${index + 1}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Alt Text / Descripción SEO de la imagen */}
                <div className="p-2.5 bg-[#F5F5F7]/80 border-t border-gray-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      Texto Alt (SEO)
                    </span>
                    {savingAltId === img.id && (
                      <span className="text-[9px] text-[#007AFF] font-bold">Guardando…</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={img.altText ?? ""}
                    onChange={(e) => handleAltTextChange(index, e.target.value)}
                    onBlur={() => handleAltTextBlur(index)}
                    maxLength={125}
                    placeholder="Descripción de la foto…"
                    className="w-full text-xs font-medium text-[#1D1D1F] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#007AFF] transition-colors"
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
