import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  Text,
  Float,
  PerspectiveCamera,
  BakeShadows,
  AdaptiveDpr,
  KeyboardControls,
  useKeyboardControls,
  Box,
  Cylinder,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ghost, 
  Flame, 
  Zap, 
  AlertTriangle, 
  Package, 
  MousePointer2, 
  Key as KeyIcon,
  Unlock,
  Lock,
  Skull
} from 'lucide-react';
import { audioManager } from '../services/audioManager';

const MOVEMENT_SPEED = 7.5;
const MONSTER_BASE_SPEED = 4.2;
const MAZE_SIZE = 60;
const WALL_HEIGHT = 5.0;
const ACCELERATION = 40;
const FRICTION = 8;
const MAX_STAMINA = 100;

type Wing = 'CENTRAL' | 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA' | 'BASEMENT';

const WING_COLORS: Record<string, string> = {
  CENTRAL: "#333",
  ALPHA: "#3b82f6", // Blue
  BETA: "#ef4444",  // Red
  GAMMA: "#10b981", // Emerald
  DELTA: "#a855f7", // Purple
  BASEMENT: "#111"
};

const WALLS = [
  // Outer Perimeter
  { pos: [0, WALL_HEIGHT/2, MAZE_SIZE/2], size: [MAZE_SIZE, WALL_HEIGHT, 1] },
  { pos: [0, WALL_HEIGHT/2, -MAZE_SIZE/2], size: [MAZE_SIZE, WALL_HEIGHT, 1] },
  { pos: [MAZE_SIZE/2, WALL_HEIGHT/2, 0], size: [1, WALL_HEIGHT, MAZE_SIZE] },
  { pos: [-MAZE_SIZE/2, WALL_HEIGHT/2, 0], size: [1, WALL_HEIGHT, MAZE_SIZE] },
  
  // Wing Separators
  { pos: [0, WALL_HEIGHT/2, 0], size: [2, WALL_HEIGHT, MAZE_SIZE] },
  { pos: [0, WALL_HEIGHT/2, 0], size: [MAZE_SIZE, WALL_HEIGHT, 2] },
];

const DOORS = [
  { id: 'ALPHA', pos: [5, WALL_HEIGHT/2, 5], size: [4, WALL_HEIGHT, 0.5], color: WING_COLORS.ALPHA },
  { id: 'BETA', pos: [-5, WALL_HEIGHT/2, 5], size: [4, WALL_HEIGHT, 0.5], color: WING_COLORS.BETA },
  { id: 'GAMMA', pos: [-5, WALL_HEIGHT/2, -5], size: [4, WALL_HEIGHT, 0.5], color: WING_COLORS.GAMMA },
  { id: 'DELTA', pos: [5, WALL_HEIGHT/2, -5], size: [4, WALL_HEIGHT, 0.5], color: WING_COLORS.DELTA },
];

function Wall({ pos, size, color = "#0f0f0f" }: any) {
  return (
    <Box position={pos} args={size} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={1} metalness={0.2} />
    </Box>
  );
}

function Door({ door, unlocked }: { door: any, unlocked: boolean }) {
  if (unlocked) return null;
  return (
    <group position={door.pos}>
      <Box args={door.size} castShadow>
        <meshStandardMaterial color={door.color} transparent opacity={0.6} emissive={door.color} emissiveIntensity={0.8} />
      </Box>
      <Text position={[0, 1.5, 1]} fontSize={0.6} color="white">ACCESS DENIED</Text>
    </group>
  );
}

function WingKey({ wing, position, onPickUp }: { wing: string, position: [number, number, number], onPickUp: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current) {
      const dist = camera.position.distanceTo(ref.current.position);
      if (dist < 1.5) onPickUp();
    }
  });

  return (
    <group ref={ref} position={position}>
      <Float speed={5} rotationIntensity={2}>
        <mesh castShadow>
          <torusGeometry args={[0.3, 0.1, 8, 24]} />
          <meshStandardMaterial color={WING_COLORS[wing]} emissive={WING_COLORS[wing]} emissiveIntensity={5} />
        </mesh>
      </Float>
      <pointLight color={WING_COLORS[wing]} intensity={10} distance={5} />
    </group>
  );
}

