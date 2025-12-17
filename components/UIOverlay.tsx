
import React, { useState, useRef, useEffect } from 'react';

interface UIOverlayProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ currentUrl, onUrlChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Drag and Drop handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set false if leaving the window
      if (e.relatedTarget === null) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [currentUrl]);

  const processFile = (file: File) => {
    if (currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
    }
    
    // Create blob URL
    let objectUrl = URL.createObjectURL(file);
    
    // Append virtual hint for different file types since Blob URLs don't have extensions
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.hdr')) {
      objectUrl += '#type=hdr.hdr'; 
    } else if (fileName.endsWith('.exr')) {
      objectUrl += '#type=exr.exr';
    }

    onUrlChange(objectUrl);
    setShowSettings(false);
    setInputValue('Local: ' + file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onUrlChange(inputValue);
      setShowSettings(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Drag Overlay Hint */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-md border-4 border-dashed border-blue-500 m-4 rounded-3xl flex items-center justify-center pointer-events-none transition-all animate-pulse">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-white text-2xl font-bold uppercase tracking-widest">Drop to Load Panorama</p>
            <p className="text-white/60 text-sm mt-2">Supports JPG, PNG, HDR, and EXR formats</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <h1 className="text-white text-xl font-bold tracking-tight">Vision 360</h1>
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1 font-semibold">Pro HDR / EXR / LDR Viewer</p>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white text-black p-3 rounded-full hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
          aria-label="Open Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Settings Dialog */}
      {showSettings && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm z-20 p-4">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-2xl font-bold">Load Panorama</h2>
              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-white/70 text-sm font-semibold uppercase tracking-widest">Option 1: Local File</h3>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*,.hdr,.exr" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-blue-500/50 transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/40 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-white font-medium">Click to upload 360 image / HDR / EXR</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-zinc-900 px-2 text-white/30">OR</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-white/70 text-sm font-semibold uppercase tracking-widest">Option 2: Image URL</h3>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-mono"
                placeholder="https://..."
              />
              <button 
                type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-900/20"
              >
                Load from URL
              </button>
            </form>

            <p className="text-white/20 text-[10px] text-center uppercase tracking-tighter">
              Tip: You can also drag any file directly onto this window.
            </p>
          </div>
        </div>
      )}

      {/* Footer / Instructions */}
      <div className="flex justify-center">
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-6 pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">DRAG TO ROTATE • SCROLL TO ZOOM</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">HDR & EXR SUPPORTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
