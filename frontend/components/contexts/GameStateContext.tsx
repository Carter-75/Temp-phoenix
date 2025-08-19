import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  health: number;
  maxHealth: number;
  coins: number;
}

export interface AttackMove {
  id: string;
  name: string;
  type: 'hold' | 'double' | 'triple';
  damage: number;
  cooldown: number;
  cost: number;
  description: string;
  color: string;
  isOwned: boolean;
  isEquipped: boolean;
}

export interface WorldProgress {
  worldId: number;
  unlocked: boolean;
  completed: boolean;
  bestTime: number;
  highScore: number;
}

export interface GameState {
  playerStats: PlayerStats;
  equippedMoves: {
    hold: AttackMove | null;
    double: AttackMove | null;
    triple: AttackMove | null;
  };
  availableMoves: AttackMove[];
  worldProgress: WorldProgress[];
  deathCount: number;
  currentWorld: number;
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

const initialGameState: GameState = {
  playerStats: {
    level: 1,
    xp: 0,
    xpToNext: 100,
    health: 100,
    maxHealth: 100,
    coins: 50,
  },
  equippedMoves: {
    hold: null,
    double: null,
    triple: null,
  },
  availableMoves: [],
  worldProgress: Array.from({ length: 10 }, (_, i) => ({
    worldId: i + 1,
    unlocked: i === 0,
    completed: false,
    bestTime: 0,
    highScore: 0,
  })),
  deathCount: 0,
  currentWorld: 1,
  settings: {
    soundEnabled: true,
    musicEnabled: true,
  },
};

interface GameStateContextType {
  gameState: GameState;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  equipMove: (move: AttackMove) => void;
  purchaseMove: (move: AttackMove) => boolean;
  unlockWorld: (worldId: number) => void;
  completeWorld: (worldId: number, time: number, score: number) => void;
  setCurrentWorld: (worldId: number) => void;
  gainXP: (amount: number) => void;
  gainCoins: (amount: number) => void;
  onPlayerDeath: () => void;
  updateSettings: (settings: Partial<typeof initialGameState.settings>) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetProgress: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Initialize available moves with starter moves
  useEffect(() => {
    const starterMoves = generateStarterMoves();
    setGameState(prev => ({
      ...prev,
      availableMoves: [...starterMoves, ...generateShopMoves()],
      equippedMoves: {
        hold: starterMoves.find(m => m.type === 'hold') || null,
        double: starterMoves.find(m => m.type === 'double') || null,
        triple: starterMoves.find(m => m.type === 'triple') || null,
      },
    }));
    loadGame();
  }, []);

  const updatePlayerStats = (stats: Partial<PlayerStats>) => {
    setGameState(prev => ({
      ...prev,
      playerStats: { ...prev.playerStats, ...stats },
    }));
  };

  const equipMove = (move: AttackMove) => {
    setGameState(prev => {
      const updatedMoves = prev.availableMoves.map(m => ({
        ...m,
        isEquipped: m.type === move.type ? m.id === move.id : m.isEquipped,
      }));

      return {
        ...prev,
        availableMoves: updatedMoves,
        equippedMoves: {
          ...prev.equippedMoves,
          [move.type]: move,
        },
      };
    });
  };

