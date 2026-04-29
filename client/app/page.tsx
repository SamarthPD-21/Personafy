"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { personas } from "./lib/personas";

const ICONS = ["⚡", "🧠", "✨"];

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-600 opacity-[0.08] blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-purple-600 opacity-[0.08] blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500 opacity-[0.04] blur-[100px]" />
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-20"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400 tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Persona Chat
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-none mb-6">
          Personafy
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto font-light leading-relaxed">
          Distinct voices. Fluid conversations. Pick a persona and dive in.
        </p>
      </motion.div>

      {/* Persona cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {personas.map((persona, i) => (
          <motion.div
            key={persona.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: "easeOut" }}
          >
            <Link href={`/person/${persona.id}`} className="block h-full group">
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="glass-panel rounded-3xl p-8 h-full flex flex-col gap-5 relative overflow-hidden cursor-pointer"
                style={{ borderColor: `${persona.accent}30` }}
              >
                {/* Accent glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                  style={{ background: `radial-gradient(circle at 80% 20%, ${persona.accent}18, transparent 60%)` }}
                />

                {/* Icon badge */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                  style={{ background: `${persona.accent}20`, color: persona.accent }}
                >
                  {ICONS[i]}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: persona.accent }}>
                    Persona {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{persona.name}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{persona.title}</p>
                </div>

                {/* Sample prompts */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {persona.prompts.slice(0, 2).map(p => (
                    <span key={p} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400 truncate max-w-full">
                      {p}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3"
                  style={{ color: persona.accent }}
                >
                  Start chatting
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
