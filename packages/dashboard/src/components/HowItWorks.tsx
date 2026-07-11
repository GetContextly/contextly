'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export const HowItWorks = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useTransform(scrollYProgress, [0.1, 0.8], [0, 1]);

  const steps = [
    {
      id: '01',
      title: "The Pulse",
      label: "Automated Capture",
      desc: "Connect your repo. Contextly watches your git history, PRs, and commit messages to build a real-time 'Why' map.",
      visual: (
        <div className="relative w-full h-full bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-signal-green/10 to-transparent opacity-50" />
          <div className="font-mono text-[10px] text-signal-green/40 flex flex-col gap-1 p-4 w-full">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>commit_7a21</span>
              <span className="text-white/10 italic">SYNCED</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>commit_9b88</span>
              <span className="text-white/10 italic">SYNCED</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>commit_4c02</span>
              <span className="text-signal-green animate-pulse">SYNCING...</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '02',
      title: "The Neural Graph",
      label: "Context Distillation",
      desc: "We don't just store files; we distill intent. Our RAG engine generates semantic embeddings for your entire architecture.",
      visual: (
        <div className="relative w-full h-full bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center p-8">
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                className="h-8 rounded-lg bg-signal-green/10 border border-signal-green/10"
              />
            ))}
          </div>
        </div>
      )
    },
    {
      id: '03',
      title: "The Agent Link",
      label: "MCP Native Delivery",
      desc: "Your agents (Claude, Cursor, Copilot) query Contextly via MCP. They get the ground truth in <50ms. No hallucinations.",
      visual: (
        <div className="relative w-full h-full bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-signal-green/10 flex items-center justify-center text-signal-green font-bold">C</div>
            <div className="w-16 h-[2px] bg-signal-green/20 relative overflow-hidden">
              <motion.div
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-signal-green"
              />
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 font-bold">AI</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section ref={containerRef} className="relative py-40 bg-[#06070a]">
      <div className="container relative z-10">
        <div className="flex flex-col items-center mb-32">
          <span className="text-white/20 font-mono text-xs uppercase tracking-[0.4em] mb-4">Architecture</span>
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.9] tracking-tight text-white text-center">
            How memory works.
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.id} className="grid md:grid-cols-2 gap-20 mb-40 last:mb-0 items-center">
              {/* CONTENT */}
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: EASE }}
                className={i % 2 === 0 ? 'md:order-1' : 'md:order-2'}
              >
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-4xl font-black text-white/5 font-display">{step.id}</span>
                  <div className="h-px w-12 bg-signal-green/20" />
                  <span className="text-[10px] font-mono text-signal-green tracking-[0.2em] font-bold uppercase">{step.label}</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">{step.title}</h3>
                <p className="text-white/40 leading-relaxed text-lg">{step.desc}</p>
              </motion.div>

              {/* VISUAL */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: EASE }}
                className={`h-80 w-full ${i % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}
              >
                {step.visual}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Storyline Path */}
      <div className="absolute left-1/2 top-[30%] bottom-[10%] w-px bg-white/5 -translate-x-1/2 hidden md:block">
        <motion.div
          style={{ pathLength, scaleY: pathLength, originY: 0 }}
          className="absolute inset-0 bg-signal-green/20"
        />
      </div>
    </section>
  );
};
