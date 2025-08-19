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
  gainXP: (amount: number) => void;
  gainCoins: (amount: number) => void;
  onPlayerDeath: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Initialize available moves with starter moves
  useEffect(() => {
    const starterMoves = generateStarterMoves();
    setGameState(prev => ({
      ...prev,
      availableMoves: starterMoves,
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

  const gainXP = (amount: number) => {
    setGameState(prev => {
      let newXP = prev.playerStats.xp + amount;
      let newLevel = prev.playerStats.level;
      let newMaxHealth = prev.playerStats.maxHealth;
      let xpToNext = prev.playerStats.xpToNext;

      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        newMaxHealth += 10; // Health increases with level
        xpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
      }

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          xp: newXP,
          level: newLevel,
          maxHealth: newMaxHealth,
          health: Math.min(prev.playerStats.health, newMaxHealth),
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

  return (
    <GameStateContext.Provider value={{
      gameState,
      updatePlayerStats,
      equipMove,
      purchaseMove,
      unlockWorld,
      gainXP,
      gainCoins,
      onPlayerDeath,
      saveGame,
      loadGame,
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
    // Hold moves (3 starters)
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
    // Double click moves (3 starters)
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
    // Triple click moves (3 starters)
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