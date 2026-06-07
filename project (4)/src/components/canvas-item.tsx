
"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layers } from 'lucide-react';
import { MM_TO_PX } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CanvasItemProps {
  id: string;
  imageSrc: string;
  widthMm: number;
  heightMm: number;
  strokeWidth: number;
  strokeColor: string;
  initialX: number;
  initialY: number;
  rotation: number;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  zoom: number;
}

export function CanvasItem({
  id,
  imageSrc,
  widthMm,
  heightMm,
  strokeWidth,
  strokeColor,
  initialX,
  initialY,
  rotation,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onRotate,
  onPositionChange,
  zoom
}: CanvasItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const startDragRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: initialX, y: initialY });

  useEffect(() => {
    setPos({ x: initialX, y: initialY });
    posRef.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    onSelect(id);
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    startDragRef.current = { 
      x: clientX - (posRef.current.x * zoom), 
      y: clientY - (posRef.current.y * zoom) 
    };
    
    // Stop propagation so we don't deselect by clicking workspace
    e.stopPropagation();
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    const newX = (clientX - startDragRef.current.x) / zoom;
    const newY = (clientY - startDragRef.current.y) / zoom;
    
    const newPos = { x: newX, y: newY };
    setPos(newPos);
    posRef.current = newPos;
    
    if (e.cancelable) e.preventDefault();
  }, [isDragging, zoom]);

  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(id, posRef.current.x, posRef.current.y);
    }
  }, [isDragging, id, onPositionChange]);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate3d(${pos.x * zoom}px, ${pos.y * zoom}px, 0) rotate(${rotation}deg)`,
    width: widthMm * MM_TO_PX * zoom,
    height: heightMm * MM_TO_PX * zoom,
    border: strokeWidth > 0 ? `${strokeWidth * zoom}px solid ${strokeColor}` : 'none',
    boxShadow: isDragging 
      ? '0 25px 50px -12px rgba(0,0,0,0.5)' 
      : isSelected 
        ? '0 0 0 3px hsl(var(--primary)), 0 10px 15px -3px rgba(0,0,0,0.2), 0 0 0 5px white' 
        : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    zIndex: isDragging ? 9999 : 'auto',
    touchAction: 'none',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out, box-shadow 0.2s ease',
  };

  return (
    <div
      className={cn(
        "select-none bg-white origin-center", 
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isSelected && "z-50",
      )}
      style={style}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      <img
        src={imageSrc}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      
      {isSelected && (
        <div className="absolute bottom-1 right-1 bg-primary text-white p-0.5 rounded opacity-50">
           <Layers className="w-2 h-2" />
        </div>
      )}
    </div>
  );
}
