import React, { useState } from 'react';
import MediaEditor from './MediaEditor';
import ShareScreen from './ShareScreen';
import MediaSelector from './MediaSelector';
import { AnimatePresence, motion } from 'motion/react';

export type FlowState = 'select' | 'edit' | 'share';

export default function SastagramUpload() {
  const [flowState, setFlowState] = useState<FlowState>('select');
  const [media, setMedia] = useState<string | null>(null);
  const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white relative flex flex-col">
      <AnimatePresence mode="wait">
        {flowState === 'select' && (
          <motion.div 
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <MediaSelector 
              onSelect={(m, type) => { setMedia(m); setPostType(type); setFlowState('edit'); }} 
              onClose={() => showToast('Upload cancelled')}
              showToast={showToast}
            />
          </motion.div>
        )}
        {flowState === 'edit' && media && (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col"
          >
            <MediaEditor 
              media={media} 
              postType={postType}
              onNext={(img) => { setEditedImage(img); setFlowState('share'); }} 
              onBack={() => setFlowState('select')} 
              showToast={showToast}
            />
          </motion.div>
        )}
        {flowState === 'share' && editedImage && (
          <motion.div 
            key="share"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <ShareScreen 
              image={editedImage} 
              postType={postType}
              onBack={() => setFlowState('edit')} 
              onShare={() => {
                showToast('Successfully posted to Sastagram!');
                setFlowState('select');
                setMedia(null);
                setEditedImage(null);
              }} 
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-2xl z-[100] font-semibold whitespace-nowrap border border-zinc-200"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
