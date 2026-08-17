import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

// Same teal Memphis palette as the Login page, so the splash reads as one
// continuous brand moment rather than a separate screen.
const ACCENT_LINE = 'linear-gradient(90deg, #4FA6B8, #1C6B82, #0B5E63)';
const CREAM = '#F5E9D3';

const BRAND = 'SMART MASTER';

// Every letter of the brand name fades/blurs in on its own, staggered.
const letterVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.8 + i * 0.035, duration: 0.5, ease: 'easeOut' },
  }),
};

// A handful of soft floating specks — a quiet nod to loose thread drifting
// in the air. Kept few and faint so the screen still reads as clean.
const FLECKS = [
  { top: '18%', left: '12%', size: 6, delay: 0 },
  { top: '28%', left: '85%', size: 5, delay: 0.6 },
  { top: '70%', left: '10%', size: 4, delay: 1.1 },
  { top: '78%', left: '88%', size: 6, delay: 1.7 },
];

// Full-screen animated intro shown once, before the login page. The whole
// sequence — logo, brand name, tagline, then a filling "stitch" progress
// line — is timed to run for ~10s total, after which onFinish() is called
// so the app can swap in the real routes underneath.
const LandingSplash = ({ onFinish }) => {
  useEffect(() => {
    // Fires slightly before the 10s mark so the ~0.4s exit fade lands
    // right at 10s total.
    const timer = setTimeout(() => onFinish?.(), 9600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[500] min-h-[100dvh] w-full flex items-center justify-center overflow-hidden px-4 sm:px-6"
      style={{ background: 'linear-gradient(135deg, #083840 0%, #0B5E63 45%, #1C6B82 100%)' }}
    >
      {/* ── soft breathing glow behind everything ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.5, scale: [0.85, 1, 0.85] }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="pointer-events-none absolute w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(79,166,184,0.35) 0%, rgba(79,166,184,0) 70%)' }}
      />

      {/* ── decorative backdrop, echoing the Login page's Memphis shapes ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-10 -left-16 w-64 h-16 rounded-full rotate-[-35deg]" style={{ background: `${CREAM}25` }} />
        <div className="absolute -top-2 left-20 w-40 h-12 bg-white/10 rounded-full rotate-[-35deg]" />
        <div className="absolute top-24 -left-10 w-52 h-14 rounded-full rotate-[-35deg]" style={{ background: '#D9A44122' }} />
        <div className="absolute -bottom-12 -right-16 w-72 h-16 rounded-full rotate-[-35deg]" style={{ background: `${CREAM}25` }} />
        <div className="absolute bottom-16 right-4 w-44 h-12 rounded-full rotate-[-35deg]" style={{ background: '#FF9E8022' }} />
        <div className="absolute bottom-40 -right-10 w-56 h-14 bg-white/10 rounded-full rotate-[-35deg]" />
        <div className="hidden sm:block absolute top-1/3 left-6 w-24 h-24 rounded-full border-4 border-white/10" />
        <div className="hidden sm:block absolute bottom-10 right-1/4 w-16 h-16 rounded-full" style={{ background: '#CBD5C822' }} />
      </div>

      {/* ── loose floating thread specks ── */}
      {FLECKS.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-white/50"
          style={{ top: f.top, left: f.left, width: f.size, height: f.size }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0.7, 0], y: [-6, 6, -6] }}
          transition={{ delay: f.delay, duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* ── logo mark, with a pulsing stitched ring around it ── */}
        <div className="relative mb-5 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.35, 1.6] }}
            transition={{ delay: 0.5, duration: 1.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl border-2 border-dashed"
            style={{ borderColor: CREAM }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
          >
            <Scissors className="text-white" size={28} />
          </motion.div>
        </div>

        {/* ── brand name, letter by letter ── */}
        <h1 className="flex flex-wrap justify-center text-white font-black text-2xl sm:text-3xl md:text-4xl tracking-[0.12em] sm:tracking-[0.15em] px-2">
          {BRAND.split('').map((ch, i) => (
            <motion.span
              key={i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={letterVariants}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        {/* ── small stitched flourish, drawn once the name has landed ── */}
        <motion.svg
          width="120" height="10" viewBox="0 0 120 10"
          className="mt-2 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.65, duration: 0.2 }}
        >
          <motion.path
            d="M2 5 H118"
            stroke="#F5E9D3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.65, duration: 0.5, ease: 'easeOut' }}
          />
        </motion.svg>

        {/* ── tagline ── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.5, ease: 'easeOut' }}
          className="text-white/80 text-xs sm:text-sm mb-8 sm:mb-10 px-2"
        >
          Tailoring your orders, one stitch at a time
        </motion.p>

        {/* ── filling progress line with a travelling needle glow ── */}
        <div className="w-52 sm:w-64 md:w-72">
          <div className="relative h-1.5 rounded-full bg-white/15 overflow-visible">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 2.1, duration: 6.8, ease: 'easeInOut' }}
              className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
              style={{ background: ACCENT_LINE }}
            />
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ delay: 2.1, duration: 6.8, ease: 'easeInOut' }}
              className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white -translate-y-1/2 -translate-x-1/2 shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]"
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.4 }}
            className="mt-3 text-white/60 text-[11px] sm:text-xs tracking-widest uppercase"
          >
            Preparing your workspace...
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingSplash;
