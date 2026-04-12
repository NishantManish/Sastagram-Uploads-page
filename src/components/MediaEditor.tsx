import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Music, Smile, Sparkles, Trash2, ChevronRight, MoreHorizontal, RotateCcw, Maximize2, Type, Layers, Wand2, X, Undo, Redo, RotateCw, Trash, ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine, Search, Sliders, Crop, FlipHorizontal, Pencil, Eraser, Scissors, Palette } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useGesture } from '@use-gesture/react';
import TextEditor, { TextStyle, getFontClass, getBgColor, getTextShadow, getWebkitTextStroke } from './TextEditor';
import { MediaItem } from './MediaSelector';

export type EditorElement = {
  id: string;
  type: 'text' | 'sticker';
  content: string;
  style?: TextStyle;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width?: number;
};

export type DrawingPath = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  type: 'brush' | 'neon' | 'blur';
};

export type EditorState = {
  elements: EditorElement[];
  filter: string;
  baseRotation: number;
  baseFlipH: boolean;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: string;
  };
  trim: { start: number; end: number };
  drawings: DrawingPath[];
};

interface MediaEditorProps {
  mediaItems: MediaItem[];
  postType: 'post' | 'story' | 'reel';
  onNext: (images: string[]) => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

const STICKER_DATA = [
  { emoji: '🔥', keywords: ['fire', 'hot', 'lit', 'flame'] },
  { emoji: '❤️', keywords: ['heart', 'love', 'like'] },
  { emoji: '😂', keywords: ['laugh', 'cry', 'funny', 'haha', 'lol'] },
  { emoji: '✨', keywords: ['sparkle', 'magic', 'stars', 'shiny'] },
  { emoji: '🎉', keywords: ['party', 'celebrate', 'tada', 'yay'] },
  { emoji: '👍', keywords: ['thumbs', 'up', 'good', 'yes', 'approve'] },
  { emoji: '👀', keywords: ['eyes', 'look', 'see', 'watch'] },
  { emoji: '💯', keywords: ['100', 'hundred', 'perfect', 'score'] },
  { emoji: '🙌', keywords: ['hands', 'praise', 'yay', 'celebrate'] },
  { emoji: '🚀', keywords: ['rocket', 'launch', 'space', 'moon'] },
  { emoji: '🥺', keywords: ['plead', 'puppy', 'eyes', 'sad', 'cute'] },
  { emoji: '😎', keywords: ['cool', 'glasses', 'sunglasses', 'smile'] },
  { emoji: '🌈', keywords: ['rainbow', 'colors', 'pride', 'weather'] },
  { emoji: '🍕', keywords: ['pizza', 'food', 'slice', 'eat'] },
  { emoji: '🥑', keywords: ['avocado', 'food', 'healthy', 'green'] },
  { emoji: '🎮', keywords: ['game', 'controller', 'play', 'videogame'] }
];

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Vintage', value: 'sepia(0.5) contrast(1.2) saturate(1.5)' },
  { name: 'B&W', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Warm', value: 'sepia(0.3) saturate(1.5) hue-rotate(-10deg)' },
  { name: 'Cool', value: 'saturate(1.2) hue-rotate(10deg) contrast(1.1)' },
  { name: 'Contrast', value: 'contrast(1.5)' },
  { name: 'Blur', value: 'blur(2px)' },
  { name: 'Fade', value: 'opacity(0.8) contrast(0.8) saturate(0.8)' },
  { name: 'Vibrant', value: 'saturate(2) contrast(1.1)' },
  { name: 'Noir', value: 'grayscale(100%) contrast(1.5) brightness(0.8)' },
  { name: 'Retro', value: 'sepia(0.4) hue-rotate(-30deg) saturate(1.2) contrast(1.1)' },
  { name: 'Dream', value: 'blur(1px) saturate(1.5) brightness(1.1)' },
];

export default function MediaEditor({ mediaItems, postType, onNext, onBack, showToast }: MediaEditorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMedia = mediaItems[currentIndex];
  const [mediaAspectRatios, setMediaAspectRatios] = useState<number[]>(mediaItems.map(() => 4/5));

  // Initialize states for each media item
  const [mediaStates, setMediaStates] = useState<EditorState[]>(mediaItems.map(() => ({
    elements: [],
    filter: 'none',
    baseRotation: 0,
    baseFlipH: false,
    crop: { x: 0, y: 0, width: 100, height: 100, aspectRatio: 'original' },
    trim: { start: 0, end: 100 },
    drawings: []
  })));

  const [history, setHistory] = useState<EditorState[][]>(mediaItems.map(() => ([{ 
    elements: [], 
    filter: 'none',
    baseRotation: 0,
    baseFlipH: false,
    crop: { x: 0, y: 0, width: 100, height: 100, aspectRatio: 'original' },
    trim: { start: 0, end: 100 },
    drawings: []
  }])));
  const [historyIndices, setHistoryIndices] = useState<number[]>(mediaItems.map(() => 0));

  const currentState = mediaStates[currentIndex];
  const elements = currentState.elements;
  const currentFilter = currentState.filter;
  const baseRotation = currentState.baseRotation;
  const baseFlipH = currentState.baseFlipH;
  const crop = currentState.crop;
  const trim = currentState.trim;
  const drawings = currentState.drawings;

  const historyIndex = historyIndices[currentIndex];
  const currentHistory = history[currentIndex];

  const [isEditingText, setIsEditingText] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [brushType, setBrushType] = useState<'brush' | 'neon' | 'blur'>('brush');
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trashActive, setTrashActive] = useState(false);
  const [showCenterGuide, setShowCenterGuide] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [stickerSearch, setStickerSearch] = useState('');
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<SVGSVGElement>(null);

