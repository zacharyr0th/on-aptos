'use client';

import { useEffect, useState } from 'react';

interface FloatingOrb {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const FloatingOrbs = () => {
  const [orbs, setOrbs] = useState<FloatingOrb[]>([]);

  useEffect(() => {
    // Create responsive floating orbs
    const orbCount = window.innerWidth < 768 ? 3 : 5;
    const generatedOrbs: FloatingOrb[] = Array.from(
      { length: orbCount },
      (_, i) => ({
        id: i,
        size: 60 + Math.random() * 100,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        duration: 20 + Math.random() * 15,
        delay: i * 3,
        opacity: 0.02 + Math.random() * 0.04,
      })
    );

    setOrbs(generatedOrbs);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {orbs.map(orb => (
        <div
          key={orb.id}
          className="absolute rounded-full bg-black dark:bg-white animate-float"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            opacity: orb.opacity,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};
