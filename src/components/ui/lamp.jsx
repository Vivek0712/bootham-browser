import React from "react";
import { motion } from "framer-motion";

export const LampContainer = ({ children }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#020617',
        borderRadius: '0.375rem'
      }}
    >
      <div style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        flex: 1,
        transform: 'scaleY(1.25)',
        alignItems: 'center',
        justifyContent: 'center',
        isolation: 'isolate'
      }}>
        {/* Left cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            right: '50%',
            height: '14rem',
            width: '30rem',
            background: 'conic-gradient(from 70deg at center top, #a855f7, transparent, transparent)',
            overflow: 'visible'
          }}
        />
        
        {/* Right cone */}
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            left: '50%',
            height: '14rem',
            width: '30rem',
            background: 'conic-gradient(from 290deg at center top, transparent, transparent, #a855f7)',
            overflow: 'visible'
          }}
        />
        
        {/* Glow effects */}
        <div style={{
          position: 'absolute',
          top: '50%',
          height: '12rem',
          width: '100%',
          transform: 'translateY(3rem) scaleX(1.5)',
          backgroundColor: '#020617',
          filter: 'blur(40px)'
        }} />
        
        <div style={{
          position: 'absolute',
          inset: 'auto',
          zIndex: 50,
          height: '9rem',
          width: '28rem',
          transform: 'translateY(-50%)',
          borderRadius: '9999px',
          backgroundColor: '#a855f7',
          opacity: 0.5,
          filter: 'blur(60px)'
        }} />
        
        <motion.div
          initial={{ width: "8rem", opacity: 0.5 }}
          animate={{ width: "16rem", opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 30,
            height: '9rem',
            width: '16rem',
            transform: 'translateY(-6rem)',
            borderRadius: '9999px',
            backgroundColor: '#c084fc',
            filter: 'blur(40px)'
          }}
        />
        
        <motion.div
          initial={{ width: "15rem", opacity: 0.5 }}
          animate={{ width: "30rem", opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 50,
            height: '2px',
            width: '30rem',
            transform: 'translateY(-7rem)',
            backgroundColor: '#c084fc'
          }}
        />
        
        <div style={{
          position: 'absolute',
          inset: 'auto',
          zIndex: 40,
          height: '11rem',
          width: '100%',
          transform: 'translateY(-12.5rem)',
          backgroundColor: '#020617'
        }} />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 50,
        display: 'flex',
        transform: 'translateY(-20rem)',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 1.25rem'
      }}>
        {children}
      </div>
    </div>
  );
};
