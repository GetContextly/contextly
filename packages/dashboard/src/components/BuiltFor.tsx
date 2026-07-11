'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export const BuiltFor = () => {
  const cards = [
    {
      title: "Solo Founders",
      desc: "You are the whole team. Contextly ensures your agents know exactly what you decided yesterday at 2 AM.",
      size: "col-span-2",
      icon: "⚡"
    },
    {
      title: "Scale-ups",
      desc: "Onboard new devs and their AI tools in minutes, not weeks. The project history is a live protocol.",
      size: "col-span-1",
      icon: "◈"
    },
    {
      title: "OSS Maintainers",
      desc: "Give contributors a neural map of the project. No more explaining the same patterns in every PR.",
      size: "col-span-1",
      icon: "✦"
    },
    {
      title: "Enterprise Teams",
      desc: "Strict architectural compliance across 100+ agents. One global context server to rule them all.",
      size: "col-span-2",
      icon: "🛡️"
    }
  ];

  return (
    <section className="py-40 bg-[#06070a] border-t border-white/5">
      <div className="container">
        <div className="mb-24">
          <span className="text-signal-green font-mono text-[10px] uppercase tracking-[0.4em] mb-6 font-bold block">
            Target Vectors
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.9] tracking-tight text-white max-w-2xl">
            Built for the <span className="text-white/20">AI-native</span> shipping cycle.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
              className={`${card.size} p-10 rounded-[32px] bg-white/5 border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-8 text-4xl opacity-20 group-hover:opacity-100 transition-opacity duration-500 grayscale group-hover:grayscale-0">
                {card.icon}
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[160px]">
                <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">{card.desc}</p>
              </div>

              {/* Subtle card glow */}
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 blur-[80px] rounded-full group-hover:bg-signal-green/5 transition-all duration-1000" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