function Relic({ position, onPickUp }: { position: [number, number, number], onPickUp: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current) {
      const dist = camera.position.distanceTo(ref.current.position);
      if (dist < 1.5) onPickUp();
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#ff7700" emissive="#552200" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#ff7700" intensity={8} distance={6} />
    </group>
  );
}

function Monster({ enrageLevel, isEnragedHunt, isStunned, onKill, startTime }: any) {
  const ref = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const [lastHeartbeat, setLastHeartbeat] = useState(0);
  const [state, setState] = useState<'SLEEPING' | 'WANDERING' | 'CHASING' | 'ROARING'>('SLEEPING');
  const [roarStartTime, setRoarStartTime] = useState(0);
  const [wanderTarget, setWanderTarget] = useState(new THREE.Vector3());

  const speed = isStunned ? 0 : (MONSTER_BASE_SPEED + (enrageLevel * 0.9) + (isEnragedHunt ? 4 : 0));

  useFrame((clockState, delta) => {
    if (!ref.current || isStunned) return;

    const et = clockState.clock.getElapsedTime();
    const gameTime = et - startTime;

    // Grace Period (15s)
    if (gameTime < 15) {
      if (state !== 'SLEEPING') setState('SLEEPING');
      ref.current.position.set(28, 2, 28);
      return;
    }

    // State Transitions
    const dist = camera.position.distanceTo(ref.current.position);
    
    // Simple Line of Sight + Distance checking
    const isInChaseRange = dist < 25;
    const isVisible = true; // Simple logic: if in range, its chasing for now to keep code compact but could be improved

    if (isEnragedHunt && state !== 'ROARING' && state !== 'CHASING') {
      audioManager.playRoar();
      setState('ROARING');
      setRoarStartTime(et);
    }

    if (state === 'ROARING') {
      if (et - roarStartTime > 3) {
        setState('CHASING');
      }
      return;
    }

    if (state === 'SLEEPING') setState('WANDERING');

    if (state === 'WANDERING') {
      if (isInChaseRange) setState('CHASING');
      
      if (ref.current.position.distanceTo(wanderTarget) < 1) {
        setWanderTarget(new THREE.Vector3((Math.random()-0.5)*MAZE_SIZE, 2, (Math.random()-0.5)*MAZE_SIZE));
      }
      ref.current.lookAt(wanderTarget);
      ref.current.translateZ(speed * 0.5 * delta);
    } else if (state === 'CHASING') {
      const isPlayerCrouched = camera.position.y < 1.2;
      const isHiding = dist > 12 && isPlayerCrouched; // Simple LoS break if dist is decent and crouched

      if (dist > 35 || isHiding) setState('WANDERING');
      
      const targetPos = camera.position.clone();
      targetPos.y = 2.0;
      ref.current.lookAt(targetPos);
      ref.current.translateZ(speed * delta);
    }

    // Proximity heartbeats and audio cues
    if (dist < 18) {
      const heatbeatFreq = Math.max(0.15, (dist / 18));
      if (et - lastHeartbeat > heatbeatFreq) {
        audioManager.playHeartbeat(1 - (dist / 18));
        setLastHeartbeat(et);
      }
    }

    // Shrink Hitbox: 1.4 -> 0.8
    if (dist < 0.8) {
      audioManager.playScream();
      onKill();
    }
  });

  return (
    <mesh ref={ref} position={[28, 2, 28]} castShadow>
      <octahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial 
        color={state === 'ROARING' || isEnragedHunt ? "#ff0000" : (isStunned ? "#111" : "#333")} 
        emissive={state === 'ROARING' || isEnragedHunt ? "#ff0000" : (isStunned ? "#000" : "#222")}
        emissiveIntensity={isEnragedHunt ? 12 : 2}
        wireframe={!isStunned}
      />
      {!isStunned && <pointLight color={isEnragedHunt || state === 'ROARING' ? "red" : "white"} intensity={30} distance={18} />}
      {(isEnragedHunt || state === 'ROARING') && (
        <Float speed={10} floatIntensity={5}>
          <Text position={[0, 4, 0]} fontSize={0.8} color="red">{state === 'ROARING' ? 'THE BEAST AWAKENS' : 'SLAUGHTER MODE'}</Text>
        </Float>
      )}
    </mesh>
  );
}

