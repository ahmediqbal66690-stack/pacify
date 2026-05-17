import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Terminal, 
  Info, 
  Download, 
  Github, 
  Share2,
  Box,
  Flame,
  Ghost as GhostIcon,
  ShieldAlert
} from 'lucide-react';
import GameDemo from './components/ThreeDemo';
import Blueprint from './components/Blueprint';
import CSharpScripts from './components/CSharpScripts';

type Tab = 'demo' | 'blueprint' | 'scripts';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<Tab>('demo');

  const tabs = [
    { id: 'demo', label: 'Technical Demo', icon: Gamepad2 },
    { id: 'blueprint', label: 'Architecture', icon: Info },
    { id: 'scripts', label: 'C# Scripts', icon: Terminal },
  ];

  return (
    <div id="app-root" className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full" />
      </div>

      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-bottom border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GhostIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">PACIFY ARCHITECT</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Multiplayer Horror Framework</p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
              <Download className="w-4 h-4" />
              EXPORT UNITY PKG
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto pt-12 pb-24 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'demo' && (
            <motion.div
              key="demo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid lg:grid-columns-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <Box className="w-3 h-3" />
                    Real-time Mechanics Simulation
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter">
                    BUILD THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">TERROR.</span>
                  </h2>
                  <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                    Experience the core gameplay loop: Burn dolls to weaken the monster, 
                    but be careful—each burn increases the monster's aggression and speed. 
                    Optimized for 100+ networked entities.
                  </p>
                  
                  <div className="grid grid-columns-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <ShieldAlert className="w-6 h-6 text-orange-500 mb-2" />
                      <h4 className="font-bold text-white mb-1">Object Pooling</h4>
                      <p className="text-xs text-slate-500">Dolls & VFX recycled to prevent GC spikes.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <Flame className="w-6 h-6 text-red-500 mb-2" />
                      <h4 className="font-bold text-white mb-1">State Sync</h4>
                      <p className="text-xs text-slate-500">Predictive networking for smooth co-op.</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <GameDemo />
                </div>
              </div>

              <div className="grid grid-columns-1 md:grid-columns-3 gap-6 pt-12 border-top border-white/5">
                {[
                  { title: "Lag-Free Movement", text: "Client-side prediction handles input immediately, neutralizing network jitter." },
                  { title: "AI FSM Optimized", text: "Monster logic only tics when players are in range to save CPU cycles." },
                  { title: "Dark Atmosphere", text: "High-performance shader-based fog and lighting for mobile & PC." }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'blueprint' && (
            <motion.div
              key="blueprint"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <Blueprint />
            </motion.div>
          )}

          {activeTab === 'scripts' && (
            <motion.div
              key="scripts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CSharpScripts />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-top border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 grayscale opacity-50">
            <img src="https://api.iconify.design/logos:unity.svg" className="h-6" alt="Unity" />
            <img src="https://api.iconify.design/logos:visual-studio-code.svg" className="h-6" alt="VS Code" />
          </div>
          <div className="text-slate-500 text-xs font-medium tracking-tight">
            © 2026 Pacify Architect Framework • Performance & High Fidelity Hardware Standard
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="bg-white/5 px-4 py-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-colors border border-white/5">
              DOCUMENTATION
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

