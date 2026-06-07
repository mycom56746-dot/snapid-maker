
"use client"

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  Sun, 
  Contrast, 
  Droplet, 
  Layers, 
  Printer, 
  Download,
  Plus,
  Wand2,
  Trash2,
  Zap,
  Grid,
  Undo2,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronRight,
  Info,
  Check,
  FileImage,
  ImageIcon,
  Maximize2,
  Camera,
  LayoutGrid,
  Scissors,
  ChevronUp,
  ChevronDown,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn,
  ZoomOut,
  Move,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ImageProcessor } from '@/components/image-processor';
import { CanvasItem } from '@/components/canvas-item';
import { PAPER_SIZES, PHOTO_SIZES, MM_TO_PX, PaperSizeKey } from '@/lib/constants';
import { aiDocumentPhotoOptimizer } from '@/ai/flows/ai-document-photo-optimizer-flow';
import { aiCropAndCenterPassportPhoto } from '@/ai/flows/ai-crop-and-center-passport-photo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PhotoItem {
  id: string;
  imageSrc: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  strokeWidth: number;
  strokeColor: string;
  zIndex: number;
  rotation: number;
}

type EditorStep = 'adjust' | 'size' | 'canvas';

const QUICK_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Orange', value: '#f97316' },
];

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<EditorStep>('adjust');
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [triggerProcess, setTriggerProcess] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  const [stagedPhotoSize, setStagedPhotoSize] = useState<{id: string, width: number, height: number, label: string}>(JSON.parse(JSON.stringify(PHOTO_SIZES[1])));
  const [stagedStrokeWidth, setStagedStrokeWidth] = useState(1);
  const [stagedStrokeColor, setStagedStrokeColor] = useState('#e2e8f0');
  const [addQuantity, setAddQuantity] = useState(1);
  
  const [paperSize, setPaperSize] = useState<PaperSizeKey>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [history, setHistory] = useState<PhotoItem[][]>([]);
  const [zCounter, setZCounter] = useState(1);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8);

  // Keyboard Shortcuts for Desktop Workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedItemId) {
        e.preventDefault();
        duplicateSelected();
      }
      if (selectedItemId) {
        if (e.key === 'ArrowUp') nudgeItem('up');
        if (e.key === 'ArrowDown') nudgeItem('down');
        if (e.key === 'ArrowLeft') nudgeItem('left');
        if (e.key === 'ArrowRight') nudgeItem('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, items]);

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else if (source === 'gallery') {
      galleryInputRef.current?.click();
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        setImageSrc(re.target?.result as string);
        setCurrentStep('adjust');
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setRotation(0);
        toast({ title: "Image imported" });
      };
      reader.readAsDataURL(file);
    }
  };

  const nudgeItem = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedItemId) return;
    setItems(prev => prev.map(item => {
      if (item.id === selectedItemId) {
        const amount = 1; // 1 pixel nudge
        switch (direction) {
          case 'up': return { ...item, y: item.y - amount };
          case 'down': return { ...item, y: item.y + amount };
          case 'left': return { ...item, x: item.x - amount };
          case 'right': return { ...item, x: item.x + amount };
        }
      }
      return item;
    }));
  };

  const saveHistory = useCallback((currentItems: PhotoItem[]) => {
    setHistory(prev => [JSON.parse(JSON.stringify(currentItems)), ...prev].slice(0, 15));
  }, []);

  const undo = () => {
    if (history.length > 0) {
      const lastState = history[0];
      setItems(lastState);
      setHistory(prev => prev.slice(1));
      toast({ title: "Action Undone" });
    }
  };

  const addToCanvas = () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setTriggerProcess(prev => prev + 1);
  };

  const handleProcessedImage = (processedDataUrl: string) => {
    saveHistory(items);
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      imageSrc: processedDataUrl,
      x: 10 * MM_TO_PX,
      y: 10 * MM_TO_PX,
      widthMm: stagedPhotoSize.width,
      heightMm: stagedPhotoSize.height,
      strokeWidth: stagedStrokeWidth,
      strokeColor: stagedStrokeColor,
      zIndex: zCounter + 1,
      rotation: 0
    };

    setItems(prev => [...prev, newItem]);
    setZCounter(prev => prev + 1);
    setSelectedItemId(newItem.id);
    setIsProcessing(false);
    setCurrentStep('canvas');
    toast({ title: "Added to workspace" });
  };

  const autoArrange = (itemsToArrange?: PhotoItem[]) => {
    const targetItems = itemsToArrange || items;
    if (targetItems.length === 0) return;
    
    if (!itemsToArrange) saveHistory(items);
    
    const paper = PAPER_SIZES[paperSize];
    const paperW = orientation === 'portrait' ? paper.width : paper.height;
    const paperH = orientation === 'portrait' ? paper.height : paper.width;
    const margin = 5; 
    const padding = 2; 
    
    let curX = margin;
    let curY = margin;
    let maxRowHeight = 0;
    
    const rearranged = targetItems.map(item => {
      // Rotation-aware bounding box
      const isRotated = item.rotation % 180 !== 0;
      const displayWidth = isRotated ? item.heightMm : item.widthMm;
      const displayHeight = isRotated ? item.widthMm : item.heightMm;

      if (curX + displayWidth > paperW - margin) {
        curX = margin;
        curY += maxRowHeight + padding;
        maxRowHeight = 0;
      }
      
      const res = { 
        ...item, 
        x: curX * MM_TO_PX, 
        y: curY * MM_TO_PX 
      };
      
      curX += displayWidth + padding;
      if (displayHeight > maxRowHeight) maxRowHeight = displayHeight;
      return res;
    });
    
    setItems(rearranged);
    if (!itemsToArrange) toast({ title: "Grid Layout Applied" });
  };

  const fillPage = () => {
    const sourceItem = selectedItemId ? items.find(i => i.id === selectedItemId) : items[items.length - 1];
    if (!sourceItem) {
      toast({ variant: "destructive", title: "Select a photo first" });
      return;
    }
    
    saveHistory(items);
    const paper = PAPER_SIZES[paperSize];
    const paperW = orientation === 'portrait' ? paper.width : paper.height;
    const paperH = orientation === 'portrait' ? paper.height : paper.width;
    const margin = 5;
    const padding = 2;

    const isRotated = sourceItem.rotation % 180 !== 0;
    const displayWidth = isRotated ? sourceItem.heightMm : sourceItem.widthMm;
    const displayHeight = isRotated ? sourceItem.widthMm : sourceItem.heightMm;
    
    const colCount = Math.floor((paperW - 2 * margin + padding) / (displayWidth + padding));
    const rowCount = Math.floor((paperH - 2 * margin + padding) / (displayHeight + padding));
    const totalFit = colCount * rowCount;
    
    if (totalFit <= 0) {
      toast({ variant: "destructive", title: "Photo too large" });
      return;
    }

    const newItems: PhotoItem[] = [];
    let localZ = zCounter;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        newItems.push({
          ...JSON.parse(JSON.stringify(sourceItem)),
          id: Math.random().toString(36).substr(2, 9),
          x: (margin + c * (displayWidth + padding)) * MM_TO_PX,
          y: (margin + r * (displayHeight + padding)) * MM_TO_PX,
          zIndex: ++localZ
        });
      }
    }
    setItems(newItems);
    setZCounter(localZ);
    toast({ title: `Filled with ${totalFit} photos` });
  };

  const quickDuplicate = () => {
    const sourceItem = selectedItemId ? items.find(i => i.id === selectedItemId) : items[items.length - 1];
    if (!sourceItem) {
      toast({ variant: "destructive", title: "Nothing to duplicate" });
      return;
    }
    
    saveHistory(items);
    const copiesToAdd = Math.max(1, Math.min(addQuantity, 100));
    const newItems = [...items];
    let localZ = zCounter;

    for (let i = 0; i < copiesToAdd; i++) {
      newItems.push({
        ...JSON.parse(JSON.stringify(sourceItem)),
        id: Math.random().toString(36).substr(2, 9),
        zIndex: ++localZ,
        x: sourceItem.x,
        y: sourceItem.y,
        rotation: sourceItem.rotation
      });
    }

    setZCounter(localZ);
    autoArrange(newItems);
    toast({ title: `Added ${copiesToAdd} copies` });
  };

  const duplicateSelected = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    saveHistory(items);
    const newItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: Math.random().toString(36).substr(2, 9),
      x: item.x + (5 * MM_TO_PX),
      y: item.y + (5 * MM_TO_PX),
      zIndex: zCounter + 1
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setZCounter(prev => prev + 1);
  };

  const rotateItem = (id: string) => {
    saveHistory(items);
    setItems(items.map(i => i.id === id ? { ...i, rotation: (i.rotation + 90) % 360 } : i));
  };

  const deleteSelected = () => {
    if (!selectedItemId) return;
    saveHistory(items);
    setItems(items.filter(i => i.id !== selectedItemId));
    setSelectedItemId(null);
    toast({ title: "Removed item" });
  };

  const runAIAutoFix = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      const res = await aiDocumentPhotoOptimizer({ photoDataUri: imageSrc });
      setBrightness(res.brightness);
      setContrast(res.contrast);
      setSaturation(res.saturation);
      toast({ title: "AI Enhancements Applied" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI optimization error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const runAIAutoCrop = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      const res = await aiCropAndCenterPassportPhoto({ photoDataUri: imageSrc });
      setImageSrc(res.croppedPhotoDataUri);
      toast({ title: "Smart Crop Applied" });
    } catch (e) {
      toast({ variant: "destructive", title: "Face detection failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Layout is empty" });
      return;
    }
    // Mobile print managers sometimes hang if there's too much JS activity.
    // We ensure the print-only container is visible and then call print.
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = (format: 'jpeg' | 'png' | 'pdf' = 'jpeg') => {
    if (items.length === 0) return;
    if (format === 'pdf') {
      handlePrint();
      return;
    }
    setIsProcessing(true);
    const paper = PAPER_SIZES[paperSize];
    const paperW = orientation === 'portrait' ? paper.width : paper.height;
    const paperH = orientation === 'portrait' ? paper.height : paper.width;
    const finalCanvas = document.createElement('canvas');
    const dpiScale = 300 / 96; 
    finalCanvas.width = paperW * MM_TO_PX * dpiScale;
    finalCanvas.height = paperH * MM_TO_PX * dpiScale;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
    const loadImage = (item: PhotoItem) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const x = item.x * dpiScale;
          const y = item.y * dpiScale;
          const w = item.widthMm * MM_TO_PX * dpiScale;
          const h = item.heightMm * MM_TO_PX * dpiScale;
          ctx.save();
          ctx.translate(x + (w / 2), y + (h / 2));
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          if (item.strokeWidth > 0) {
            ctx.strokeStyle = item.strokeColor;
            ctx.lineWidth = item.strokeWidth * dpiScale;
            ctx.strokeRect(-w / 2, -h / 2, w, h);
          }
          ctx.restore();
          resolve();
        };
        img.onerror = reject;
        img.src = item.imageSrc;
      });
    };
    Promise.all(sortedItems.map(loadImage))
      .then(() => {
        const link = document.createElement('a');
        link.download = `SnapID_Maker_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
        link.href = finalCanvas.toDataURL(`image/${format}`, 0.95);
        link.click();
        toast({ title: `Exported as ${format.toUpperCase()}` });
      })
      .catch(() => toast({ variant: "destructive", title: "Export failed" }))
      .finally(() => setIsProcessing(false));
  };

  return (
    <>
      {/* High-Precision Print Overlay: Separated from the interactive UI to prevent clipping */}
      <div className="print-only">
        <div 
          style={{
            width: (orientation === 'portrait' ? PAPER_SIZES[paperSize].width : PAPER_SIZES[paperSize].height) + 'mm',
            height: (orientation === 'portrait' ? PAPER_SIZES[paperSize].height : PAPER_SIZES[paperSize].width) + 'mm',
            position: 'relative',
            backgroundColor: 'white',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          {items.map(item => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: (item.x / MM_TO_PX) + 'mm',
                top: (item.y / MM_TO_PX) + 'mm',
                width: item.widthMm + 'mm',
                height: item.heightMm + 'mm',
                border: item.strokeWidth > 0 ? `${item.strokeWidth}px solid ${item.strokeColor}` : 'none',
                zIndex: item.zIndex,
                transform: `rotate(${item.rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <img src={item.imageSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col h-svh bg-slate-50 overflow-hidden select-none relative no-print">
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

        <header className="flex items-center justify-between p-3 bg-white border-b z-50 h-14">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-9 w-9 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-tighter">SnapID Maker</h2>
              <p className="text-[10px] text-muted-foreground font-bold opacity-60">Studio Pro</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentStep === 'canvas' && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9 gap-2 text-xs font-bold" disabled={isProcessing || items.length === 0}>
                      <Download className="w-4 h-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleDownload('jpeg')} className="gap-2">
                      <FileImage className="w-4 h-4" /> Save as JPG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('png')} className="gap-2">
                      <ImageIcon className="w-4 h-4" /> Save as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('pdf')} className="gap-2">
                      <FileDown className="w-4 h-4" /> Save as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button size="sm" className="h-9 bg-primary text-white gap-2 text-xs font-bold shadow-lg" onClick={handlePrint} disabled={isProcessing || items.length === 0}>
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-slate-100">
          <div 
            ref={canvasContainerRef}
            className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-center relative"
            onClick={() => setSelectedItemId(null)}
          >
            {!imageSrc ? (
              <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-xl flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Import Photo</h3>
                  <p className="text-sm text-slate-400">Select a photo to begin.</p>
                </div>
                <div className="grid grid-cols-2 w-full gap-4">
                  <Button onClick={() => galleryInputRef.current?.click()} className="h-16 rounded-2xl gap-3 font-bold">
                    <ImageIcon className="w-6 h-6" /> Gallery
                  </Button>
                  <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="h-16 rounded-2xl gap-3 font-bold border-2">
                    <Camera className="w-6 h-6" /> Camera
                  </Button>
                </div>
              </div>
            ) : (currentStep === 'adjust' || currentStep === 'size') ? (
              <div className="w-full max-w-md aspect-[4/5] bg-white rounded-xl shadow-2xl overflow-hidden relative border-8 border-white">
                <div 
                  className="w-full h-full bg-center bg-contain bg-no-repeat transition-all duration-300" 
                  style={{ 
                    backgroundImage: `url(${imageSrc})`, 
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                    transform: `rotate(${rotation}deg)`,
                  }} 
                />
                {currentStep === 'size' && stagedStrokeWidth > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ border: `${stagedStrokeWidth}px solid ${stagedStrokeColor}` }}
                  />
                )}
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="bg-white shadow-2xl relative transition-transform duration-200 origin-center border"
                  style={{
                    width: (orientation === 'portrait' ? PAPER_SIZES[paperSize].width : PAPER_SIZES[paperSize].height) * MM_TO_PX * zoom,
                    height: (orientation === 'portrait' ? PAPER_SIZES[paperSize].height : PAPER_SIZES[paperSize].width) * MM_TO_PX * zoom,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[...items].sort((a, b) => a.zIndex - b.zIndex).map(item => (
                    <CanvasItem
                      key={item.id}
                      id={item.id}
                      imageSrc={item.imageSrc}
                      widthMm={item.widthMm}
                      heightMm={item.heightMm}
                      strokeWidth={item.strokeWidth}
                      strokeColor={item.strokeColor}
                      initialX={item.x}
                      initialY={item.y}
                      rotation={item.rotation}
                      isSelected={selectedItemId === item.id}
                      onSelect={(id) => setSelectedItemId(id)}
                      onDelete={deleteSelected}
                      onDuplicate={duplicateSelected}
                      onRotate={rotateItem}
                      onPositionChange={(id, x, y) => {
                        saveHistory(items);
                        setItems(items.map(i => i.id === id ? { ...i, x, y } : i));
                      }}
                      zoom={zoom}
                    />
                  ))}
                </div>
                {/* Visual Workspace Zoom Controls */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border z-50">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center px-3 font-black text-xs min-w-[60px] justify-center">
                    {Math.round(zoom * 100)}%
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l flex flex-col z-40 shadow-xl max-h-[50svh] md:max-h-full">
            <Tabs value={currentStep} onValueChange={(v: any) => setCurrentStep(v)} className="w-full h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none bg-slate-50 border-b p-0 h-14">
                <TabsTrigger value="adjust" className="flex-1 h-full rounded-none gap-2 data-[state=active]:bg-white font-bold text-[10px] uppercase">
                  <Droplet className="w-3 h-3" /> 1. Edit
                </TabsTrigger>
                <TabsTrigger value="size" className="flex-1 h-full rounded-none gap-2 data-[state=active]:bg-white font-bold text-[10px] uppercase">
                  <Maximize2 className="w-3 h-3" /> 2. Specs
                </TabsTrigger>
                <TabsTrigger value="canvas" className="flex-1 h-full rounded-none gap-2 data-[state=active]:bg-white font-bold text-[10px] uppercase">
                  <Layers className="w-3 h-3" /> 3. Layout
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                <TabsContent value="adjust" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" className="gap-2 h-11 font-bold text-xs" onClick={runAIAutoFix} disabled={!imageSrc || isProcessing}>
                        <Zap className="w-4 h-4 text-primary" /> AI Auto-Fix
                      </Button>
                      <Button variant="secondary" className="gap-2 h-11 font-bold text-xs" onClick={runAIAutoCrop} disabled={!imageSrc || isProcessing}>
                        <Wand2 className="w-4 h-4 text-accent" /> AI Crop
                      </Button>
                    </div>

                    <div className="space-y-6 py-4 border-y">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                          <Label>Brightness</Label>
                          <span>{brightness}%</span>
                        </div>
                        <Slider value={[brightness]} min={50} max={150} onValueChange={([v]) => setBrightness(v)} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                          <Label>Contrast</Label>
                          <span>{contrast}%</span>
                        </div>
                        <Slider value={[contrast]} min={50} max={150} onValueChange={([v]) => setContrast(v)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Rotate Base</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setRotation(r => r - 90)}><RotateCcw className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setRotation(r => r + 90)}><RotateCw className="w-4 h-4" /></Button>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button className="w-full h-14 text-sm font-black rounded-2xl gap-2" onClick={() => setCurrentStep('size')} disabled={!imageSrc}>
                        Next: Sizes & Border <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="size" className="mt-0 space-y-6">
                  <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">Select Standard Size</Label>
                        <Select value={stagedPhotoSize.id} onValueChange={(v) => {
                          const size = PHOTO_SIZES.find(s => s.id === v) || PHOTO_SIZES[1];
                          setStagedPhotoSize(JSON.parse(JSON.stringify(size)));
                        }}>
                          <SelectTrigger className="h-12 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PHOTO_SIZES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Manual Dimension Inputs for Custom Size */}
                      {stagedPhotoSize.id === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Width (mm)</Label>
                            <Input 
                              type="number" 
                              value={stagedPhotoSize.width} 
                              onChange={(e) => setStagedPhotoSize({ ...stagedPhotoSize, width: parseFloat(e.target.value) || 0 })}
                              className="h-11 font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Height (mm)</Label>
                            <Input 
                              type="number" 
                              value={stagedPhotoSize.height} 
                              onChange={(e) => setStagedPhotoSize({ ...stagedPhotoSize, height: parseFloat(e.target.value) || 0 })}
                              className="h-11 font-bold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between text-[10px] font-black uppercase opacity-40">
                          <Label>Border Stroke (px)</Label>
                          <span>{stagedStrokeWidth}px</span>
                        </div>
                        <Slider value={[stagedStrokeWidth]} min={0} max={10} step={1} onValueChange={([v]) => setStagedStrokeWidth(v)} />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase opacity-40">Stroke Color</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {QUICK_COLORS.map(color => (
                            <button
                              key={color.name}
                              className={cn(
                                "h-8 rounded-lg border-2 transition-all",
                                stagedStrokeColor === color.value ? "border-primary scale-110" : "border-transparent"
                              )}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setStagedStrokeColor(color.value)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col gap-2">
                         <Button className="w-full h-14 text-sm font-black rounded-2xl gap-2" onClick={addToCanvas} disabled={!imageSrc || isProcessing}>
                          {isProcessing ? "Processing..." : <>Confirm & Add To Layout <Plus className="w-4 h-4" /></>}
                         </Button>
                      </div>
                  </div>
                </TabsContent>

                <TabsContent value="canvas" className="mt-0 space-y-6">
                  <div className="space-y-6">
                      {/* Unified Side Controls for selected image */}
                      {selectedItemId && (
                        <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-primary block">Precise Adjustment</Label>
                          <div className="flex flex-col items-center gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => nudgeItem('up')}><ChevronUp className="w-5 h-5" /></Button>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => nudgeItem('left')}><ChevronLeftIcon className="w-5 h-5" /></Button>
                              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border-2 border-primary/20">
                                <Move className="w-4 h-4 text-primary" />
                              </div>
                              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => nudgeItem('right')}><ChevronRightIcon className="w-5 h-5" /></Button>
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => nudgeItem('down')}><ChevronDown className="w-5 h-5" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" className="h-11 gap-2 text-xs font-bold" onClick={duplicateSelected}>
                              <Copy className="w-4 h-4" /> Duplicate
                            </Button>
                            <Button variant="outline" className="h-11 gap-2 text-xs font-bold" onClick={() => rotateItem(selectedItemId)}>
                              <RotateCw className="w-4 h-4" /> Rotate
                            </Button>
                            <Button variant="destructive" className="h-11 gap-2 text-xs font-bold col-span-2" onClick={deleteSelected}>
                              <Trash2 className="w-4 h-4" /> Delete Layer
                            </Button>
                          </div>
                          <Button variant="secondary" className="w-full h-10 gap-2 text-xs font-bold" onClick={() => setSelectedItemId(null)}>
                             <Check className="w-4 h-4" /> Deselect
                          </Button>
                        </div>
                      )}

                      <div className="space-y-4 pt-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">Paper Setup</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2 col-span-2">
                            <Label className="text-xs font-bold">Paper Size</Label>
                            <Select value={paperSize} onValueChange={(v: PaperSizeKey) => setPaperSize(v)}>
                              <SelectTrigger className="h-11 font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PAPER_SIZES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant={orientation === 'portrait' ? 'default' : 'outline'} className="h-11 rounded-xl font-bold text-xs" onClick={() => setOrientation('portrait')}>Portrait</Button>
                          <Button variant={orientation === 'landscape' ? 'default' : 'outline'} className="h-11 rounded-xl font-bold text-xs" onClick={() => setOrientation('landscape')}>Landscape</Button>
                        </div>
                      </div>

                      <div className="pt-6 border-t space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-40">Batch Duplication</Label>
                          <div className="flex gap-2">
                            <Input 
                              type="number" 
                              className="h-12 font-bold text-center w-20" 
                              value={addQuantity} 
                              min={1}
                              max={100}
                              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)} 
                            />
                            <Button variant="secondary" className="h-12 flex-1 gap-2 font-black text-xs uppercase" onClick={quickDuplicate} disabled={items.length === 0}>
                              <Copy className="w-4 h-4" /> Add Copies
                            </Button>
                          </div>
                          <Button variant="secondary" className="w-full h-12 gap-2 font-black text-xs uppercase" onClick={fillPage} disabled={items.length === 0}>
                            <LayoutGrid className="w-4 h-4" /> Fill Page Grid
                          </Button>
                        </div>

                        <Button variant="secondary" className="w-full h-12 gap-2 font-black text-xs uppercase" onClick={() => autoArrange()} disabled={items.length === 0}>
                          <Grid className="w-4 h-4" /> Smart Auto-Arrange
                        </Button>
                        
                        <div className="flex gap-2">
                           <Button variant="outline" className="flex-1 h-11 gap-2 text-xs font-bold" onClick={undo} disabled={history.length === 0}>
                              <Undo2 className="w-4 h-4" /> Undo
                           </Button>
                        </div>
                      </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {imageSrc && (
          <ImageProcessor
            imageSrc={imageSrc}
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            rotation={rotation}
            triggerProcess={triggerProcess}
            onProcessed={handleProcessedImage}
          />
        )}
      </div>
    </>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