function PlayerMovement({ unlockedWings, onMove, stamina, setStamina }: any) {
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const inputVelocity = useRef(new THREE.Vector3());
  const [lastStep, setLastStep] = useState(0);

  useFrame((state, delta) => {
    const { forward, backward, left, right, shift, crouch } = getKeys();
    
    // Sprinting & Crouching Logic
    const isCrouched = crouch;
    const isSprinting = shift && stamina > 0 && (forward || backward || left || right) && !isCrouched;
    
    if (isSprinting) {
      setStamina((s: number) => Math.max(0, s - 20 * delta));
    } else {
      setStamina((s: number) => Math.min(MAX_STAMINA, s + (isCrouched ? 15 : 10) * delta));
    }

    const currentSpeed = MOVEMENT_SPEED * (isSprinting ? 1.6 : (isCrouched ? 0.4 : 1.0));
    const targetHeight = isCrouched ? 1.0 : 1.8;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight, 10 * delta);
    
    // Direction calculation
    const direction = new THREE.Vector3();
    const fv = (backward ? 1 : 0) - (forward ? 1 : 0);
    const sv = (left ? 1 : 0) - (right ? 1 : 0);
    
    const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
    const sideVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    forwardVec.y = 0; sideVec.y = 0;
    forwardVec.normalize(); sideVec.normalize();

    direction.addScaledVector(forwardVec, fv);
    direction.addScaledVector(sideVec, sv);
    direction.normalize();

    // Acceleration & Friction
    if (direction.length() > 0) {
      inputVelocity.current.lerp(direction.multiplyScalar(currentSpeed), ACCELERATION * delta);
    } else {
      inputVelocity.current.lerp(new THREE.Vector3(), FRICTION * delta);
    }

    velocity.current.copy(inputVelocity.current);
    camera.position.addScaledVector(velocity.current, delta);

    if (velocity.current.length() > 1.0) {
      const stepFreq = isSprinting ? 0.25 : (isCrouched ? 0.75 : 0.45);
      if (state.clock.getElapsedTime() - lastStep > stepFreq) {
        audioManager.playFootstep();
        setLastStep(state.clock.getElapsedTime());
      }
    }

    // Boundary check
    camera.position.x = Math.max(-MAZE_SIZE/2 + 1, Math.min(MAZE_SIZE/2 - 1, camera.position.x));
    camera.position.z = Math.max(-MAZE_SIZE/2 + 1, Math.min(MAZE_SIZE/2 - 1, camera.position.z));

    // Collision Detection
    const checkCollision = (p: THREE.Vector3, boxPos: number[], boxSize: number[]) => {
      const buffer = 1.0;
      return Math.abs(p.x - boxPos[0]) < boxSize[0]/2 + buffer && 
             Math.abs(p.z - boxPos[2]) < boxSize[2]/2 + buffer;
    };

    // Walls
    WALLS.forEach(w => {
      if (checkCollision(camera.position, w.pos, w.size)) {
        const dx = camera.position.x - w.pos[0];
        const dz = camera.position.z - w.pos[2];
        if (Math.abs(dx)/w.size[0] > Math.abs(dz)/w.size[2]) {
          camera.position.x = w.pos[0] + (w.size[0]/2 + 1.0) * Math.sign(dx);
        } else {
          camera.position.z = w.pos[2] + (w.size[2]/2 + 1.0) * Math.sign(dz);
        }
      }
    });

    // Doors
    DOORS.forEach(d => {
      if (!unlockedWings.includes(d.id as Wing) && checkCollision(camera.position, d.pos, d.size)) {
        const dx = camera.position.x - d.pos[0];
        const dz = camera.position.z - d.pos[2];
        if (Math.abs(dx)/d.size[0] > Math.abs(dz)/d.size[2]) {
            camera.position.x = d.pos[0] + (d.size[0]/2 + 1.0) * Math.sign(dx);
          } else {
            camera.position.z = d.pos[2] + (d.size[2]/2 + 1.0) * Math.sign(dz);
          }
      }
    });

    camera.position.y = 1.8;
    onMove(camera.position.clone());
  });

  return null;
}