  const purchaseMove = (move: AttackMove): boolean => {
    if (gameState.playerStats.coins >= move.cost) {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          coins: prev.playerStats.coins - move.cost,
        },
        availableMoves: prev.availableMoves.map(m =>
          m.id === move.id ? { ...m, isOwned: true } : m
        ),
      }));
      return true;
    }
    return false;
  };

  const unlockWorld = (worldId: number) => {
    setGameState(prev => ({
      ...prev,
      worldProgress: prev.worldProgress.map(w =>
        w.worldId === worldId ? { ...w, unlocked: true } : w
      ),
    }));
  };

  const completeWorld = (worldId: number, time: number, score: number) => {
    setGameState(prev => {
      const updatedProgress = prev.worldProgress.map(w => {
        if (w.worldId === worldId) {
          return {
            ...w,
            completed: true,
            bestTime: w.bestTime === 0 ? time : Math.min(w.bestTime, time),
            highScore: Math.max(w.highScore, score),
          };
        }
        return w;
      });

      // Unlock next world
      const nextWorldId = worldId + 1;
      if (nextWorldId <= 10) {
        updatedProgress.forEach(w => {
          if (w.worldId === nextWorldId) {
            w.unlocked = true;
          }
        });
      }

      return {
        ...prev,
        worldProgress: updatedProgress,
      };
    });
  };

  const setCurrentWorld = (worldId: number) => {
    setGameState(prev => ({
      ...prev,
      currentWorld: worldId,
    }));
  };

  const gainXP = (amount: number) => {
    setGameState(prev => {
      let newXP = prev.playerStats.xp + amount;
      let newLevel = prev.playerStats.level;
      let newMaxHealth = prev.playerStats.maxHealth;
      let xpToNext = prev.playerStats.xpToNext;
      let leveledUp = false;

      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        newMaxHealth += 10; // Health increases with level
        xpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
        leveledUp = true;
      }

      // Play level up sound if available
      if (leveledUp && (global as any).gameSounds?.playLevelUp) {
        (global as any).gameSounds.playLevelUp();
      }

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          xp: newXP,
          level: newLevel,
          maxHealth: newMaxHealth,
          health: leveledUp ? newMaxHealth : prev.playerStats.health, // Full heal on level up
          xpToNext,
        },
      };
    });
  };

  const gainCoins = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        coins: prev.playerStats.coins + amount,
      },
    }));
  };

  const onPlayerDeath = () => {
    setGameState(prev => ({
      ...prev,
      deathCount: prev.deathCount + 1,
    }));
  };

  const updateSettings = (settings: Partial<typeof initialGameState.settings>) => {
    setGameState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const saveGame = async () => {
    try {
      await AsyncStorage.setItem('phoenixGameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  };

  const loadGame = async () => {
    try {
      const savedGame = await AsyncStorage.getItem('phoenixGameState');
      if (savedGame) {
        const parsedGame = JSON.parse(savedGame);
        setGameState({ ...initialGameState, ...parsedGame });
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  const resetProgress = () => {
    setGameState(initialGameState);
    AsyncStorage.removeItem('phoenixGameState');
  };

  return (
    <GameStateContext.Provider value={{
      gameState,
      updatePlayerStats,
      equipMove,
      purchaseMove,
      unlockWorld,
      completeWorld,
      setCurrentWorld,
      gainXP,
      gainCoins,
      onPlayerDeath,
      updateSettings,
      saveGame,
      loadGame,
      resetProgress,
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}

// Helper function to generate starter moves
function generateStarterMoves(): AttackMove[] {
  return [
    // Hold moves (1 starter)
    {
      id: 'hold_1',
      name: 'Phoenix Inferno',
      type: 'hold',
      damage: 50,
      cooldown: 8000,
      cost: 0,
      description: 'Channel a massive fire beam',
      color: '#ff4444',
      isOwned: true,
      isEquipped: true,
    },
    // Double click moves (1 starter)
    {
      id: 'double_1',
      name: 'Fire Dart',
      type: 'double',
      damage: 15,
      cooldown: 1500,
      cost: 0,
      description: 'Quick fire projectile',
      color: '#ff6644',
      isOwned: true,
      isEquipped: true,
    },
    // Triple click moves (1 starter)
    {
      id: 'triple_1',
      name: 'Phoenix Strike',
      type: 'triple',
      damage: 35,
      cooldown: 4000,
      cost: 0,
      description: 'Powerful flame burst',
      color: '#ff8844',
      isOwned: true,
      isEquipped: true,
    },
  ];
}

// Generate additional shop moves
function generateShopMoves(): AttackMove[] {
  const moves: AttackMove[] = [];
  
  // Hold moves (24 additional moves)
  const holdMoves = [
    { name: 'Dragon\'s Breath', damage: 75, cooldown: 10000, cost: 100, description: 'Intense flame torrent' },
    { name: 'Solar Flare', damage: 100, cooldown: 12000, cost: 200, description: 'Blinding solar energy' },
    { name: 'Inferno Wave', damage: 125, cooldown: 15000, cost: 350, description: 'Devastating fire wave' },
    { name: 'Phoenix Nova', damage: 150, cooldown: 18000, cost: 500, description: 'Explosive nova blast' },
    { name: 'Cosmic Fire', damage: 200, cooldown: 20000, cost: 750, description: 'Otherworldly flames' },
    { name: 'Void Flame', damage: 225, cooldown: 22000, cost: 1000, description: 'Flames from the void' },
    { name: 'Divine Wrath', damage: 250, cooldown: 25000, cost: 1300, description: 'Righteous fire' },
    { name: 'Eternal Burn', damage: 300, cooldown: 30000, cost: 1800, description: 'Flames that never die' },
    { name: 'Star Fire', damage: 350, cooldown: 35000, cost: 2500, description: 'Fire of a dying star' },
    { name: 'Genesis Flame', damage: 400, cooldown: 40000, cost: 3500, description: 'The first flame of creation' },
    { name: 'Apocalypse Beam', damage: 450, cooldown: 45000, cost: 5000, description: 'End of worlds' },
    { name: 'Phoenix Rebirth', damage: 500, cooldown: 50000, cost: 7000, description: 'Rise from ashes' },
    { name: 'Celestial Pyre', damage: 600, cooldown: 60000, cost: 10000, description: 'Heaven\'s fire' },
    { name: 'Quantum Flame', damage: 700, cooldown: 70000, cost: 15000, description: 'Fire beyond reality' },
    { name: 'Omega Blaze', damage: 800, cooldown: 80000, cost: 20000, description: 'The final flame' },
    { name: 'Primordial Fire', damage: 1000, cooldown: 100000, cost: 30000, description: 'Fire before time' },
    { name: 'Universal Burn', damage: 1200, cooldown: 120000, cost: 45000, description: 'Burn all existence' },
    { name: 'Infinity Flame', damage: 1500, cooldown: 150000, cost: 75000, description: 'Endless burning' },
    { name: 'Reality Melt', damage: 2000, cooldown: 180000, cost: 100000, description: 'Melt reality itself' },
    { name: 'God Slayer', damage: 2500, cooldown: 200000, cost: 150000, description: 'Even gods fear this flame' },
    { name: 'Transcendent Fire', damage: 3000, cooldown: 240000, cost: 200000, description: 'Beyond mortal comprehension' },
    { name: 'Absolute Zero-Sum', damage: 4000, cooldown: 300000, cost: 300000, description: 'The ultimate paradox' },
    { name: 'Phoenix Singularity', damage: 5000, cooldown: 360000, cost: 500000, description: 'Collapse into flame' },
    { name: 'Eternal Phoenix', damage: 10000, cooldown: 600000, cost: 1000000, description: 'The phoenix that burns forever' },
  ];

  // Double click moves (24 additional moves)
  const doubleMoves = [
    { name: 'Flame Burst', damage: 20, cooldown: 1200, cost: 50, description: 'Rapid fire burst' },
    { name: 'Fire Lance', damage: 25, cooldown: 1000, cost: 100, description: 'Piercing flame spear' },
    { name: 'Spark Storm', damage: 30, cooldown: 800, cost: 150, description: 'Multiple fire sparks' },
    { name: 'Blaze Bullet', damage: 35, cooldown: 600, cost: 250, description: 'High-speed fire bullet' },
    { name: 'Meteor Dash', damage: 45, cooldown: 500, cost: 400, description: 'Lightning-fast meteor' },
    { name: 'Phoenix Talon', damage: 50, cooldown: 450, cost: 600, description: 'Sharp flame claw' },
    { name: 'Solar Shard', damage: 60, cooldown: 400, cost: 850, description: 'Crystallized sunlight' },
    { name: 'Fire Needle', damage: 70, cooldown: 350, cost: 1200, description: 'Precise flame strike' },
    { name: 'Plasma Bolt', damage: 80, cooldown: 300, cost: 1600, description: 'Superheated matter' },
    { name: 'Quantum Dart', damage: 100, cooldown: 250, cost: 2200, description: 'Probability-warping projectile' },
    { name: 'Void Spike', damage: 120, cooldown: 200, cost: 3000, description: 'Spike from nothingness' },
    { name: 'Divine Arrow', damage: 150, cooldown: 180, cost: 4000, description: 'Heaven\'s judgment' },
    { name: 'Star Fragment', damage: 180, cooldown: 160, cost: 5500, description: 'Piece of a star' },
    { name: 'Time Pierce', damage: 220, cooldown: 140, cost: 7500, description: 'Pierce through time' },
    { name: 'Reality Cut', damage: 260, cooldown: 120, cost: 10000, description: 'Cut reality itself' },
    { name: 'Dimensional Slice', damage: 300, cooldown: 100, cost: 15000, description: 'Slice between dimensions' },
    { name: 'Concept Killer', damage: 400, cooldown: 90, cost: 25000, description: 'Kill abstract concepts' },
    { name: 'Logic Breaker', damage: 500, cooldown: 80, cost: 40000, description: 'Break the laws of logic' },
    { name: 'Truth Denier', damage: 700, cooldown: 70, cost: 60000, description: 'Deny fundamental truths' },
    { name: 'Existence Eraser', damage: 1000, cooldown: 60, cost: 100000, description: 'Erase from existence' },
    { name: 'Omnipotence Shard', damage: 1500, cooldown: 50, cost: 150000, description: 'Fragment of ultimate power' },
    { name: 'Infinity Needle', damage: 2000, cooldown: 40, cost: 250000, description: 'Needle of infinite sharpness' },
    { name: 'Absolute Strike', damage: 3000, cooldown: 30, cost: 400000, description: 'The perfect attack' },
    { name: 'One-Shot Phoenix', damage: 99999, cooldown: 300000, cost: 1000000, description: 'One shot, one kill. Always.' },
  ];

  // Triple click moves (24 additional moves)
  const tripleMoves = [
    { name: 'Phoenix Claw', damage: 45, cooldown: 3500, cost: 75, description: 'Powerful claw attack' },
    { name: 'Flame Tornado', damage: 60, cooldown: 3000, cost: 150, description: 'Spinning fire vortex' },
    { name: 'Fire Storm', damage: 75, cooldown: 2500, cost: 300, description: 'Chaotic flame storm' },
    { name: 'Solar Bomb', damage: 90, cooldown: 2000, cost: 450, description: 'Explosive solar energy' },
    { name: 'Phoenix Fury', damage: 120, cooldown: 1800, cost: 650, description: 'Ultimate phoenix rage' },
    { name: 'Meteor Strike', damage: 140, cooldown: 1600, cost: 900, description: 'Devastating meteor impact' },
    { name: 'Supernova', damage: 160, cooldown: 1400, cost: 1200, description: 'Stellar explosion' },
    { name: 'Galactic Burst', damage: 200, cooldown: 1200, cost: 1600, description: 'Power of galaxies' },
    { name: 'Dimensional Rift', damage: 250, cooldown: 1000, cost: 2200, description: 'Tear through dimensions' },
    { name: 'Time Collapse', damage: 300, cooldown: 900, cost: 3000, description: 'Collapse time itself' },
    { name: 'Reality Storm', damage: 350, cooldown: 800, cost: 4000, description: 'Storm that changes reality' },
    { name: 'Void Implosion', damage: 400, cooldown: 750, cost: 5500, description: 'Implosion of nothingness' },
    { name: 'Divine Judgment', damage: 500, cooldown: 700, cost: 7500, description: 'Judgment of the gods' },
    { name: 'Cosmic Annihilation', damage: 600, cooldown: 650, cost: 10000, description: 'Annihilate cosmic structures' },
    { name: 'Universal Destruction', damage: 800, cooldown: 600, cost: 15000, description: 'Destroy entire universes' },
    { name: 'Multiverse Collapse', damage: 1000, cooldown: 550, cost: 25000, description: 'Collapse the multiverse' },
    { name: 'Omniversal End', damage: 1500, cooldown: 500, cost: 40000, description: 'End all possible realities' },
    { name: 'Transcendence Break', damage: 2000, cooldown: 450, cost: 60000, description: 'Break transcendence itself' },
    { name: 'Absolute Deletion', damage: 3000, cooldown: 400, cost: 100000, description: 'Delete absolutely everything' },
    { name: 'Perfect Annihilation', damage: 4000, cooldown: 350, cost: 150000, description: 'Perfect and complete annihilation' },
    { name: 'Ultimate Genesis', damage: 6000, cooldown: 300, cost: 250000, description: 'Create and destroy simultaneously' },
    { name: 'Final Phoenix', damage: 8000, cooldown: 250, cost: 400000, description: 'The last phoenix' },
    { name: 'Eternal Moment', damage: 12000, cooldown: 200, cost: 700000, description: 'An eternal moment of destruction' },
    { name: 'Phoenix Omega', damage: 20000, cooldown: 100, cost: 1000000, description: 'The beginning and end of all phoenixes' },
  ];

  // Generate moves with proper IDs and colors
  holdMoves.forEach((move, index) => {
    moves.push({
      id: `hold_${index + 2}`,
      type: 'hold',
      color: '#ff2222',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  doubleMoves.forEach((move, index) => {
    moves.push({
      id: `double_${index + 2}`,
      type: 'double',
      color: '#ff6644',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  tripleMoves.forEach((move, index) => {
    moves.push({
      id: `triple_${index + 2}`,
      type: 'triple',
      color: '#ff8844',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  return moves;
}