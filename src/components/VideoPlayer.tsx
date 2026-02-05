import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = src;
      videoRef.current.play().catch(() => {
        // Autoplay was prevented, which is expected on some browsers
      });
    }
  }, [src]);

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}
