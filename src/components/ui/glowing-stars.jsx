import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export const GlowingStarsBackgroundCard = ({ children, className }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        height: '20rem',
        width: '100%',
        maxWidth: '32rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'end',
        alignItems: 'start',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
      className={className}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.15), transparent 40%)`,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }}
      />
      <GlowingStars />
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};

export const GlowingStarsTitle = ({ children }) => {
  return (
    <h3 style={{
      fontSize: '1.5rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.5rem'
    }}>
      {children}
    </h3>
  );
};

export const GlowingStarsDescription = ({ children }) => {
  return (
    <p style={{
      fontSize: '0.875rem',
      color: 'rgba(255, 255, 255, 0.6)',
      maxWidth: '16rem'
    }}>
      {children}
    </p>
  );
};

const GlowingStars = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 50; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          duration: Math.random() * 3 + 2,
          delay: Math.random() * 2,
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            backgroundColor: '#a855f7',
            boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(168, 85, 247, 0.5)`,
          }}
        />
      ))}
    </div>
  );
};
