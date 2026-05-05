"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🔭", title: "Real Star Positions", desc: "Uses your GPS and compass to show actual stars aligned with the real sky." },
  { icon: "⭐", title: "Name a Star", desc: "Dedicate a real star to someone special with a custom name and message." },
  { icon: "🌌", title: "AR Sky View", desc: "Point your phone at the sky and explore thousands of stars in augmented reality." },
  { icon: "📜", title: "Official Certificate", desc: "Get a beautiful certificate with star coordinates, dedication, and validity period." },
  { icon: "♾️", title: "Lifetime Registration", desc: "Choose 1-year, 5-year, or lifetime validity for your named star." },
  { icon: "🌐", title: "Public Registry", desc: "Share your star with a unique link anyone can view and find in the sky." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Starfield bg */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse-slow"
              style={{
                width: Math.random() * 2.5 + 0.5,
                height: Math.random() * 2.5 + 0.5,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.1,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-7xl mb-6 animate-float"
          >
            ✨
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-b from-white to-star-blue bg-clip-text text-transparent"
          >
            Akash
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg text-white/60 mb-10 max-w-md mx-auto leading-relaxed"
          >
            Name a real star and see it glowing in the actual night sky through your phone.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/ar" className="btn-primary text-lg px-8 py-4 text-center">
              Start AR Sky View
            </Link>
            <Link href="/registry" className="btn-secondary text-lg px-8 py-4 text-center">
              Search Registry
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-0.5 h-8 bg-white/30 rounded animate-pulse" />
          <span className="text-xs text-white/40">Scroll to explore</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="glass-panel max-w-lg mx-auto p-10">
          <div className="text-4xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold mb-3">Ready to name your star?</h2>
          <p className="text-white/50 mb-8 text-sm">Open the AR viewer and tap any star to begin.</p>
          <Link href="/ar" className="btn-primary inline-block px-10 py-4 text-lg">
            Open Sky Viewer
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="py-8 px-6 text-center border-t border-white/5">
        <p className="text-white/25 text-xs max-w-xl mx-auto">
          Custom star names in Akash are ceremonial and recorded only in this private
          registry. They do not replace official astronomical names recognized by the International
          Astronomical Union.
        </p>
        <p className="text-white/20 text-xs mt-4">
          © {new Date().getFullYear()} Akash. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
