import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const ShootingStars = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#ec4899",
  trailColor = "#a855f7",
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const createStar = () => {
      const star = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: -20,
        angle: Math.random() * 60 - 30,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: Math.random() * 200 + 200,
      };
      return star;
    };

    const shootStar = () => {
      setStars((prevStars) => [...prevStars, createStar()]);
      setTimeout(() => {
        setStars((prevStars) => prevStars.slice(1));
      }, 3000);
    };

    const interval = setInterval(() => {
      shootStar();
    }, Math.random() * (maxDelay - minDelay) + minDelay);

    return () => clearInterval(interval);
  }, [minSpeed, maxSpeed, minDelay, maxDelay]);

  return (
    <div className={`shooting-stars-container ${className || ''}`} style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{
            x: star.x,
            y: star.y,
            opacity: 1,
          }}
          animate={{
            x: star.x + Math.cos((star.angle * Math.PI) / 180) * star.distance,
            y: star.y + Math.sin((star.angle * Math.PI) / 180) * star.distance,
            opacity: 0,
          }}
          transition={{
            duration: star.speed / 10,
            ease: "easeOut",
          }}
          style={{
            position: 'absolute',
            width: `${starWidth}px`,
            height: `${starHeight}px`,
            background: `linear-gradient(to right, ${starColor}, ${trailColor}, transparent)`,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${starColor}`,
            transform: `rotate(${star.angle}deg)`,
          }}
        />
      ))}
    </div>
  );
};
