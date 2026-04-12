import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export type TextStyle = {
  font: string;
  color: string;
  background: 'none' | 'solid' | 'translucent';
  backgroundColor?: string;
  backgroundOpacity?: number;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  effect: 'none' | 'shadow' | 'glow' | 'outline';
};

interface TextEditorProps {
  initialText?: string;
  initialStyle?: TextStyle;
  onDone: (text: string, style: TextStyle) => void;
  onCancel: () => void;
}

const FONTS = ['Classic', 'Typewriter', 'Modern', 'Neon', 'Strong', 'Marker', 'Elegant', 'Tech', 'Comic'];
const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];

export default function TextEditor({ initialText = '', initialStyle, onDone, onCancel }: TextEditorProps) {
  const [text, setText] = useState(initialText);
  const [style, setStyle] = useState<TextStyle>(initialStyle || {
    font: 'Classic',
    color: '#FFFFFF',
    background: 'none',
    backgroundColor: '#000000',
    backgroundOpacity: 80,
    alignment: 'center',
    fontSize: 40,
    effect: 'none'
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const toggleBackground = () => {
    const nextBg = style.background === 'none' ? 'solid' : 'none';
    setStyle({ ...style, background: nextBg });
  };

  const toggleAlignment = () => {
    const nextAlign = style.alignment === 'center' ? 'left' : style.alignment === 'left' ? 'right' : 'center';
    setStyle({ ...style, alignment: nextAlign });
  };

  const toggleEffect = () => {
    const effects: ('none' | 'shadow' | 'glow' | 'outline')[] = ['none', 'shadow', 'glow', 'outline'];
    const nextIdx = (effects.indexOf(style.effect) + 1) % effects.length;
    setStyle({ ...style, effect: effects[nextIdx] });
  };

  const AlignmentIcon = style.alignment === 'center' ? AlignCenter : style.alignment === 'left' ? AlignLeft : AlignRight;

  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="flex gap-4">
          <button onClick={toggleAlignment} className="w-10 h-10 flex items-center justify-center text-white bg-zinc-800/50 rounded-full">
            <AlignmentIcon size={20} />
          </button>
          <button onClick={toggleEffect} className="w-10 h-10 flex items-center justify-center text-white bg-zinc-800/50 rounded-full font-serif font-bold italic" title="Text Effect">
            E
          </button>
          <button onClick={toggleBackground} className="w-10 h-10 flex items-center justify-center text-white font-serif border-2 border-white rounded-lg px-1 bg-zinc-800/50">
            A*
          </button>
        </div>
        <button onClick={() => onDone(text, style)} className="text-white font-semibold text-lg px-4 py-2 bg-zinc-800/50 rounded-full">
          Done
        </button>
      </div>

      {/* Text Input */}
      <div className="flex-1 flex items-center justify-center p-4 w-full relative">
        {/* Font Size Slider (Instagram Style) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
          <div className="relative h-64 w-8 flex items-center justify-center">
            {/* Track background */}
            <div className="absolute h-full w-1.5 bg-white/30 rounded-full" />
            {/* Track fill */}
            <div 
              className="absolute bottom-0 w-1.5 bg-white rounded-full pointer-events-none"
              style={{ height: `${((style.fontSize - 12) / (120 - 12)) * 100}%` }}
            />
            {/* Input */}
            <input
              type="range"
              min="12"
              max="120"
              value={style.fontSize}
              onChange={(e) => setStyle({ ...style, fontSize: parseInt(e.target.value) })}
              className="absolute w-64 h-8 origin-center -rotate-90 appearance-none bg-transparent cursor-pointer z-20
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.5)] active:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter bg-black/50 px-2 py-1 rounded-md">Size</span>
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-full bg-transparent outline-none resize-none overflow-hidden text-center font-bold ${getFontClass(style.font)}`}
          style={{
            color: style.color,
            textAlign: style.alignment,
            fontSize: `${style.fontSize}px`,
            backgroundColor: getBgColor(style),
            padding: style.background !== 'none' ? '12px 24px' : '0',
            borderRadius: style.background !== 'none' ? '16px' : '0',
            textShadow: getTextShadow(style),
            WebkitTextStroke: getWebkitTextStroke(style),
          }}
          placeholder="Type something..."
          rows={1}
        />
      </div>

      {/* Bottom Controls */}
      <div className="pb-8 flex flex-col gap-2">
        {/* Background Color & Opacity Controls */}
        {style.background !== 'none' && (
          <div className="px-6 py-2 flex flex-col gap-3 bg-zinc-900/80 mx-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white/50 uppercase w-16">Opacity</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={style.backgroundOpacity ?? 100} 
                onChange={e => setStyle({...style, backgroundOpacity: parseInt(e.target.value)})} 
                className="flex-1 accent-white" 
              />
              <span className="text-xs text-white/50 w-8 text-right">{style.backgroundOpacity ?? 100}%</span>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
              <span className="text-xs font-bold text-white/50 uppercase w-16 shrink-0">Bg Color</span>
              <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border-2 border-white/20">
                <input 
                  type="color" 
                  value={style.backgroundColor || '#000000'} 
                  onChange={e => setStyle({...style, backgroundColor: e.target.value})} 
                  className="absolute -inset-2 w-12 h-12 cursor-pointer" 
                />
              </div>
              {COLORS.map(c => (
                <button
                  key={`bg-${c}`}
                  onClick={() => setStyle({ ...style, backgroundColor: c })}
                  className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-transform ${style.backgroundColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar">
          <span className="text-xs font-bold text-white/50 uppercase w-16 shrink-0 flex items-center">Text</span>
          {COLORS.map(c => (
            <button
              key={`text-${c}`}
              onClick={() => setStyle({ ...style, color: c })}
              className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-transform ${style.color === c ? 'border-white scale-125' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {/* Fonts */}
        <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar">
          {FONTS.map(f => (
            <button
              key={f}
              onClick={() => setStyle({ ...style, font: f })}
              className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-all ${style.font === f ? 'bg-white text-black scale-110' : 'bg-zinc-800'} ${getFontClass(f)}`}
            >
              Aa
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getFontClass(font: string) {
  switch (font) {
    case 'Typewriter': return 'font-mono font-bold';
    case 'Modern': return 'font-sans font-black uppercase tracking-wider';
    case 'Neon': return 'font-cursive text-pink-500'; 
    case 'Strong': return 'font-serif font-bold italic';
    case 'Marker': return 'font-sans font-black italic tracking-tighter';
    case 'Elegant': return 'font-serif font-light tracking-widest';
    case 'Tech': return 'font-mono tracking-widest uppercase';
    case 'Comic': return 'font-sans font-bold rounded-md';
    default: return 'font-sans font-bold';
  }
}

export function getTextShadow(style: TextStyle) {
  if (style.effect === 'glow' || style.font === 'Neon') return `0 0 10px ${style.color}, 0 0 20px ${style.color}`;
  if (style.effect === 'shadow') return '0 4px 12px rgba(0,0,0,0.8)';
  return 'none';
}

export function getWebkitTextStroke(style: TextStyle) {
  if (style.effect === 'outline') return `1.5px ${style.background === 'solid' ? '#fff' : '#000'}`;
  return 'none';
}

export function getBgColor(style: TextStyle) {
  if (style.background === 'none') return 'transparent';
  const hex = style.backgroundColor || style.color || '#000000';
  const opacity = style.backgroundOpacity !== undefined ? style.backgroundOpacity : (style.background === 'translucent' ? 50 : 100);
  
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) {
    r = parseInt(hex.slice(1, 3), 16) || 0;
    g = parseInt(hex.slice(3, 5), 16) || 0;
    b = parseInt(hex.slice(5, 7), 16) || 0;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}
