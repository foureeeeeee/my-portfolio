import React from 'react';
import { motion } from 'framer-motion';

const Marquee: React.FC = () => {
  return (
    <div className="relative py-20 bg-black overflow-hidden border-y border-white/10">
      <div className="flex whitespace-nowrap">
        <motion.div 
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 20 
          }}
        >
          {/* Duplicated content for seamless loop */}
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-[6rem] md:text-[8rem] font-bold text-transparent px-8 tracking-tighter" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
              EXPERIENCE — RESEARCH — DESIGN — INNOVATION — 
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Marquee;