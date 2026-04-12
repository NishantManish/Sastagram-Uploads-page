import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Music, Smile, Sparkles, Trash2, ChevronRight, MoreHorizontal, RotateCcw, Maximize2, Type, Layers, Wand2, X, Undo, Redo, RotateCw, Trash, ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine, Search } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import TextEditor, { TextStyle, getFontClass, getBgColor, getTextShadow, getWebkitTextStroke } from './TextEditor';

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

interface MediaEditorProps {
  media: string;
  postType: 'post' | 'story' | 'reel';
  onNext: (image: string) => void;
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

export default function MediaEditor({ media, postType, onNext, onBack, showToast }: MediaEditorProps) {
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [history, setHistory] = useState<EditorElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trashActive, setTrashActive] = useState(false);
  const [showCenterGuide, setShowCenterGuide] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [stickerSearch, setStickerSearch] = useState('');
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const pushToHistory = (newElements: EditorElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newElements)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setElements(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
      showToast('Undo');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setElements(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
      showToast('Redo');
    }
  };

  const handleAddText = () => {
    setEditingElementId(null);
    setIsEditingText(true);
  };

  const handleTextDone = (text: string, style: TextStyle) => {
    setIsEditingText(false);
    if (!text.trim()) {
      if (editingElementId) {
        setElements(els => els.filter(e => e.id !== editingElementId));
      }
      return;
    }

    if (editingElementId) {
      const newElements = elements.map(e => e.id === editingElementId ? { ...e, content: text, style } : e);
      setElements(newElements);
      pushToHistory(newElements);
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
      setElements(newElements);
      pushToHistory(newElements);
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
    setElements(newElements);
    pushToHistory(newElements);
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
      setElements(newElements);
      pushToHistory(newElements);
      setTrashActive(false);
      setActiveElementId(null);
    } else {
      const newElements = elements.map(el => el.id === id ? { ...el, x: el.x + info.offset.x, y: el.y + info.offset.y } : el);
      setElements(newElements);
      pushToHistory(newElements);
    }
  };

  const updateElement = (id: string, updates: Partial<EditorElement>, final = true) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(newElements);
    if (final) pushToHistory(newElements);
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
    setElements(newElements);
    pushToHistory(newElements);
    setActiveElementId(null);
  };

  const bringToFront = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index < 0 || index === elements.length - 1) return;
    const newEls = [...elements];
    const [el] = newEls.splice(index, 1);
    newEls.push(el);
    setElements(newEls);
    pushToHistory(newEls);
  };

  const sendToBack = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index <= 0) return;
    const newEls = [...elements];
    const [el] = newEls.splice(index, 1);
    newEls.unshift(el);
    setElements(newEls);
    pushToHistory(newEls);
  };

  const bringForward = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index < 0 || index === elements.length - 1) return;
    const newEls = [...elements];
    const temp = newEls[index];
    newEls[index] = newEls[index + 1];
    newEls[index + 1] = temp;
    setElements(newEls);
    pushToHistory(newEls);
  };

  const sendBackward = (id: string) => {
    const index = elements.findIndex(e => e.id === id);
    if (index <= 0) return;
    const newEls = [...elements];
    const temp = newEls[index];
    newEls[index] = newEls[index - 1];
    newEls[index - 1] = temp;
    setElements(newEls);
    pushToHistory(newEls);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-screen overflow-hidden" ref={containerRef}>
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Editor</h1>
        </div>
        <div className="flex items-center gap-2">
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
      <main className="flex-1 bg-black relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <div className="w-full max-w-lg aspect-[4/5] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative">
            <img src={media} alt="Media" className="w-full h-full object-cover pointer-events-none select-none" />
            
            {/* Elements Layer */}
            <div className="absolute inset-0 overflow-hidden">
              {elements.map(el => (
                <motion.div
                  key={el.id}
                  drag
                  dragMomentum={false}
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
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: el.scale, 
                    x: el.x, 
                    y: el.y, 
                    rotate: el.rotation,
                    opacity: 1,
                    zIndex: activeElementId === el.id ? 50 : 10
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing group element-container ${activeElementId === el.id ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent rounded-lg' : ''}`}
                  style={{ touchAction: 'none' }}
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

                  {/* Manipulation Handles (Only visible when active) */}
                  {activeElementId === el.id && !isDragging && (
                    <>
                      {/* Delete Handle (Top Left) */}
                      <button 
                        onPointerDown={(e) => handleDelete(el.id, e)}
                        className="absolute -top-5 -left-5 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-white"
                      >
                        <Trash size={14} />
                      </button>

                      {/* Rotation Handle (Top Center) */}
                      <div 
                        onPointerDown={(e) => handleRotate(el.id, e)}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-alias z-[60] border-2 border-blue-500"
                      >
                        <RotateCw size={14} />
                      </div>

                      {/* Scale Handle (Bottom Right) */}
                      <div 
                        onPointerDown={(e) => handleScale(el.id, e)}
                        className="absolute -bottom-5 -right-5 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-blue-500 cursor-nwse-resize"
                      >
                        <Maximize2 size={14} className="rotate-45" />
                      </div>

                      {/* Width Handle (Right Middle) */}
                      {el.type === 'text' && (
                        <div 
                          onPointerDown={(e) => handleWidth(el.id, e)}
                          className="absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-[60] border-2 border-blue-500 cursor-ew-resize"
                        >
                          <div className="w-1 h-3 bg-black rounded-full" />
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
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
          <aside className="w-full flex flex-row items-center justify-center p-4 gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            <ToolButton icon={<Type size={24} />} label="Text" onClick={handleAddText} />
            <ToolButton icon={<Smile size={24} />} label="Stickers" onClick={() => setIsStickerDrawerOpen(true)} />
            <ToolButton icon={<Music size={24} />} label="Music" onClick={() => showToast('Music library...')} />
            <ToolButton icon={<Sparkles size={24} />} label="Effects" onClick={() => showToast('Effects...')} />
            <ToolButton icon={<MoreHorizontal size={24} />} label="More" onClick={() => showToast('More tools...')} />
          </aside>

          {/* Quick Actions Footer */}
          <footer className="p-4 border-t border-zinc-800/50 flex items-center justify-end gap-4">
            {postType === 'story' && (
              <>
                <button onClick={() => { showToast('Posted to Story!'); onBack(); }} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">Your Story</button>
                <button onClick={() => { showToast('Posted to Close Friends!'); onBack(); }} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-full text-sm font-bold transition-colors">Close Friends</button>
                <button onClick={() => onNext(media)} className="w-12 h-12 bg-white text-black hover:bg-zinc-200 rounded-full flex items-center justify-center transition-colors shadow-lg">
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            {postType === 'post' && (
              <button onClick={() => onNext(media)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                Share Post <ChevronRight size={18} />
              </button>
            )}
            {postType === 'reel' && (
              <button onClick={() => onNext(media)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                Share Reel <ChevronRight size={18} />
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

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group min-w-[60px]"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg group-hover:shadow-blue-600/40 group-hover:-translate-y-1">
        {icon}
      </div>
      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
