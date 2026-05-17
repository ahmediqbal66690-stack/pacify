import React from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Cpu, 
  Zap, 
  Layers, 
  ShieldCheck, 
  LineChart,
  HardDrive,
  Eye
} from 'lucide-react';

const MODULES = [
  {
    title: "MODULE 1: Multiplayer & Networking",
    icon: Network,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    details: [
      { label: "Architecture", value: "Server-Authoritative (Netcode for GameObjects)" },
      { label: "Synchronization", value: "Client-side Prediction & Interpolation" },
      { label: "Capacity", value: "Optimized for up to 4 low-latency players" }
    ],
    features: ["Lobby Matchmaking", "RPC Management", "State Replication"]
  },
  {
    title: "MODULE 2: Enemy AI State Machine",
    icon: Cpu,
    color: "text-red-500",
    bg: "bg-red-500/10",
    details: [
      { label: "Logic Pattern", value: "Finite State Machine (FSM)" },
      { label: "Detection", value: "Physical OverlapSphere / Raycasting" },
      { label: "NavMesh", value: "Optimized Dynamic Baking (Mobile/PC)" }
    ],
    features: ["Calm/Aggressive/Pacified States", "Line-of-Sight Check intervals", "NavMesh Waypointing"]
  },
  {
    title: "MODULE 3: Core Gameplay & Loop",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    details: [
      { label: "Interaction", value: "Generic Raycast-based RaycastSystem" },
      { label: "Item Economy", value: "Dolls, Keys, Inventory Management" },
      { label: "Win Condition", value: "Network-synced Global Variables" }
    ],
    features: ["Furnace State Sync", "Inventory HUD", "Event Broadcasting"]
  },
  {
    title: "MODULE 4: Level Design & Atmosphere",
    icon: Layers,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    details: [
      { label: "Lighting", value: "Baked GI + Real-time Spotlights" },
      { label: "VFX", value: "Volumetric Fog & Particle Systems" },
      { label: "Audio", value: "3D Spatial Audio & Reverb Zones" }
    ],
    features: ["Post-Processing Volume", "Occlusion Culling", "LOD Grouping"]
  },
  {
    title: "MODULE 5: Performance Anti-Lag",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    details: [
      { label: "Memory", value: "Strict Object Pooling for all collectibles" },
      { label: "Network Log", value: "Minimized RPC frequency per frame" },
      { label: "CPU", value: "Time-sliced AI updates (10Hz vs 60Hz)" }
    ],
    features: ["Garbage Collection minimization", "Culling Masks", "Network Transform Optimization"]
  }
];

export default function Blueprint() {
  return (
    <div id="architecture-blueprint" className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2 className="text-4xl font-black text-white mb-4">Technical Blueprint</h2>
        <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6" />
        <p className="text-slate-400 max-w-2xl text-lg">
          A modular, production-ready framework designed for low-latency synchronization 
          and high-fidelity horror immersion.
        </p>
      </div>

      <div className="grid md:grid-columns-2 lg:grid-columns-3 gap-8">
        {MODULES.map((module, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group"
          >
            <div className={`p-4 rounded-xl ${module.bg} w-fit mb-6 group-hover:scale-110 transition-transform`}>
              <module.icon className={`w-8 h-8 ${module.color}`} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-6 underline decoration-white/10 underline-offset-8">
              {module.title}
            </h3>

            <div className="space-y-4 mb-8">
              {module.details.map((detail, dIdx) => (
                <div key={dIdx} className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{detail.label}</span>
                  <span className="text-sm font-medium text-slate-300">{detail.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Key Features</h4>
              <div className="flex flex-wrap gap-2">
                {module.features.map((feature, fIdx) => (
                  <span key={fIdx} className="text-[11px] px-2 py-1 bg-white/5 rounded border border-white/5 text-slate-400">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 grid lg:grid-columns-2 gap-12 bg-white/5 p-12 rounded-3xl border border-white/10">
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <LineChart className="text-emerald-500" />
            Performance Scaling
          </h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            The architecture utilizes <b>Asynchronous State Management</b> on the server and <b>Predictive Movement</b> 
            on the client to handle high ping scenarios (up to 250ms) without visual teleportation.
          </p>
          <div className="space-y-4">
            {[
              "Tick-based server validation prevents speed hacks.",
              "Occlusion culling optimized for dark corridors.",
              "Aggressive mesh combining for static house props."
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-columns-2 gap-4">
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <Eye className="w-8 h-8 text-blue-500 mb-3" />
            <span className="text-2xl font-black text-white">100+</span>
            <span className="text-xs font-bold text-slate-500 uppercase">Synced Objects</span>
          </div>
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <HardDrive className="w-8 h-8 text-emerald-500 mb-3" />
            <span className="text-2xl font-black text-white">0.5ms</span>
            <span className="text-xs font-bold text-slate-500 uppercase">AI Frame Time</span>
          </div>
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 col-span-2 flex flex-col items-center justify-center text-center">
            <Zap className="w-8 h-8 text-orange-500 mb-3" />
            <span className="text-2xl font-black text-white">LAG-FREE</span>
            <span className="text-xs font-bold text-slate-500 uppercase">Networking Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