  const updateCurrentState = (updates: Partial<EditorState>) => {
    setMediaStates(prev => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], ...updates };
      return next;
    });
  };

  const pushToHistory = (newState: EditorState) => {
    setHistory(prev => {
      const next = [...prev];
      const itemHistory = next[currentIndex].slice(0, historyIndices[currentIndex] + 1);
      itemHistory.push(JSON.parse(JSON.stringify(newState)));
      if (itemHistory.length > 30) itemHistory.shift();
      next[currentIndex] = itemHistory;
      return next;
    });
    setHistoryIndices(prev => {
      const next = [...prev];
      next[currentIndex] = Math.min(29, history[currentIndex].slice(0, historyIndices[currentIndex] + 1).length);
      return next;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = currentHistory[historyIndex - 1];
      updateCurrentState(prevState);
      setHistoryIndices(prev => {
        const next = [...prev];
        next[currentIndex] = historyIndex - 1;
        return next;
      });
      showToast('Undo');
    }
  };

  const redo = () => {
    if (historyIndex < currentHistory.length - 1) {
      const nextState = currentHistory[historyIndex + 1];
      updateCurrentState(nextState);
      setHistoryIndices(prev => {
        const next = [...prev];
        next[currentIndex] = historyIndex + 1;
        return next;
      });
      showToast('Redo');
    }
  };

  const handleRotateBase = () => {
    const newRotation = (baseRotation + 90) % 360;
    const newState = { ...currentState, baseRotation: newRotation };
    updateCurrentState({ baseRotation: newRotation });
    pushToHistory(newState);
    showToast('Rotated 90°');
  };

  const handleFlipBase = () => {
    const newFlip = !baseFlipH;
    const newState = { ...currentState, baseFlipH: newFlip };
    updateCurrentState({ baseFlipH: newFlip });
    pushToHistory(newState);
    showToast('Flipped Horizontally');
  };

  const handleApplyCrop = (newCrop: typeof crop) => {
    const newState = { ...currentState, crop: newCrop };
    updateCurrentState({ crop: newCrop });
    setIsCropping(false);
    pushToHistory(newState);
    showToast('Crop Applied');
  };

  const handleDrawingStart = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPath: DrawingPath = {
      id: Date.now().toString(),
      points: [{ x, y }],
      color: brushColor,
      size: brushSize,
      type: brushType
    };
    setCurrentPath(newPath);
  };

  const drawingFrameRef = useRef<number | null>(null);
  const handleDrawingMove = (e: React.PointerEvent) => {
    if (!isDrawing || !currentPath) return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (drawingFrameRef.current) cancelAnimationFrame(drawingFrameRef.current);
    
    drawingFrameRef.current = requestAnimationFrame(() => {
      setCurrentPath(prev => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, { x, y }]
        };
      });
    });
  };

  const handleDrawingEnd = () => {
    if (!isDrawing || !currentPath) return;
    const newDrawings = [...drawings, currentPath];
    const newState = { ...currentState, drawings: newDrawings };
    updateCurrentState({ drawings: newDrawings });
    pushToHistory(newState);
    setCurrentPath(null);
  };

  const handleAddText = () => {
    setEditingElementId(null);
    setIsEditingText(true);
  };

  const handleTextDone = (text: string, style: TextStyle) => {
    setIsEditingText(false);
    if (!text.trim()) {
      if (editingElementId) {
        const newElements = elements.filter(e => e.id !== editingElementId);
        updateCurrentState({ elements: newElements });
        pushToHistory({ ...currentState, elements: newElements });
      }
      return;
    }

    if (editingElementId) {
      const newElements = elements.map(e => e.id === editingElementId ? { ...e, content: text, style } : e);
      updateCurrentState({ elements: newElements });
      pushToHistory({ ...currentState, elements: newElements });
    } else {
      const newEl: EditorElement = {
        id: Date.now().toString(),
        type: 'text',
        content: text,
        style,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      };
      const newElements = [...elements, newEl];
      updateCurrentState({ elements: newElements });
      pushToHistory({ ...currentState, elements: newElements });
      setActiveElementId(newEl.id);
    }
  };

  const handleAddSticker = (sticker: string) => {
    const newEl: EditorElement = {
      id: Date.now().toString(),
      type: 'sticker',
      content: sticker,
      x: 0,
      y: 0,
      scale: 2,
      rotation: 0
    };
    const newElements = [...elements, newEl];
    updateCurrentState({ elements: newElements });
    pushToHistory({ ...currentState, elements: newElements });
    setActiveElementId(newEl.id);
    setIsStickerDrawerOpen(false);
  };

  const handleDragStart = (id: string) => {
    setIsDragging(true);
    setActiveElementId(id);
  };

  const handleDrag = (e: any, info: any) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const trashY = rect.height - 150;
      if (info.point.y > trashY) {
        setTrashActive(true);
      } else {
        setTrashActive(false);
      }

      const centerX = rect.left + rect.width / 2;
      if (Math.abs(info.point.x - centerX) < 15) {
        setShowCenterGuide(true);
      } else {
        setShowCenterGuide(false);
      }
    }
  };

  const handleDragEnd = (id: string, e: any, info: any) => {
    setIsDragging(false);
    setShowCenterGuide(false);
    if (trashActive) {
      const newElements = elements.filter(el => el.id !== id);
      updateCurrentState({ elements: newElements });
      pushToHistory({ ...currentState, elements: newElements });
      setTrashActive(false);
      setActiveElementId(null);
    } else {
      const newElements = elements.map(el => el.id === id ? { ...el, x: el.x + info.offset.x, y: el.y + info.offset.y } : el);
      updateCurrentState({ elements: newElements });
      pushToHistory({ ...currentState, elements: newElements });
    }
  };

  const updateElement = (id: string, updates: Partial<EditorElement>, final = true) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    updateCurrentState({ elements: newElements });
    if (final) pushToHistory({ ...currentState, elements: newElements });
  };

  const handleRotate = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element || !containerRef.current) return;

    const rect = (e.currentTarget as HTMLElement).closest('.element-container')!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = element.rotation;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let angleDiff = (currentAngle - startAngle) * 180 / Math.PI;
      let newRotation = startRotation + angleDiff;

      const snapAngles = [0, 90, 180, 270, 360, -90, -180, -270, -360];
      for (const snapAngle of snapAngles) {
        if (Math.abs(newRotation - snapAngle) < 5) {
          newRotation = snapAngle;
          break;
        }
      }

      updateElement(id, { rotation: newRotation }, false);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      const finalElements = elements.map(el => el.id === id ? { ...el } : el);
      pushToHistory(finalElements);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleScale = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element || !containerRef.current) return;

    const rect = (e.currentTarget as HTMLElement).closest('.element-container')!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const startScale = element.scale;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentDist = Math.hypot(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const scaleRatio = currentDist / startDist;
      const newScale = Math.max(0.2, startScale * scaleRatio);
      updateElement(id, { scale: newScale }, false);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      const finalElements = elements.map(el => el.id === id ? { ...el } : el);
      pushToHistory(finalElements);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleWidth = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element || !containerRef.current) return;

    const rect = (e.currentTarget as HTMLElement).closest('.element-container')!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elementAngle = element.rotation * Math.PI / 180;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const localX = dx * Math.cos(-elementAngle) - dy * Math.sin(-elementAngle);
      const newWidth = Math.max(50, (Math.abs(localX) * 2) / element.scale);
      updateElement(id, { width: newWidth }, false);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      const finalElements = elements.map(el => el.id === id ? { ...el } : el);
      pushToHistory(finalElements);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleDelete = (id: string, e: any) => {
    e.stopPropagation();
    const newElements = elements.filter(el => el.id !== id);
    updateCurrentState({ elements: newElements });
    pushToHistory({ ...currentState, elements: newElements });
    setActiveElementId(null);
  };

  const bringToFront = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index < 0 || index === elements.length - 1) return;
    const newEls = [...elements];
    const [el] = newEls.splice(index, 1);
    newEls.push(el);
    updateCurrentState({ elements: newEls });
    pushToHistory({ ...currentState, elements: newEls });
  };

  const sendToBack = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index <= 0) return;
    const newEls = [...elements];
    const [el] = newEls.splice(index, 1);
    newEls.unshift(el);
    updateCurrentState({ elements: newEls });
    pushToHistory({ ...currentState, elements: newEls });
  };

  const bringForward = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index < 0 || index === elements.length - 1) return;
    const newEls = [...elements];
    const temp = newEls[index];
    newEls[index] = newEls[index + 1];
    newEls[index + 1] = temp;
    updateCurrentState({ elements: newEls });
    pushToHistory({ ...currentState, elements: newEls });
  };

  const sendBackward = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index <= 0) return;
    const newEls = [...elements];
    const temp = newEls[index];
    newEls[index] = newEls[index - 1];
    newEls[index - 1] = temp;
    updateCurrentState({ elements: newEls });
    pushToHistory({ ...currentState, elements: newEls });
  };

  const bindElementGestures = (id: string) => {
    return useGesture(
      {
        onPinch: ({ offset: [d, a] }) => {
          updateElement(id, { scale: d, rotation: a }, false);
        },
      },
      {
        target: containerRef,
        eventOptions: { passive: false },
        pinch: {
          from: () => {
            const el = elements.find(e => e.id === id);
            return [el?.scale || 1, el?.rotation || 0];
          }
        }
      }
    );
  };

  const [isReviewing, setIsReviewing] = useState(false);
  const [processedImages, setProcessedImages] = useState<string[]>([]);

  const handleNextStep = async () => {
    const results: string[] = [];
    
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const state = mediaStates[i];
      
      if (item.type === 'video') {
        results.push(item.url);
        continue;
      }

      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.url;

      await new Promise((resolve) => {
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            results.push(item.url);
            resolve(null);
            return;
          }

          const cropW = (state.crop.width / 100) * img.width;
          const cropH = (state.crop.height / 100) * img.height;
          const cropX = (state.crop.x / 100) * img.width;
          const cropY = (state.crop.y / 100) * img.height;

          const isRotated = state.baseRotation === 90 || state.baseRotation === 270;
          canvas.width = isRotated ? cropH : cropW;
          canvas.height = isRotated ? cropW : cropH;

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((state.baseRotation * Math.PI) / 180);
          ctx.scale(state.baseFlipH ? -1 : 1, 1);

          if (state.filter !== 'none') {
            ctx.filter = state.filter;
          }

          ctx.drawImage(
            img,
            cropX, cropY, cropW, cropH,
            -cropW / 2, -cropH / 2, cropW, cropH
          );

          // Draw drawings
          state.drawings.forEach(path => {
            ctx.beginPath();
            ctx.strokeStyle = path.color;
            ctx.lineWidth = (path.size / 100) * Math.max(cropW, cropH);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (path.type === 'neon') {
              ctx.shadowBlur = 10;
              ctx.shadowColor = path.color;
            } else if (path.type === 'blur') {
              ctx.filter = 'blur(2px)';
            } else {
              ctx.shadowBlur = 0;
              ctx.filter = 'none';
            }
            
            path.points.forEach((p, idx) => {
              const px = (p.x / 100) * cropW - cropW / 2;
              const py = (p.y / 100) * cropH - cropH / 2;
              if (idx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.filter = 'none';
            ctx.shadowBlur = 0;
          });

          // Draw Elements (Stickers and Text)
          const previewRect = drawingCanvasRef.current?.getBoundingClientRect();
          const previewWidth = previewRect?.width || 1;
          const scaleFactor = canvas.width / previewWidth;

          state.elements.forEach(el => {
            ctx.save();
            // Translate to center of canvas first, then apply element offset
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.translate(el.x * scaleFactor, el.y * scaleFactor);
            ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.scale(el.scale, el.scale);

            if (el.type === 'sticker') {
              ctx.font = '80px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(el.content, 0, 0);
            } else if (el.type === 'text' && el.style) {
              const fontSize = el.style.fontSize;
              ctx.font = `bold ${fontSize}px Arial`; // Simplified font mapping
              ctx.textAlign = el.style.alignment;
              ctx.textBaseline = 'middle';
              
              const lines = el.content.split('\n');
              const lineHeight = fontSize * 1.2;
              
              // Draw background if any
              if (el.style.background !== 'none') {
                ctx.fillStyle = getBgColor(el.style);
                const maxWidth = el.width ? el.width : Math.max(...lines.map(l => ctx.measureText(l).width)) + 20;
                const totalHeight = lines.length * lineHeight + 10;
                ctx.fillRect(-maxWidth / 2, -totalHeight / 2, maxWidth, totalHeight);
              }

              ctx.fillStyle = el.style.color;
              
              // Handle effects
              if (el.style.effect === 'shadow') {
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 4;
              } else if (el.style.effect === 'glow') {
                ctx.shadowColor = el.style.color;
                ctx.shadowBlur = 15;
              }

              lines.forEach((line, index) => {
                const yOffset = (index - (lines.length - 1) / 2) * lineHeight;
                ctx.fillText(line, 0, yOffset);
              });
            }
            ctx.restore();
          });

          ctx.restore();
          results.push(canvas.toDataURL('image/jpeg', 0.9));
          resolve(null);
        };
        img.onerror = () => {
          results.push(item.url);
          resolve(null);
        };
      });
    }
    
    setProcessedImages(results);
    setIsReviewing(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-screen overflow-hidden" ref={containerRef}>
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">Editor</h1>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{currentIndex + 1} of {mediaItems.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mediaItems.length > 1 && (
            <div className="flex items-center bg-zinc-900 rounded-full p-1 mr-4">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={`p-2 rounded-full transition-colors ${currentIndex === 0 ? 'text-zinc-600' : 'hover:bg-zinc-800 text-white'}`}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(mediaItems.length - 1, prev + 1))}
                disabled={currentIndex === mediaItems.length - 1}
                className={`p-2 rounded-full transition-colors ${currentIndex === mediaItems.length - 1 ? 'text-zinc-600' : 'hover:bg-zinc-800 text-white'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          <div className="flex items-center bg-zinc-900 rounded-full p-1 mr-2">
            <button 
              onClick={undo} 
              disabled={historyIndex === 0}
              className={`p-2 rounded-full transition-colors ${historyIndex === 0 ? 'text-zinc-600' : 'hover:bg-zinc-800 text-white'}`}
            >
              <Undo size={20} />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex === history.length - 1}
              className={`p-2 rounded-full transition-colors ${historyIndex === history.length - 1 ? 'text-zinc-600' : 'hover:bg-zinc-800 text-white'}`}
            >
              <Redo size={20} />
            </button>
          </div>
          <button onClick={() => showToast('Auto-enhance applied')} className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400"><Wand2 size={20} /></button>
          
          {activeElementId ? (
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
              <button onClick={() => bringToFront(activeElementId)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Bring to Front"><ArrowUpToLine size={18} /></button>
              <button onClick={() => bringForward(activeElementId)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Bring Forward"><ArrowUp size={18} /></button>
              <button onClick={() => sendBackward(activeElementId)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Send Backward"><ArrowDown size={18} /></button>
              <button onClick={() => sendToBack(activeElementId)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Send to Back"><ArrowDownToLine size={18} /></button>
            </div>
          ) : (
            <button onClick={() => showToast('Select an element to arrange layers')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><Layers size={20} /></button>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 bg-black relative flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden">
          <div 
            className="w-full max-w-lg bg-zinc-900 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative"
            style={{ aspectRatio: mediaAspectRatios[currentIndex] } as any}
          >
            <div 
              className="w-full h-full transition-all duration-300"
              style={{
                transform: `rotate(${baseRotation}deg) scaleX(${baseFlipH ? -1 : 1})`,
                clipPath: crop.aspectRatio === 'original' ? 'none' : `inset(${crop.y}% ${100 - (crop.x + crop.width)}% ${100 - (crop.y + crop.height)}% ${crop.x}%)`,
                aspectRatio: mediaAspectRatios[currentIndex]
              }}
            >
              {currentMedia.type === 'video' ? (
                <video 
                  src={currentMedia.url} 
                  className="w-full h-full object-cover pointer-events-none select-none" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    const ratio = video.videoWidth / video.videoHeight;
                    setMediaAspectRatios(prev => {
                      const next = [...prev];
                      next[currentIndex] = ratio;
                      return next;
                    });
                  }}
                  style={{ filter: currentFilter }}
                />
              ) : (
                <img 
                  src={currentMedia.url} 
                  alt="Media" 
                  className="w-full h-full object-cover pointer-events-none select-none" 
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const ratio = img.naturalWidth / img.naturalHeight;
                    setMediaAspectRatios(prev => {
                      const next = [...prev];
                      next[currentIndex] = ratio;
                      return next;
                    });
                  }}
                  style={{ filter: currentFilter }}
                />
              )}
            </div>

            {/* Drawing Layer */}
            <svg 
              ref={drawingCanvasRef}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className={`absolute inset-0 z-20 pointer-events-auto ${isDrawing ? 'cursor-crosshair' : 'pointer-events-none'}`}
              onPointerDown={handleDrawingStart}
              onPointerMove={handleDrawingMove}
              onPointerUp={handleDrawingEnd}
              onPointerLeave={handleDrawingEnd}
            >
              {drawings.map(path => (
                <polyline
                  key={path.id}
                  points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={path.color}
                  strokeWidth={path.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: path.type === 'neon' ? 'drop-shadow(0 0 5px currentColor)' : path.type === 'blur' ? 'blur(2px)' : 'none' }}
                />
              ))}
              {currentPath && (
                <polyline
                  points={currentPath.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={currentPath.color}
                  strokeWidth={currentPath.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: currentPath.type === 'neon' ? 'drop-shadow(0 0 5px currentColor)' : currentPath.type === 'blur' ? 'blur(2px)' : 'none' }}
                />
              )}
            </svg>
            
            {/* Elements Layer */}
            <div className="absolute inset-0 overflow-hidden">
              {elements.map(el => (
                <EditorElementItem
                  key={el.id}
                  el={el}
                  isActive={activeElementId === el.id}
                  isDragging={isDragging}
                  onDragStart={() => handleDragStart(el.id)}
                  onDrag={handleDrag}
                  onDragEnd={(e, info) => handleDragEnd(el.id, e, info)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElementId(el.id);
                  }}
                  onDoubleClick={() => {
                    if (el.type === 'text') {
                      setEditingElementId(el.id);
                      setIsEditingText(true);
                    }
                  }}
                  onUpdate={updateElement}
                  onDelete={handleDelete}
                  onRotate={handleRotate}
                  onScale={handleScale}
                  onWidth={handleWidth}
                  containerRef={containerRef}
                />
              ))}
            </div>

            {/* Guides */}
            <AnimatePresence>
              {showCenterGuide && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-blue-500/50 z-20 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Thumbnail Bar */}
          {mediaItems.length > 1 && (
            <div className="mt-8 flex gap-3 p-2 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${currentIndex === idx ? 'ring-2 ring-blue-500 scale-110 z-10' : 'opacity-50 hover:opacity-100'}`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  )}
                  <div className="absolute top-1 right-1 bg-black/50 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Trash Area */}
          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50"
              >
                <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${trashActive ? 'scale-125' : 'scale-100'}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border-2 transition-colors ${trashActive ? 'bg-red-500 border-red-400' : 'bg-zinc-900/80 border-zinc-700'}`}>
                    <Trash2 size={32} className="text-white" />
                  </div>
                  <span className={`text-xs font-bold tracking-widest uppercase ${trashActive ? 'text-red-400' : 'text-zinc-500'}`}>
                    {trashActive ? 'Release to Delete' : 'Drag here to remove'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Tools & Actions */}
        <div className="flex flex-col bg-zinc-950 z-40 border-t border-zinc-800/50">
          {isDrawing && (
            <div className="px-6 py-4 flex items-center gap-6 border-b border-zinc-800/50 bg-zinc-900/50 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${brushColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="flex gap-4 items-center">
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={brushSize} 
                  onChange={e => setBrushSize(parseInt(e.target.value))}
                  className="w-32 accent-blue-500"
                />
                <span className="text-[10px] font-bold text-zinc-500 w-4">{brushSize}</span>
              </div>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="flex gap-2">
                {(['brush', 'neon', 'blur'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setBrushType(t)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${brushType === t ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  const newDrawings = drawings.slice(0, -1);
                  updateCurrentState({ drawings: newDrawings });
                  pushToHistory({ ...currentState, drawings: newDrawings });
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          )}

          {isTrimming && currentMedia.type === 'video' && (
            <div className="px-8 py-6 flex flex-col gap-4 border-b border-zinc-800/50 bg-zinc-900/50">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trim Video</span>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-blue-400">{trim.start}%</span>
                  <span className="text-[10px] font-bold text-zinc-600">-</span>
                  <span className="text-[10px] font-bold text-blue-400">{trim.end}%</span>
                </div>
              </div>
              <div className="relative h-12 bg-zinc-800 rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-y-0 bg-blue-600/30 border-x-4 border-blue-500 z-10"
                  style={{ left: `${trim.start}%`, right: `${100 - trim.end}%` }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max={trim.end - 1} 
                  value={trim.start} 
                  onChange={e => updateCurrentState({ trim: { ...trim, start: parseInt(e.target.value) } })}
                  className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                />
                <input 
                  type="range" 
                  min={trim.start + 1} 
                  max="100" 
                  value={trim.end} 
                  onChange={e => updateCurrentState({ trim: { ...trim, end: parseInt(e.target.value) } })}
                  className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                />
              </div>
            </div>
          )}

          <aside className="w-full flex flex-row items-center justify-start md:justify-center px-6 py-4 gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            <ToolButton icon={<Type size={24} />} label="Text" onClick={handleAddText} />
            <ToolButton icon={<Smile size={24} />} label="Stickers" onClick={() => setIsStickerDrawerOpen(true)} />
            <ToolButton icon={<Pencil size={24} />} label="Draw" active={isDrawing} onClick={() => setIsDrawing(!isDrawing)} />
            <ToolButton icon={<Sparkles size={24} />} label="Filters" onClick={() => setIsFilterDrawerOpen(true)} />
            <ToolButton icon={<Crop size={24} />} label="Crop" onClick={() => setIsCropping(true)} />
            {currentMedia.type === 'video' && (
              <ToolButton icon={<Scissors size={24} />} label="Trim" active={isTrimming} onClick={() => setIsTrimming(!isTrimming)} />
            )}
            <ToolButton icon={<RotateCw size={24} />} label="Rotate" onClick={handleRotateBase} />
            <ToolButton icon={<FlipHorizontal size={24} />} label="Flip" onClick={handleFlipBase} />
            <ToolButton icon={<Music size={24} />} label="Music" onClick={() => showToast('Music library...')} />
          </aside>

          {/* Quick Actions Footer */}
          <footer className="p-4 border-t border-zinc-800/50 flex items-center justify-end gap-4">
            {postType === 'story' && (
              <>
                <button onClick={() => { showToast('Posted to Story!'); onBack(); }} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">Your Story</button>
                <button onClick={() => { showToast('Posted to Close Friends!'); onBack(); }} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-full text-sm font-bold transition-colors">Close Friends</button>
              </>
            )}
            {postType === 'post' && (
              <button onClick={handleNextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                Review <ChevronRight size={18} />
              </button>
            )}
            {postType === 'reel' && (
              <button onClick={handleNextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                Review <ChevronRight size={18} />
              </button>
            )}
          </footer>
        </div>

      {/* Sticker Drawer */}
      <AnimatePresence>
        {isStickerDrawerOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 h-3/4 bg-zinc-900 rounded-t-[3rem] z-[100] flex flex-col shadow-[0_-20px_80px_rgba(0,0,0,0.8)] border-t border-white/10"
          >
            <div className="w-full flex justify-center p-4">
              <div className="w-16 h-1.5 bg-zinc-700 rounded-full" />
            </div>
            <div className="px-8 py-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black tracking-tight">Stickers</h3>
                <button onClick={() => setIsStickerDrawerOpen(false)} className="p-2 bg-zinc-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Search stickers..." 
                  value={stickerSearch}
                  onChange={e => setStickerSearch(e.target.value)}
                  className="w-full bg-zinc-800 text-white rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-6 content-start no-scrollbar">
              {stickerSearch && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddSticker(stickerSearch)}
                  className="col-span-4 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 text-xl"
                >
                  Add "{stickerSearch}"
                </motion.button>
              )}
              {STICKER_DATA.filter(s => 
                s.keywords.some(k => k.includes(stickerSearch.toLowerCase())) || 
                s.emoji.includes(stickerSearch)
              ).map(s => (
                <motion.button 
                  key={s.emoji} 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddSticker(s.emoji)}
                  className="text-6xl flex items-center justify-center aspect-square bg-zinc-800/30 rounded-3xl hover:bg-zinc-800/60 transition-colors"
                >
                  {s.emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 h-1/2 bg-zinc-900 rounded-t-[3rem] z-[100] flex flex-col shadow-[0_-20px_80px_rgba(0,0,0,0.8)] border-t border-white/10"
          >
            <div className="w-full flex justify-center p-4">
              <div className="w-16 h-1.5 bg-zinc-700 rounded-full" />
            </div>
            <div className="px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight">Filters</h3>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 bg-zinc-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-x-auto p-8 flex gap-6 items-center no-scrollbar">
              {FILTERS.map(filter => (
                <button
                  key={filter.name}
                  onClick={() => {
                    updateCurrentState({ filter: filter.value });
                    pushToHistory({ ...currentState, filter: filter.value });
                  }}
                  className="flex flex-col items-center gap-3 min-w-[100px] group"
                >
              <div className={`w-20 h-20 rounded-2xl overflow-hidden ring-2 transition-all ${currentFilter === filter.value ? 'ring-blue-500 ring-offset-4 ring-offset-zinc-900 scale-110' : 'ring-transparent hover:ring-zinc-500'}`}>
                {currentMedia.type === 'video' ? (
                  <video 
                    src={currentMedia.url} 
                    className="w-full h-full object-cover"
                    style={{ filter: filter.value }}
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={currentMedia.url} 
                    alt={filter.name} 
                    className="w-full h-full object-cover"
                    style={{ filter: filter.value }}
                  />
                )}
              </div>
                  <span className={`text-xs font-bold tracking-widest uppercase ${currentFilter === filter.value ? 'text-blue-400' : 'text-zinc-400 group-hover:text-white'}`}>
                    {filter.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Overlay */}
      <AnimatePresence>
        {isCropping && (
          <CropOverlay 
            media={currentMedia.url} 
            mediaType={currentMedia.type}
            initialCrop={crop}
            mediaAspectRatio={mediaAspectRatios[currentIndex]}
            onApply={handleApplyCrop}
            onCancel={() => setIsCropping(false)}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[300] flex flex-col"
          >
            <header className="p-6 flex justify-between items-center border-b border-zinc-800">
              <button onClick={() => setIsReviewing(false)} className="text-blue-500 font-bold text-lg">Edit</button>
              <h3 className="text-lg font-bold">Final Review</h3>
              <button onClick={() => onNext(processedImages)} className="px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-600/20">Confirm</button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {processedImages.map((img, idx) => (
                <div key={idx} className="space-y-4">
                  <div 
                    className="bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                    style={{ aspectRatio: mediaAspectRatios[idx] }}
                  >
                    {mediaItems[idx].type === 'video' ? (
                      <video src={img} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={img} className="w-full h-full object-cover" alt={`Review ${idx}`} />
                    )}
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Item {idx + 1}</span>
                    <span className="text-[10px] px-2 py-1 bg-zinc-800 rounded-lg text-zinc-400 font-bold uppercase">{mediaItems[idx].type}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Editor Overlay */}
      {isEditingText && (
        <TextEditor 
          initialText={editingElementId ? elements.find(e => e.id === editingElementId)?.content : ''}
          initialStyle={editingElementId ? elements.find(e => e.id === editingElementId)?.style : undefined}
          onDone={handleTextDone}
          onCancel={() => setIsEditingText(false)}
        />
      )}
    </div>
  );
}

function EditorElementItem({ 
  el, 
  isActive, 
  isDragging, 
  onDragStart, 
  onDrag, 
  onDragEnd, 
  onClick, 
  onDoubleClick, 
  onUpdate, 
  onDelete, 
  onRotate, 
  onScale, 
  onWidth,
  containerRef
}: { 
  el: EditorElement, 
  isActive: boolean, 
  isDragging: boolean, 
  onDragStart: () => void, 
  onDrag: (e: any, info: any) => void, 
  onDragEnd: (e: any, info: any) => void, 
  onClick: (e: any) => void, 
  onDoubleClick: () => void, 
  onUpdate: (id: string, updates: Partial<EditorElement>, final?: boolean) => void,
  onDelete: (id: string, e: any) => void,
  onRotate: (id: string, e: any) => void,
  onScale: (id: string, e: any) => void,
  onWidth: (id: string, e: any) => void,
  containerRef: React.RefObject<HTMLDivElement>,
  key?: any
}) {
  const bind = useGesture(
    {
      onPinch: ({ offset: [d, a] }) => {
        onUpdate(el.id, { scale: d, rotation: a }, false);
      },
    },
    {
      pinch: {
        from: () => [el.scale, el.rotation]
      }
    }
  );

  return (
    <motion.div
      {...(bind() as any)}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: el.scale, 
        x: el.x, 
        y: el.y, 
        rotate: el.rotation,
        opacity: 1,
        zIndex: isActive ? 50 : 10
      }}
      className={`absolute cursor-grab active:cursor-grabbing group element-container ${isActive ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent rounded-lg' : ''}`}
      style={{ touchAction: 'none', left: '50%', top: '50%', x: '-50%', y: '-50%' }}
    >
      {el.type === 'text' && el.style ? (
        <div 
          className={`whitespace-pre-wrap select-none ${getFontClass(el.style.font)}`}
          style={{
            color: el.style.color,
            textAlign: el.style.alignment,
            fontSize: `${el.style.fontSize}px`,
            backgroundColor: getBgColor(el.style),
            padding: el.style.background !== 'none' ? '8px 16px' : '0',
            borderRadius: el.style.background !== 'none' ? '12px' : '0',
            textShadow: getTextShadow(el.style),
            WebkitTextStroke: getWebkitTextStroke(el.style),
            width: el.width ? `${el.width}px` : 'auto',
            minWidth: el.width ? `${el.width}px` : 'auto',
          }}
        >
          {el.content}
        </div>
      ) : (
        <div className="text-7xl drop-shadow-2xl select-none pointer-events-none">
          {el.content}
        </div>
      )}

      {isActive && !isDragging && (
        <>
          <button 
            onPointerDown={(e) => onDelete(el.id, e)}
            className="absolute -top-5 -left-5 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-white"
          >
            <Trash size={14} />
          </button>

          <div 
            onPointerDown={(e) => onRotate(el.id, e)}
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-alias z-[60] border-2 border-blue-500"
          >
            <RotateCw size={14} />
          </div>

          <div 
            onPointerDown={(e) => onScale(el.id, e)}
            className="absolute -bottom-5 -right-5 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-blue-500 cursor-nwse-resize"
          >
            <Maximize2 size={14} className="rotate-45" />
          </div>

          {el.type === 'text' && (
            <div 
              onPointerDown={(e) => onWidth(el.id, e)}
              className="absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-blue-500 cursor-ew-resize"
            >
              <div className="w-1 h-3 bg-black rounded-full" />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function ToolButton({ icon, label, onClick, active = false }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group min-w-[60px] transition-all ${active ? 'scale-110' : ''}`}
    >
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${active ? 'bg-blue-600 text-white shadow-blue-600/40' : 'bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'}`}>{label}</span>
    </button>
  );
}

interface CropOverlayProps {
  media: string;
  mediaType: 'image' | 'video';
  initialCrop: { x: number, y: number, width: number, height: number, aspectRatio: string };
  mediaAspectRatio: number;
  onApply: (crop: { x: number, y: number, width: number, height: number, aspectRatio: string }) => void;
  onCancel: () => void;
}

function CropOverlay({ media, mediaType, initialCrop, mediaAspectRatio, onApply, onCancel }: CropOverlayProps) {
  const [crop, setCrop] = useState(initialCrop);
  const ratios = [
    { label: 'Original', value: 'original' },
    { label: '1:1', value: '1:1', ratio: 1 },
    { label: '3:4', value: '3:4', ratio: 3/4 },
    { label: '4:2', value: '4:2', ratio: 4/2 },
    { label: '2:3', value: '2:3', ratio: 2/3 },
    { label: '3:2', value: '3:2', ratio: 3/2 },
    { label: '9:16', value: '9:16', ratio: 9/16 },
  ];

  const handleRatioSelect = (r: any) => {
    if (r.value === 'original') {
      setCrop({ x: 0, y: 0, width: 100, height: 100, aspectRatio: 'original' });
    } else {
      // Center a crop area with the given ratio
      let w = 80;
      let h = 80 / r.ratio;
      if (h > 80) {
        h = 80;
        w = 80 * r.ratio;
      }
      setCrop({
        x: (100 - w) / 2,
        y: (100 - h) / 2,
        width: w,
        height: h,
        aspectRatio: r.value
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[200] flex flex-col"
    >
      <header className="p-6 flex justify-between items-center">
        <button onClick={onCancel} className="text-white font-bold">Cancel</button>
        <h3 className="text-lg font-bold">Crop & Resize</h3>
        <button onClick={() => onApply(crop)} className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold">Apply</button>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-8">
        <div 
          className="w-full max-w-lg relative bg-zinc-900 rounded-2xl overflow-hidden"
          style={{ aspectRatio: mediaAspectRatio }}
        >
          {mediaType === 'video' ? (
            <video src={media} className="w-full h-full object-cover opacity-30" muted playsInline />
          ) : (
            <img src={media} className="w-full h-full object-cover opacity-30" alt="Crop Background" />
          )}
          
          {/* Crop Area */}
          <motion.div 
            drag
            dragMomentum={false}
            dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }} // This is tricky with percentages
            onDrag={(e, info) => {
              // Simple drag for now, ideally we'd constrain it
              const dx = (info.delta.x / 400) * 100; // Rough estimate
              const dy = (info.delta.y / 500) * 100;
              setCrop(prev => ({
                ...prev,
                x: Math.max(0, Math.min(100 - prev.width, prev.x + dx)),
                y: Math.max(0, Math.min(100 - prev.height, prev.y + dy))
              }));
            }}
            style={{
              position: 'absolute',
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
            className="border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10"
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => <div key={i} className="border border-white/20" />)}
            </div>
            
            {/* Handles */}
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-white rounded-sm" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-sm" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-sm" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-sm" />
          </motion.div>

          <div className="absolute inset-0 pointer-events-none">
            {mediaType === 'video' ? (
              <video 
                src={media} 
                className="w-full h-full object-cover" 
                muted 
                playsInline
                style={{ 
                  clipPath: `inset(${crop.y}% ${100 - (crop.x + crop.width)}% ${100 - (crop.y + crop.height)}% ${crop.x}%)` 
                }} 
              />
            ) : (
              <img 
                src={media} 
                className="w-full h-full object-cover" 
                style={{ 
                  clipPath: `inset(${crop.y}% ${100 - (crop.x + crop.width)}% ${100 - (crop.y + crop.height)}% ${crop.x}%)` 
                }} 
                alt="Crop Preview" 
              />
            )}
          </div>
        </div>
      </div>

      <footer className="p-8 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {ratios.map(r => (
            <button
              key={r.label}
              onClick={() => handleRatioSelect(r)}
              className={`px-6 py-2 rounded-full border transition-all whitespace-nowrap font-bold text-sm ${crop.aspectRatio === r.value ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </footer>
    </motion.div>
  );
}
