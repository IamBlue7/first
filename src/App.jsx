import React, { useEffect, useRef, useState } from 'react';
import Human from '@vladmandic/human';

const humanConfig = {
  backend: 'webgl',
  modelBasePath: 'https://vladmandic.github.io/human/models',
  cacheModels: true,
  debug: false,
  face: {
    enabled: true,
    mesh: true,
    iris: true,
    emotion: true,
    description: true,
  },
  body: { enabled: true },
  hand: { enabled: true },
  gesture: { enabled: true },
};

const human = new Human(humanConfig);

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectionData, setDetectionData] = useState(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log('🎥 Webcam started');
    } catch (err) {
      console.error('🛑 Webcam error:', err);
    }
  };

  const runDetection = async () => {
    await human.load();
    await human.warmup();
    console.log('🤖 Human loaded and warmed up');

    const loop = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const result = await human.detect(videoRef.current);
        setDetectionData(result);  // Store the detection data for rendering later

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw everything detected
        human.draw.all(canvas, result);
      }
      requestAnimationFrame(loop);
    };

    loop();
  };

  useEffect(() => {
    const init = async () => {
      await startVideo();
      videoRef.current.addEventListener('loadeddata', async () => {
        // Set canvas size to match video dimensions
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Also adjust the CSS style
        canvasRef.current.style.width = `${videoRef.current.videoWidth}px`;
        canvasRef.current.style.height = `${videoRef.current.videoHeight}px`;

        videoRef.current.style.width = `${videoRef.current.videoWidth}px`;
        videoRef.current.style.height = `${videoRef.current.videoHeight}px`;

        await runDetection();
      });
    };
    init();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#222' }}>
      <div
        style={{
          position: 'absolute',
          zIndex: 3,
          color: '#fff',
          left: '20px',
          top: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {detectionData && detectionData.face && (
          <>
            <p>Age: {detectionData.face.age ? detectionData.face.age.toFixed(0) : 'N/A'}</p>
            <p>Gender: {detectionData.face.gender ? detectionData.face.gender : 'N/A'}</p>
            <p>Emotion: {detectionData.face.emotion ? detectionData.face.emotion : 'N/A'}</p>
          </>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            // transform: 'scaleX(-1)', // Selfie mode
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none',
            // transform: 'scaleX(-1)', // Match video mirror
          }}
        />
      </div>
    </div>
  );
};

export default App;
