import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  PanResponder,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import Phoenix from '../game/Phoenix';
import GameUI from '../game/GameUI';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  onNavigate: (screen: Screen) => void;
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  PanResponder,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import GameEngine, { GameState } from '../game/GameEngine';
import GameUI from '../game/GameUI';
import SoundManager, { useGameSounds } from '../game/SoundManager';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function GameScreen({ onNavigate }: GameScreenProps) {
  const { gameState: contextGameState, gainXP, gainCoins, onPlayerDeath, updatePlayerStats } = useGameState();
  const gameSounds = useGameSounds();
  
  const [gameRunning, setGameRunning] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [currentWorld] = useState(1);
  const [showDeathAd, setShowDeathAd] = useState(false);
  
  // Phoenix position
  const [phoenixPos, setPhoenixPos] = useState({ x: width / 2, y: height * 0.8 });
  
  // Main game state
  const [gameEngineState, setGameEngineState] = useState<GameState>({
    phoenix: {
      id: 'phoenix_1',
      x: width / 2,
      y: height * 0.8,
      type: 'phoenix',
      health: contextGameState.playerStats.maxHealth,
      maxHealth: contextGameState.playerStats.maxHealth,
      isAttacking: false,
    },
    enemies: [],
    projectiles: [],
    environmentObjects: [],
    particles: [],
    boss: null,
    score: 0,
    enemiesKilled: 0,
    worldId: currentWorld,
    gameTime: 0,
    bossSpawned: false,
    attackCooldowns: {
      hold: 0,
      double: 0,
      triple: 0,
    },
  });

  // Game timer
  useEffect(() => {
    if (!gameRunning) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 1;
        setGameEngineState(prevState => ({
          ...prevState,
          gameTime: newTime,
        }));
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameRunning]);

  const handleGameEvent = useCallback((event: string, data: any) => {
    switch (event) {
      case 'bossSpawned':
        gameSounds.playBossSpawn?.();
        Alert.alert('Boss Spawned!', `Defeat the ${getBossName(data.worldId)} to complete this world!`);
        break;
      
      case 'bossDefeated':
        gameSounds.playBossDefeat?.();
        gameSounds.playWorldComplete?.();
        gainXP(data.xp);
        gainCoins(data.coins);
        Alert.alert('Victory!', `World ${data.worldId} completed! You earned ${data.xp} XP and ${data.coins} coins!`);
        // Unlock next world logic would go here
        break;
      
      case 'enemyKilled':
        gameSounds.playEnemyDeath?.();
        gameSounds.playCoinCollect?.();
        gainXP(data.xp);
        gainCoins(data.coins);
        // Small health recovery
        updatePlayerStats({ health: Math.min(contextGameState.playerStats.maxHealth, contextGameState.playerStats.health + 2) });
        break;
      
      case 'phoenixHit':
        gameSounds.playPhoenixHit?.();
        updatePlayerStats({ health: Math.max(0, contextGameState.playerStats.health - data.damage) });
        if (contextGameState.playerStats.health <= data.damage) {
          handleGameOver();
        }
        break;
      
      case 'phoenixAttack':
        gameSounds.playAttack?.();
        break;
    }
  }, [gainXP, gainCoins, onPlayerDeath, updatePlayerStats, contextGameState.playerStats, gameSounds]);

  const getBossName = (worldId: number): string => {
    const bossNames = [
      'Inferno Guardian', 'Shadow Lord', 'Crystal Titan', 'Storm Wyvern', 'Void Reaper',
      'Phoenix King', 'Ice Empress', 'Dragon Emperor', 'Chaos Demon', 'Eternal Phoenix'
    ];
    return bossNames[worldId - 1] || 'Unknown Boss';
  };

  const handleGameOver = () => {
    setGameRunning(false);
    onPlayerDeath();
    
    if (contextGameState.deathCount % 2 === 0) {
      setShowDeathAd(true);
    } else {
      resetGame();
    }
  };

  const resetGame = () => {
    updatePlayerStats({ health: contextGameState.playerStats.maxHealth });
    setGameTime(0);
    setGameRunning(true);
    setShowDeathAd(false);
    setPhoenixPos({ x: width / 2, y: height * 0.8 });
    
    setGameEngineState({
      phoenix: {
        id: 'phoenix_1',
        x: width / 2,
        y: height * 0.8,
        type: 'phoenix',
        health: contextGameState.playerStats.maxHealth,
        maxHealth: contextGameState.playerStats.maxHealth,
        isAttacking: false,
      },
      enemies: [],
      projectiles: [],
      environmentObjects: [],
      particles: [],
      boss: null,
      score: 0,
      enemiesKilled: 0,
      worldId: currentWorld,
      gameTime: 0,
      bossSpawned: false,
      attackCooldowns: {
        hold: 0,
        double: 0,
        triple: 0,
      },
    });
  };

  // Pan responder for phoenix movement
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event) => {
      if (!gameRunning) return;
      
      const { pageX, pageY } = event.nativeEvent;
      const newPos = {
        x: Math.max(50, Math.min(width - 50, pageX)),
        y: Math.max(100, Math.min(height - 100, pageY)),
      };
      setPhoenixPos(newPos);
    },
  });

  const handleTouch = useCallback((touchCount: number) => {
    if (!gameRunning) return;

    const now = Date.now();
    const equippedMoves = contextGameState.equippedMoves;

    switch (touchCount) {
      case 1: // Hold attack
        if (equippedMoves.hold && gameEngineState.attackCooldowns.hold <= now) {
          setGameEngineState(prev => ({
            ...prev,
            attackCooldowns: {
              ...prev.attackCooldowns,
              hold: now + equippedMoves.hold!.cooldown,
            },
            phoenix: {
              ...prev.phoenix,
              isAttacking: true,
              attackType: 'hold',
            },
          }));
          handleGameEvent('phoenixAttack', { type: 'hold', move: equippedMoves.hold });
          
          // Clear attack state after animation
          setTimeout(() => {
            setGameEngineState(prev => ({
              ...prev,
              phoenix: {
                ...prev.phoenix,
                isAttacking: false,
                attackType: undefined,
              },
            }));
          }, 1000);
        }
        break;
        
      case 2: // Double click
        if (equippedMoves.double && gameEngineState.attackCooldowns.double <= now) {
          setGameEngineState(prev => ({
            ...prev,
            attackCooldowns: {
              ...prev.attackCooldowns,
              double: now + equippedMoves.double!.cooldown,
            },
            phoenix: {
              ...prev.phoenix,
              isAttacking: true,
              attackType: 'double',
            },
          }));
          handleGameEvent('phoenixAttack', { type: 'double', move: equippedMoves.double });
          
          setTimeout(() => {
            setGameEngineState(prev => ({
              ...prev,
              phoenix: {
                ...prev.phoenix,
                isAttacking: false,
                attackType: undefined,
              },
            }));
          }, 500);
        }
        break;
        
      case 3: // Triple click
        if (equippedMoves.triple && gameEngineState.attackCooldowns.triple <= now) {
          setGameEngineState(prev => ({
            ...prev,
            attackCooldowns: {
              ...prev.attackCooldowns,
              triple: now + equippedMoves.triple!.cooldown,
            },
            phoenix: {
              ...prev.phoenix,
              isAttacking: true,
              attackType: 'triple',
            },
          }));
          handleGameEvent('phoenixAttack', { type: 'triple', move: equippedMoves.triple });
          
          setTimeout(() => {
            setGameEngineState(prev => ({
              ...prev,
              phoenix: {
                ...prev.phoenix,
                isAttacking: false,
                attackType: undefined,
              },
            }));
          }, 800);
        }
        break;
    }
  }, [gameRunning, contextGameState.equippedMoves, gameEngineState.attackCooldowns, handleGameEvent]);

  if (showDeathAd) {
    return (
      <View style={styles.adContainer}>
        <Text style={styles.adTitle}>Game Over</Text>
        <View style={styles.interstitialAd}>
          <Text style={styles.adText}>Interstitial Ad Placement</Text>
          <Text style={styles.adSubtext}>This is where a full-screen ad would appear</Text>
        </View>
        <TouchableOpacity style={styles.continueButton} onPress={resetGame}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Sound Manager */}
      <SoundManager 
        gameState={gameEngineState}
        soundEnabled={contextGameState.settings.soundEnabled}
        musicEnabled={contextGameState.settings.musicEnabled}
      />
      
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Game Engine */}
        <GameEngine
          gameState={gameEngineState}
          onUpdateGameState={setGameEngineState}
          phoenixPosition={phoenixPos}
          gameRunning={gameRunning}
          equippedMoves={contextGameState.equippedMoves}
          onGameEvent={handleGameEvent}
        />
        
        {/* Game UI */}
        <GameUI
          health={contextGameState.playerStats.health}
          maxHealth={contextGameState.playerStats.maxHealth}
          score={gameEngineState.score}
          gameTime={gameTime}
          worldId={currentWorld}
          attackCooldowns={gameEngineState.attackCooldowns}
          equippedMoves={contextGameState.equippedMoves}
          onBack={() => onNavigate('menu')}
          onPause={() => setGameRunning(!gameRunning)}
        />

        {/* Touch handler overlay */}
        <TouchableHandler onTouch={handleTouch} gameRunning={gameRunning} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000014',
  },
  gameArea: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#000014',
  },
  adContainer: {
    flex: 1,
    backgroundColor: '#000014',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 40,
  },
  interstitialAd: {
    width: '90%',
    height: '60%',
    backgroundColor: '#333',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6644',
    marginBottom: 40,
  },
  adText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// Touch Handler Component
