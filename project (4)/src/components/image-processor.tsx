
"use client"

import React, { useRef, useEffect } from 'react';

interface ImageProcessorProps {
  imageSrc: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  triggerProcess: number;
  onProcessed?: (dataUrl: string) => void;
}

export function ImageProcessor({
  imageSrc,
  brightness,
  contrast,
  saturation,
  rotation,
  triggerProcess,
  onProcessed
}: ImageProcessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (triggerProcess === 0) return;

    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const isRotated = rotation % 180 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      
      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      if (onProcessed) {
        onProcessed(canvas.toDataURL('image/jpeg', 0.9));
      }
    };
    img.src = imageSrc;
  }, [triggerProcess]);

  return <canvas ref={canvasRef} className="hidden" />;
}