export default function GameDemo() {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'WIN' | 'FAIL'>('IDLE');
  const [relicsBurned, setRelicsBurned] = useState(0);
  const [isEnragedHunt, setIsEnragedHunt] = useState(false);
  const [unlockedWings, setUnlockedWings] = useState<string[]>(['CENTRAL']);
  const [inventory, setInventory] = useState<{type: string, wing?: string} | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isStunned, setIsStunned] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3());
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [startTime, setStartTime] = useState(0);

  const addLog = (m: string) => setLogs(prev => [m, ...prev].slice(0, 6));

  useEffect(() => {
    if (gameState === 'PLAYING') {
      audioManager.init();
      setStartTime(performance.now() / 1000);
    } else {
      audioManager.stop();
    }
  }, [gameState]);

  const startMission = () => {
    setRelicsBurned(0);
    setInventory(null);
    setIsStunned(false);
    setUnlockedWings(['CENTRAL']);
    setGameState('PLAYING');
    setIsEnragedHunt(false);
    
    // Procedural Item Spawning for playtime extension
    const i: any[] = [
      { type: 'KEY', wing: 'ALPHA', pos: [8, 0.5, 12] },
      { type: 'KEY', wing: 'BETA', pos: [22, 0.5, 20] },
      { type: 'KEY', wing: 'GAMMA', pos: [-22, 0.5, 20] },
      { type: 'KEY', wing: 'DELTA', pos: [-22, 0.5, -20] },
      { type: 'BATTERY', pos: [12, 0.5, -12] },
      { type: 'BATTERY', pos: [-12, 0.5, -12] },
    ];

    // Cursed Relics across all wings
    // Alpha
    i.push({ type: 'RELIC', pos: [22, 0.5, 25] });
    i.push({ type: 'RELIC', pos: [15, 0.5, 22] });
    // Beta
    i.push({ type: 'RELIC', pos: [-22, 0.5, 25] });
    i.push({ type: 'RELIC', pos: [-15, 0.5, 22] });
    // Gamma
    i.push({ type: 'RELIC', pos: [-22, 0.5, -25] });
    i.push({ type: 'RELIC', pos: [-15, 0.5, -22] });
    // Delta
    i.push({ type: 'RELIC', pos: [22, 0.5, -25] });
    i.push({ type: 'RELIC', pos: [15, 0.5, -22] });
    // Central secret
    i.push({ type: 'RELIC', pos: [0, 0.5, 0] });

    setItems(i);
    addLog("FACILITY DEPLOYED.");
    addLog("OBJECTIVE: BURN 9 RELICS IN BASEMENT EXTRACTION.");
  };

  const handleBurn = () => {
    if (inventory?.type === 'RELIC') {
      setInventory(null);
      setRelicsBurned(v => {
        const next = v + 1;
        if (next >= 9) setGameState('WIN');
        return next;
      });
      audioManager.playBurn();
      addLog("RELIC CONSUMED. ENRAGED HUNT IMMINENT!");
      setIsEnragedHunt(true);
      setTimeout(() => setIsEnragedHunt(false), 30000); // 30s hunt
    }
  };

  const handlePickUp = (item: any, idx: number) => {
    if (!inventory) {
      if (item.type === 'KEY') {
        setUnlockedWings(prev => [...prev, item.wing]);
        addLog(`${item.wing} WING ACCESS GRANTED.`);
        setInventory({ type: 'KEY', wing: item.wing });
      } else {
        setInventory({ type: item.type });
        addLog(`${item.type} ACQUIRED.`);
      }
      setItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const onKill = () => {
    if (inventory?.type === 'BATTERY') {
      setInventory(null);
      setIsStunned(true);
      addLog("SENSORS DISRUPTED. BEAST STUNNED.");
      setTimeout(() => setIsStunned(false), 6000);
    } else {
      setGameState('FAIL');
    }
  };

  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["w", "W", "ArrowUp"] },
        { name: "backward", keys: ["s", "S", "ArrowDown"] },
        { name: "left", keys: ["a", "A", "ArrowLeft"] },
        { name: "right", keys: ["d", "D", "ArrowRight"] },
        { name: "shift", keys: ["Shift"] },
        { name: "crouch", keys: ["c", "C"] },
      ]}
    >
      <div className="relative w-full h-[780px] bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl group cursor-crosshair">
        
        {/* HUD UI */}
        {gameState === 'PLAYING' && (
          <div className="absolute inset-x-12 top-12 z-20 flex justify-between pointer-events-none">
            <div className="space-y-6">
              <div className="bg-black/90 backdrop-blur-3xl border border-white/10 px-8 py-5 rounded-[40px] flex items-center gap-6 shadow-2xl">
                <Flame className={`w-10 h-10 ${relicsBurned > 0 ? 'text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'text-slate-800'}`} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cursed Harvest</p>
                  <p className="text-4xl font-black text-white">{relicsBurned} <span className="text-slate-700 text-xl">/ 9</span></p>
                </div>
              </div>

              <div className="w-64 space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Metabolic Stability</p>
                  <p className="text-[10px] font-black text-white">{Math.round(stamina)}%</p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${stamina}%`, backgroundColor: stamina < 25 ? '#ef4444' : '#ffffff' }}
                    className="h-full bg-white" 
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                {['ALPHA', 'BETA', 'GAMMA', 'DELTA'].map(wing => (
                  <div key={wing} className={`bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 transition-opacity ${unlockedWings.includes(wing) ? 'opacity-100' : 'opacity-20'}`}>
                    {unlockedWings.includes(wing) ? <Unlock className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-slate-600" />}
                    <span className="text-[10px] font-black text-white tracking-widest">{wing}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-4 max-w-xs">
              <AnimatePresence>
                {isEnragedHunt && (
                  <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="flex items-center gap-4 bg-red-600/20 backdrop-blur-xl px-8 py-4 rounded-3xl border border-red-600/50"
                  >
                    <Skull className="w-8 h-8 text-red-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Global Alert</span>
                      <span className="text-lg font-black text-white italic">HUNTING STATE ACTIVE</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 text-right">
                {logs.map((log, i) => (
                  <motion.div key={i} layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 - i*0.15 }} className="px-5 py-2 bg-black/40 rounded-full border border-white/5 text-[10px] font-bold text-slate-400">
                    {log}
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {inventory && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className={`mt-10 p-8 rounded-[40px] border bg-black/90 backdrop-blur-3xl shadow-2xl ${inventory.type === 'RELIC' ? 'border-orange-500/40 shadow-orange-950/20' : 'border-blue-500/40 shadow-blue-950/20'}`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                       {inventory.type === 'RELIC' ? <Package className="w-6 h-6 text-orange-500" /> : <KeyIcon className="w-6 h-6 text-blue-500" />}
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Payload</span>
                    </div>
                    <p className="text-xl font-black text-white italic tracking-tighter uppercase">{inventory.type} {inventory.wing && `_${inventory.wing}`}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-white/30 rounded-full border border-white/10" />
          </div>
        )}

        <Canvas shadows dpr={[1, 2]}>
          <color attach="background" args={["#000"]} />
          <fog attach="fog" args={["#000", 2, 28]} />
          
          <PerspectiveCamera makeDefault fov={80} />
          {gameState === 'PLAYING' && <PointerLockControls pointerSpeed={0.5} />}
          
          {gameState === 'PLAYING' && (
            <>
              <ambientLight intensity={0.02} />
              <Flashlight />
              
              <PlayerMovement 
                unlockedWings={unlockedWings} 
                onMove={setPlayerPos}
                stamina={stamina}
                setStamina={setStamina}
              />
              <Monster 
                enrageLevel={relicsBurned} 
                isEnragedHunt={isEnragedHunt}
                isStunned={isStunned}
                onKill={onKill}
                startTime={startTime}
              />
              
              {/* Bot Simulation */}
              <Bot teammateId={1} startPos={[10, 0, 10]} onKey={() => {}} />
              <Bot teammateId={2} startPos={[-10, 0, 10]} onKey={() => {}} />

              {items.map((it, idx) => (
                it.type === 'RELIC' ? (
                  <Relic key={`rel-${idx}`} position={it.pos} onPickUp={() => handlePickUp(it, idx)} />
                ) : it.type === 'KEY' ? (
                  <WingKey key={`key-${idx}`} wing={it.wing} position={it.pos} onPickUp={() => handlePickUp(it, idx)} />
                ) : (
                  <Battery key={`bat-${idx}`} position={it.pos} onPickUp={() => handlePickUp(it, idx)} />
                )
              ))}

              <BasementExtraction hasRelic={inventory?.type === 'RELIC'} onBurn={handleBurn} />
            </>
          )}

          <WorldStructure unlockedWings={unlockedWings} />
          <Environment preset="night" />
          <AdaptiveDpr pixelated />
          <BakeShadows />
        </Canvas>

        {isEnragedHunt && <div className="absolute inset-0 z-30 bg-red-950/20 pointer-events-none animate-pulse" />}
        
        <AnimatePresence>
          {gameState !== 'PLAYING' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-[#000] flex flex-col items-center justify-center p-12 text-center"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute inset-0 bg-gradient-to-t from-red-950/30 to-transparent pointer-events-none"
              />
              
              <div className="relative z-10">
                <TextReveal text="PACIFY_SYSTEM" className="text-[120px] font-black text-white italic tracking-tighter opacity-10" />
                <h1 className="text-8xl font-black text-white italic tracking-tighter mb-4 -mt-16">SCAVENGER.</h1>
                
                {gameState === 'IDLE' && (
                  <div className="max-w-md mx-auto space-y-12">
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Deep Facility Harvest Protocol</p>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      Navigate the labyrinth. Unlock Alpha to Delta wings. Secure 9 relics. 
                      Burn them in the basement extraction pod. 
                      Death is permanent. Speed is essential.
                    </p>
                  </div>
                )}

                {gameState === 'FAIL' && <div className="text-red-500 text-6xl font-black mb-8 animate-pulse tracking-widest uppercase">Captured.</div>}
                {gameState === 'WIN' && <div className="text-emerald-500 text-6xl font-black mb-8 tracking-widest uppercase">Extracted.</div>}

                <div className="mt-16 space-y-4">
                  <button 
                    onClick={startMission}
                    className="group relative bg-white text-black px-24 py-6 rounded-full font-black text-2xl transition-all duration-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_50px_rgba(220,38,38,0.4)]"
                  >
                    <span className="relative z-10">{gameState === 'IDLE' ? 'INITIATE PROTOCOL' : 'RESET CYCLE'}</span>
                    <div className="absolute inset-0 rounded-full bg-white group-hover:scale-110 transition-transform -z-10" />
                  </button>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-4">Press Click to Lock Camera • WASD to Move</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </KeyboardControls>
  );
}

function Flashlight() {
  const { camera } = useThree();
  const lightRef = useRef<THREE.SpotLight>(null!);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useEffect(() => {
    camera.add(lightRef.current);
    camera.add(targetRef.current);
    lightRef.current.target = targetRef.current;
    targetRef.current.position.set(0, 0, -5);
  }, [camera]);

  return (
    <>
      <spotLight
        ref={lightRef}
        castShadow
        intensity={10}
        distance={25}
        angle={Math.PI / 7}
        penumbra={0.3}
        decay={2}
        shadow-mapSize={[1024, 1024]}
        color="#fff4e0"
      />
    </>
  );
}

function BasementExtraction({ hasRelic, onBurn }: { hasRelic: boolean, onBurn: () => void }) {
  const ref = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current && hasRelic) {
      const dist = camera.position.distanceTo(ref.current.position);
      if (dist < 4.5) onBurn();
    }
  });

  return (
    <group ref={ref} position={[0, 0.1, -26]}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5.5, 1.5, 32]} />
        <meshStandardMaterial color="#080808" metalness={1} roughness={0.1} />
      </mesh>
      <pointLight position={[0, 4, 0]} color="#ff5500" intensity={40} distance={20} />
      <Text position={[0, 7, 0]} fontSize={1} color="#ff5500" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">EXTRACTION UNIT</Text>
      <Float speed={2} floatIntensity={0.5}>
        <mesh position={[0, 2, 0]}>
          <ringGeometry args={[4.5, 4.8, 32]} />
          <meshStandardMaterial color="#ff5500" emissive="#ff2200" emissiveIntensity={5} transparent opacity={0.4} />
        </mesh>
      </Float>
    </group>
  );
}

function WorldStructure({ unlockedWings }: { unlockedWings: string[] }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#020202" roughness={1} />
      </mesh>
      
      {WALLS.map((w, i) => (
        <Wall key={i} pos={w.pos} size={w.size} />
      ))}

      {DOORS.map((d, i) => (
        <Door key={i} door={d} unlocked={unlockedWings.includes(d.id)} />
      ))}
      
      {/* Structural Pillars */}
      {[...Array(4)].map((_, i) => (
         <Box key={i} position={[(i%2 ? 10 : -10), 2.5, (i<2 ? 10 : -10)]} args={[2, 5, 2]}>
            <meshStandardMaterial color="#080808" />
         </Box>
      ))}
    </>
  );
}

function Battery({ position, onPickUp }: { position: [number, number, number], onPickUp: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current) {
      const dist = camera.position.distanceTo(ref.current.position);
      if (dist < 1.5) onPickUp();
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.5, 0.3]} />
        <meshStandardMaterial color="#3b82f6" emissive="#002255" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#3b82f6" intensity={8} distance={6} />
    </group>
  );
}

function Bot({ teammateId, startPos, onKey }: any) {
  const ref = useRef<THREE.Group>(null!);
  const target = useRef(new THREE.Vector3(startPos[0], 0, startPos[2]));
  const [holding, setHolding] = useState<string | null>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const d = ref.current.position.distanceTo(target.current);
    if (d < 1.0) {
      target.current.set((Math.random()-0.5)*MAZE_SIZE, 0, (Math.random()-0.5)*MAZE_SIZE);
    }
    
    const dir = target.current.clone().sub(ref.current.position).normalize();
    ref.current.position.addScaledVector(dir, 4.0 * delta);
    ref.current.lookAt(target.current);
    ref.current.position.y = 1.0;
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
        <meshStandardMaterial color="#444" roughness={0} metalness={1} />
      </mesh>
      <Text position={[0, 2, 0]} fontSize={0.3} color="#666">SQUAD_0{teammateId}</Text>
    </group>
  );
}

function TextReveal({ text, className }: any) {
  return (
    <div className={className}>
      {text.split('').map((char: string, i: number) => (
        <span key={i} className="inline-block hover:text-red-600 transition-colors cursor-default">{char}</span>
      ))}
    </div>
  );
}
