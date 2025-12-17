
import React, { useState, useEffect } from 'react';
import PanoramaViewer from './components/PanoramaViewer';
import UIOverlay from './components/UIOverlay';

// Standardize JSX definitions for A-Frame elements to satisfy TypeScript and React environments
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-sky': any;
      'a-camera': any;
      'a-assets': any;
      'a-entity': any;
      'a-image': any;
      'a-asset-item': any;
    }
  }
}

const App: React.FC = () => {
  // Use official sample image as initial background
  const [imageSrc, setImageSrc] = useState<string>('https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Artificial delay to ensure A-Frame scripts are fully ready
    const timer = setTimeout(() => setIsInitializing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSourceChange = (newUrl: string) => {
    // Immediately switch to the new source
    setImageSrc(newUrl);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Initialization Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
          <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-white/40 text-[10px] mt-6 uppercase tracking-[0.2em] font-bold">Vision360 Engine Loading</p>
        </div>
      )}

      {/* 3D Core Renderer */}
      <PanoramaViewer imageSrc={imageSrc} />

      {/* Interface Overlay */}
      <UIOverlay 
        currentUrl={imageSrc} 
        onUrlChange={handleSourceChange} 
      />
    </div>
  );
};

export default App;