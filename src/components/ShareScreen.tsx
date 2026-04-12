import React, { useState } from 'react';
import { ChevronLeft, MapPin, Users, Music, Settings, ChevronRight, Share2, Globe, Lock, Users2 } from 'lucide-react';
import { motion } from 'motion/react';
import { MediaItem } from './MediaSelector';

interface ShareScreenProps {
  images: string[];
  mediaItems: MediaItem[];
  postType: 'post' | 'story' | 'reel';
  onBack: () => void;
  onShare: () => void;
  showToast: (msg: string) => void;
}

export default function ShareScreen({ images, mediaItems, postType, onBack, onShare, showToast }: ShareScreenProps) {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight capitalize">{postType}</h1>
        </div>
        <button 
          onClick={onShare} 
          className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          Upload
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Preview & Caption */}
          <div className="space-y-8">
            <div className="relative aspect-[4/5] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              {mediaItems[currentPreviewIndex].type === 'video' ? (
                <video src={images[currentPreviewIndex]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={images[currentPreviewIndex]} alt="Preview" className="w-full h-full object-cover" />
              )}
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setCurrentPreviewIndex(prev => Math.min(images.length - 1, prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentPreviewIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-black tracking-widest uppercase text-zinc-500">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind? #Sastagram"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-40 text-lg"
              />
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-black tracking-widest uppercase text-zinc-500">Visibility</label>
              <div className="grid grid-cols-3 gap-3">
                <VisibilityTab active={visibility === 'public'} icon={<Globe size={18} />} label="Public" onClick={() => setVisibility('public')} />
                <VisibilityTab active={visibility === 'friends'} icon={<Users2 size={18} />} label="Friends" onClick={() => setVisibility('friends')} />
                <VisibilityTab active={visibility === 'private'} icon={<Lock size={18} />} label="Private" onClick={() => setVisibility('private')} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black tracking-widest uppercase text-zinc-500">Tagging & Location</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
                <OptionRow icon={<Users size={20} />} label="Tag People" onClick={() => showToast('Tagging...')} />
                <OptionRow icon={<MapPin size={20} />} label="Add Location" onClick={() => showToast('Locating...')} />
                <OptionRow icon={<Music size={20} />} label="Add Music" border={false} onClick={() => showToast('Music...')} />
              </div>
            </div>

            <button onClick={() => showToast('Advanced settings...')} className="w-full py-4 text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs">
              <Settings size={16} />
              Advanced Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisibilityTab({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${active ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function OptionRow({ icon, label, onClick, border = true }: { icon: React.ReactNode, label: string, onClick: () => void, border?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center justify-between p-6 w-full active:bg-zinc-800 transition-colors ${border ? 'border-b border-zinc-800' : ''}`}
    >
      <div className="flex items-center gap-4 text-white">
        <div className="text-zinc-500">{icon}</div>
        <span className="font-bold">{label}</span>
      </div>
      <ChevronRight size={18} className="text-zinc-700" />
    </button>
  );
}

