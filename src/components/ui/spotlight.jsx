import React from "react";
import { motion } from "framer-motion";

export const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(330, 100%, 45%, .12) 0, hsla(300, 100%, 35%, .04) 50%, hsla(280, 100%, 25%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(330, 100%, 45%, .08) 0, hsla(300, 100%, 35%, .03) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(0, 100%, 35%, .06) 0, hsla(330, 100%, 25%, .02) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}) => {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <motion.div
        initial={{ opacity: 0, x: -xOffset }}
        animate={{ opacity: 1, x: xOffset }}
        transition={{
          duration: duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          width: `${width}px`,
          height: `${height}px`,
          background: gradientFirst,
          transform: `translateY(${translateY}px)`,
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: -xOffset }}
        transition={{
          duration: duration * 0.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          position: 'absolute',
          right: 0,
          width: `${smallWidth}px`,
          height: `${height}px`,
          background: gradientSecond,
          transform: `translateY(${translateY}px)`,
          filter: 'blur(50px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: -50 }}
        transition={{
          duration: duration * 1.2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.5,
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${width * 0.8}px`,
          height: `${height * 0.6}px`,
          background: gradientThird,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
};
