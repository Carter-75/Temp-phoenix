import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  worldId: number;
}

export default function GameScreen({ onNavigate, worldId }: GameScreenProps) {
  const { gameState: contextGameState, gainXP, gainCoins, onPlayerDeath, updatePlayerStats } = useGameState();
  
  const [gameRunning, setGameRunning] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [currentWorld] = useState(worldId);
  const [showDeathAd, setShowDeathAd] = useState(false);
  
  // Phoenix position
  const [phoenixPos, setPhoenixPos] = useState({ x: width / 2, y: height * 0.8 });
  
  // Attack cooldowns
  const [attackCooldowns, setAttackCooldowns] = useState({
    hold: 0,
    double: 0,
    triple: 0,
  });

  // Game timer
  useEffect(() => {
    if (!gameRunning) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 300) { // 5 minutes = 300 seconds
          handleBossSpawn();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameRunning]);

  const handleBossSpawn = () => {
    setGameRunning(false);
    Alert.alert('Boss Spawned!', `Defeat the boss to complete World ${currentWorld}!`);
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
    setAttackCooldowns({ hold: 0, double: 0, triple: 0 });
  };

  // Pan responder for phoenix movement
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event) => {
      if (!gameRunning) return;
      
      const { pageX, pageY } = event.nativeEvent;
      setPhoenixPos({
        x: Math.max(50, Math.min(width - 50, pageX)),
        y: Math.max(100, Math.min(height - 100, pageY)),
      });
    },
  });

  const handleTouch = useCallback((touchCount: number) => {
    if (!gameRunning) return;

    const now = Date.now();
    const equippedMoves = contextGameState.equippedMoves;

    switch (touchCount) {
      case 1: // Hold attack
        if (equippedMoves.hold && attackCooldowns.hold <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            hold: now + equippedMoves.hold!.cooldown,
          }));
          gainXP(5); // Small XP for attacking
        }
        break;
      case 2: // Double click
        if (equippedMoves.double && attackCooldowns.double <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            double: now + equippedMoves.double!.cooldown,
          }));
          gainXP(3);
        }
        break;
      case 3: // Triple click
        if (equippedMoves.triple && attackCooldowns.triple <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            triple: now + equippedMoves.triple!.cooldown,
          }));
          gainXP(7);
        }
        break;
    }
  }, [gameRunning, contextGameState.equippedMoves, attackCooldowns, gainXP]);

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
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Background */}
        <View style={styles.background}>
          <Text style={styles.worldText}>World {currentWorld}</Text>
          <Text style={styles.instructionText}>
            Tap to attack • Hold for power attack • Double/Triple tap for combos
          </Text>
        </View>

        {/* Phoenix */}
        <Phoenix position={[phoenixPos.x, phoenixPos.y]} />
        
        {/* Game UI */}
        <GameUI
          health={contextGameState.playerStats.health}
          maxHealth={contextGameState.playerStats.maxHealth}
          score={0}
          gameTime={gameTime}
          worldId={currentWorld}
          attackCooldowns={attackCooldowns}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 20,
    textShadowColor: '#ff8844',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#ff8844',
    textAlign: 'center',
    paddingHorizontal: 40,
    opacity: 0.8,
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