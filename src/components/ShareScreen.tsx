import React, { useState } from 'react';
import { ChevronLeft, MapPin, Users, Music, Settings, ChevronRight, Share2, Globe, Lock, Users2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ShareScreenProps {
  image: string;
  onBack: () => void;
  onShare: () => void;
  showToast: (msg: string) => void;
}

export default function ShareScreen({ image, onBack, onShare, showToast }: ShareScreenProps) {
  const [caption, setCaption] = useState('');
  const [shareToFacebook, setShareToFacebook] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Publish Post</h1>
        </div>
        <button 
          onClick={onShare} 
          className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          Share Now <Share2 size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Preview & Caption */}
          <div className="space-y-8">
            <div className="aspect-[4/5] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
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

            <div className="space-y-4">
              <label className="text-sm font-black tracking-widest uppercase text-zinc-500">Integrations</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="text-xl font-black">f</span>
                  </div>
                  <div>
                    <p className="font-bold">Facebook</p>
                    <p className="text-xs text-zinc-500">Share to your timeline</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShareToFacebook(!shareToFacebook)}
                  className={`w-14 h-8 rounded-full relative transition-colors ${shareToFacebook ? 'bg-blue-500' : 'bg-zinc-700'}`}
                >
                  <motion.div 
                    animate={{ x: shareToFacebook ? 26 : 4 }}
                    className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg"
                  />
                </button>
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

