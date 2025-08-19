import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanGestureHandler,
  GestureHandlerRootView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import Phoenix from '../game/Phoenix';
import Enemy from '../game/Enemy';
import GameUI from '../game/GameUI';
import { GameData, createGameSystem } from '../game/GameSystem';
import AttackSystem from '../game/AttackSystem';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function GameScreen({ onNavigate }: GameScreenProps) {
  const { gameState, gainXP, gainCoins, onPlayerDeath } = useGameState();
  const [gameRunning, setGameRunning] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [currentWorld] = useState(1);
  const [health, setHealth] = useState(gameState.playerStats.maxHealth);
  const [score, setScore] = useState(0);
  const [showDeathAd, setShowDeathAd] = useState(false);
  
  const engineRef = useRef<GameEngine>(null);
  const gameDataRef = useRef<GameData>({
    phoenix: {
      x: width / 2,
      y: height * 0.8,
      health: gameState.playerStats.maxHealth,
      maxHealth: gameState.playerStats.maxHealth,
    },
    enemies: [],
    projectiles: [],
    particles: [],
    environmentObjects: [],
    score: 0,
    gameTime: 0,
    worldId: 1,
    attackCooldowns: {
      hold: 0,
      double: 0,
      triple: 0,
    },
    isAttacking: false,
    lastTouchTime: 0,
    touchCount: 0,
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
    // Spawn boss logic
    setGameRunning(false);
    Alert.alert('Boss Spawned!', 'Defeat the boss to complete this world!');
  };

  const handleGameOver = () => {
    setGameRunning(false);
    onPlayerDeath();
    
    // Show ad every other death
    if (gameState.deathCount % 2 === 0) {
      setShowDeathAd(true);
    } else {
      resetGame();
    }
  };

  const resetGame = () => {
    setHealth(gameState.playerStats.maxHealth);
    setScore(0);
    setGameTime(0);
    setGameRunning(true);
    setShowDeathAd(false);
    
    // Reset game data
    gameDataRef.current = {
      phoenix: {
        x: width / 2,
        y: height * 0.8,
        health: gameState.playerStats.maxHealth,
        maxHealth: gameState.playerStats.maxHealth,
      },
      enemies: [],
      projectiles: [],
      particles: [],
      environmentObjects: [],
      score: 0,
      gameTime: 0,
      worldId: currentWorld,
      attackCooldowns: {
        hold: 0,
        double: 0,
        triple: 0,
      },
      isAttacking: false,
      lastTouchTime: 0,
      touchCount: 0,
    };
  };

  const handlePanGesture = useCallback((event: any) => {
    if (!gameRunning) return;

    const { x, y } = event.nativeEvent;
    
    // Update phoenix position with boundaries
    gameDataRef.current.phoenix.x = Math.max(50, Math.min(width - 50, x));
    gameDataRef.current.phoenix.y = Math.max(100, Math.min(height - 100, y));
  }, [gameRunning]);

  const handleTouch = useCallback((touchCount: number) => {
    if (!gameRunning) return;

    const now = Date.now();
    const equippedMoves = gameState.equippedMoves;

    switch (touchCount) {
      case 1: // Hold attack
        if (equippedMoves.hold && gameDataRef.current.attackCooldowns.hold <= now) {
          gameDataRef.current.attackCooldowns.hold = now + equippedMoves.hold.cooldown;
          gameDataRef.current.isAttacking = true;
          // Add hold attack logic
        }
        break;
      case 2: // Double click
        if (equippedMoves.double && gameDataRef.current.attackCooldowns.double <= now) {
          gameDataRef.current.attackCooldowns.double = now + equippedMoves.double.cooldown;
          // Add double click attack logic
        }
        break;
      case 3: // Triple click
        if (equippedMoves.triple && gameDataRef.current.attackCooldowns.triple <= now) {
          gameDataRef.current.attackCooldowns.triple = now + equippedMoves.triple.cooldown;
          // Add triple click attack logic
        }
        break;
    }
  }, [gameRunning, gameState.equippedMoves]);

  const entities = {
    phoenix: {
      position: [gameDataRef.current.phoenix.x, gameDataRef.current.phoenix.y],
      renderer: Phoenix,
    },
  };

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
      <View style={styles.gameArea}>
        <GameEngine
          ref={engineRef}
          style={styles.gameEngine}
          systems={[createGameSystem(gameDataRef, { gainXP, gainCoins, setHealth, setScore })]}
          entities={entities}
          running={gameRunning}
        >
          <GameUI
            health={health}
            maxHealth={gameState.playerStats.maxHealth}
            score={score}
            gameTime={gameTime}
            worldId={currentWorld}
            attackCooldowns={gameDataRef.current.attackCooldowns}
            equippedMoves={gameState.equippedMoves}
            onBack={() => onNavigate('menu')}
            onPause={() => setGameRunning(!gameRunning)}
          />
          
          <AttackSystem
            onTouch={handleTouch}
            onPanGesture={handlePanGesture}
            gameRunning={gameRunning}
          />
        </GameEngine>
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
  gameEngine: {
    flex: 1,
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