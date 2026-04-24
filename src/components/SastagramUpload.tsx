import React, { useState } from 'react';
import MediaEditor from './MediaEditor';
import ShareScreen from './ShareScreen';
import MediaSelector, { MediaItem } from './MediaSelector';
import { AnimatePresence, motion } from 'motion/react';

export type FlowState = 'select' | 'edit' | 'share';

export default function SastagramUpload() {
  const [flowState, setFlowState] = useState<FlowState>('select');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [editorStates, setEditorStates] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white relative flex flex-col overflow-hidden">
      <AnimatePresence>
        {flowState === 'select' && (
          <motion.div 
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 flex flex-col z-30 bg-zinc-950"
          >
            <MediaSelector 
              onSelect={(items, type) => { 
                setMediaItems(items); 
                setPostType(type); 
                setFlowState('edit'); 
              }} 
              onClose={() => showToast('Upload cancelled')}
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(flowState === 'edit' || flowState === 'share') && mediaItems.length > 0 && (
        <motion.div 
          initial={false}
          animate={{ 
            opacity: flowState === 'edit' ? 1 : 0, 
            scale: flowState === 'edit' ? 1 : 0.95,
            pointerEvents: flowState === 'edit' ? 'auto' : 'none'
          }}
          className="absolute inset-0 flex flex-col bg-zinc-950"
          style={{ zIndex: flowState === 'edit' ? 20 : 10 }}
        >
          <MediaEditor 
            mediaItems={mediaItems} 
            postType={postType}
            onNext={(imgs, states) => { setEditedImages(imgs); setEditorStates(states); setFlowState('share'); }} 
            onBack={() => {
              setFlowState('select');
              setMediaItems([]);
            }} 
            showToast={showToast}
          />
        </motion.div>
      )}

      {(flowState === 'edit' || flowState === 'share') && mediaItems.length > 0 && editedImages.length > 0 && (
        <motion.div 
          initial={false}
          animate={{ 
            opacity: flowState === 'share' ? 1 : 0, 
            x: flowState === 'share' ? 0 : 20,
            pointerEvents: flowState === 'share' ? 'auto' : 'none'
          }}
          className="absolute inset-0 flex flex-col bg-zinc-950"
          style={{ zIndex: flowState === 'share' ? 30 : 10 }}
        >
          <ShareScreen 
            images={editedImages} 
            mediaItems={mediaItems}
            editorStates={editorStates}
            postType={postType}
            onBack={() => setFlowState('edit')} 
            onShare={() => {
              showToast('Successfully posted to Sastagram!');
              setFlowState('select');
              setMediaItems([]);
              setEditedImages([]);
              setEditorStates([]);
            }} 
            showToast={showToast}
          />
        </motion.div>
      )}

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