interface TouchHandlerProps {
  onTouch: (touchCount: number) => void;
  gameRunning: boolean;
}

function TouchableHandler({ onTouch, gameRunning }: TouchHandlerProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const handleTouchStart = useCallback((event: any) => {
    if (!gameRunning) return;

    const { locationX, locationY } = event.nativeEvent;
    const now = Date.now();
    
    touchStartRef.current = { x: locationX, y: locationY, time: now };
    
    // Increment tap count
    tapCountRef.current += 1;

    // Clear existing timers
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Set hold timer for potential hold attack
    holdTimerRef.current = setTimeout(() => {
      if (touchStartRef.current && !isHoldingRef.current) {
        isHoldingRef.current = true;
        onTouch(1); // Hold attack
      }
    }, 300); // 300ms to trigger hold

    // Set tap detection timer
    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current > 0 && !isHoldingRef.current) {
        // Process tap attacks
        if (tapCountRef.current >= 3) {
          onTouch(3); // Triple click
        } else if (tapCountRef.current === 2) {
          onTouch(2); // Double click
        }
      }
      tapCountRef.current = 0;
    }, 250); // 250ms window for multiple taps

  }, [gameRunning, onTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!gameRunning) return;

    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Reset hold state
    isHoldingRef.current = false;
    touchStartRef.current = null;
  }, [gameRunning]);

  const handleTouchCancel = useCallback(() => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    tapCountRef.current = 0;
    isHoldingRef.current = false;
    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    />
  );
}