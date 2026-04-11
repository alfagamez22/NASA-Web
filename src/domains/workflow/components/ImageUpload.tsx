"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Upload, Crop, Trash2, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  placeholder?: string;
}

async function getCroppedImg(imageSrc: string, crop: Area): Promise<string> {
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function ImageUpload({ value, onChange, placeholder = "/placeholder.jpg" }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const currentImg = value || placeholder;
  const isPlaceholder = !value || value === placeholder || value === "/placeholder.jpg";

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    // Limit to ~5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function applyCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(cropSrc, croppedAreaPixels);
    onChange(cropped);
    setCropSrc(null);
  }

  function handleEditCrop() {
    if (isPlaceholder) return;
    setCropSrc(currentImg);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function handleDeleteImage() {
    onChange(placeholder);
  }

  return (
    <>
      <div className="space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Image
        </label>

        {/* Preview + actions */}
        <div className="flex items-start gap-3">
          <div
            className={`relative w-24 h-32 rounded-lg overflow-hidden border-2 border-dashed transition-colors cursor-pointer ${
              dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-gray-600"
            }`}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
          >
            <img
              src={currentImg}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Upload size={20} className="text-cyan-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all hover:text-cyan-300"
              style={{ border: "1px solid var(--border-color)", color: "var(--accent-color)" }}
            >
              <Upload size={12} /> Upload
            </button>
            {!isPlaceholder && (
              <>
                <button
                  type="button"
                  onClick={handleEditCrop}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all hover:text-cyan-300"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                >
                  <Crop size={12} /> Crop
                </button>
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all hover:text-red-300"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </>
            )}
          </div>
        </div>

        <p className="font-mono text-[9px]" style={{ color: "var(--text-secondary)" }}>
          Click image or drag &amp; drop to upload. Max 5MB.
        </p>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-[350] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg flex flex-col" style={{ background: "var(--bg-secondary)", border: "2px solid var(--border-color-strong)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h4 className="font-display text-xl uppercase" style={{ color: "var(--accent-color)" }}>Crop Image</h4>
              <button onClick={() => setCropSrc(null)} className="text-nasa-gray hover:text-white"><X size={18} /></button>
            </div>
            <div className="relative w-full" style={{ height: "400px" }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 flex items-center gap-4">
              <label className="font-mono text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <button
                type="button"
                onClick={applyCrop}
                className="nasa-btn text-xs flex items-center gap-1"
              >
                <Crop size={12} /> Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
