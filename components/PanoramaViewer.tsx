
import React, { useEffect, useMemo, useRef } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-assets': any;
      'a-sky': any;
      'a-camera': any;
      'a-entity': any;
    }
  }
}

interface PanoramaViewerProps {
  imageSrc: string;
}

const DEFAULT_IMAGE_URL = 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg';

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageSrc }) => {
  const sceneRef = useRef<any>(null);

  const isHDR = useMemo(() => {
    const src = imageSrc.toLowerCase();
    return src.endsWith('.hdr') || src.includes('type=hdr') || 
           src.endsWith('.exr') || src.includes('type=exr');
  }, [imageSrc]);

  const isDefaultImage = useMemo(() => imageSrc === DEFAULT_IMAGE_URL, [imageSrc]);

  useEffect(() => {
    const AFRAME = (window as any).AFRAME;
    const THREE = (window as any).THREE;

    if (!AFRAME) return;

    // Ensure loaders are in global scope for A-Frame components
    const setupLoaders = async () => {
      try {
        const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
        const { EXRLoader } = await import('three/examples/jsm/loaders/EXRLoader.js');
        (window as any).RGBELoader = RGBELoader;
        (window as any).EXRLoader = EXRLoader;
      } catch (e) {
        console.error("Loader Init Error", e);
      }
    };
    setupLoaders();

    // 1. Improved Mouse Wheel Zoom Component
    if (!AFRAME.components['mouse-wheel-zoom']) {
      AFRAME.registerComponent('mouse-wheel-zoom', {
        init: function() {
          const el = this.el;
          this.onWheel = (e: WheelEvent) => {
            const camera = el.getAttribute('camera');
            if (!camera) return;

            let fov = camera.fov || 80;
            // Smooth zoom factor
            fov += e.deltaY * 0.04;
            // Clamp between 20 and 110 degrees
            fov = Math.max(20, Math.min(110, fov));
            
            el.setAttribute('camera', 'fov', fov);
            
            if (e.cancelable) e.preventDefault();
          };
          // Use passive: false to allow preventDefault
          window.addEventListener('wheel', this.onWheel, { passive: false });
        },
        remove: function() {
          if (this.onWheel) {
            window.removeEventListener('wheel', this.onWheel);
          }
        }
      });
    }

    // 2. Robust HDR/EXR Pano Loader
    if (!AFRAME.components['pano-loader']) {
      AFRAME.registerComponent('pano-loader', {
        schema: { src: { type: 'string' } },
        update: function() {
          const src = this.data.src;
          if (!src) return;

          const isExr = src.toLowerCase().includes('.exr') || src.includes('type=exr');
          const isHdr = src.toLowerCase().includes('.hdr') || src.includes('type=hdr');
          if (!isExr && !isHdr) return;

          const el = this.el;
          
          const loadPano = () => {
            const LoaderClass = isExr ? (window as any).EXRLoader : (window as any).RGBELoader;
            if (!LoaderClass) return false;

            const loader = new LoaderClass();
            loader.setCrossOrigin('anonymous');

            loader.load(src, (texture: any) => {
              texture.mapping = THREE.EquirectangularReflectionMapping;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.needsUpdate = true;

              const mesh = el.getObject3D('mesh');
              if (mesh && mesh.material) {
                // For HDR/EXR, we use the map on a basic material
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
              }
            }, undefined, (err: any) => console.error('Pano Load Failed:', err));
            return true;
          };

          if (!loadPano()) {
            const retry = setInterval(() => {
              if (loadPano()) clearInterval(retry);
            }, 200);
            setTimeout(() => clearInterval(retry), 5000);
          }
        }
      });
    }
  }, []);

  const assetId = useMemo(() => `pano-${Math.random().toString(36).substring(2, 11)}`, [imageSrc]);

  return (
    <div className="w-full h-full bg-black">
      <a-scene 
        ref={sceneRef}
        embedded 
        loading-screen="enabled: false"
        renderer="antialias: true; colorManagement: true; exposure: 1.0; toneMapping: ACESFilmic;"
      >
        <a-assets>
          {!isHDR && (
            <img 
              id={assetId} 
              src={imageSrc} 
              crossOrigin="anonymous" 
              alt="panorama" 
            />
          )}
        </a-assets>

        {isHDR ? (
          <a-sky 
            key={`hdr-${imageSrc}`}
            pano-loader={`src: ${imageSrc}`}
            radius="5000"
            rotation="0 -90 0"
            material="shader: flat; color: #fff; fog: false;"
          ></a-sky>
        ) : (
          <a-sky 
            key={`std-${imageSrc}`}
            src={`#${assetId}`}
            radius="5000"
            rotation="0 -90 0"
            material="shader: flat; fog: false;"
          ></a-sky>
        )}

        {/* 
           Camera Rig:
           仅默认图旋转 50 度视角。
           用户图片（包含 Blob 或自定义链接）自动重置为 0 度。
        */}
        <a-entity rotation={isDefaultImage ? "0 50 0" : "0 0 0"}>
          <a-camera 
            look-controls="reverseMouseDrag: false; touchEnabled: true" 
            mouse-wheel-zoom=""
            position="0 1.6 0"
          >
          </a-camera>
        </a-entity>

        <a-entity light="type: ambient; intensity: 1.0"></a-entity>
      </a-scene>
    </div>
  );
};

export default PanoramaViewer;
