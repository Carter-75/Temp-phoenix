import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameEngine } from 'react-native-game-engine';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import Phoenix from '../game/Phoenix';
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
    Alert.alert('Boss Spawned!', 'Defeat the boss to complete this world!');
  };

  const handleGameOver = () => {
    setGameRunning(false);
    onPlayerDeath();
    
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
    const equippedMoves = gameState.equippedMoves;

    switch (touchCount) {
      case 1: // Hold attack
        if (equippedMoves.hold && attackCooldowns.hold <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            hold: now + equippedMoves.hold!.cooldown,
          }));
          // Add attack logic here
        }
        break;
      case 2: // Double click
        if (equippedMoves.double && attackCooldowns.double <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            double: now + equippedMoves.double!.cooldown,
          }));
        }
        break;
      case 3: // Triple click
        if (equippedMoves.triple && attackCooldowns.triple <= now) {
          setAttackCooldowns(prev => ({
            ...prev,
            triple: now + equippedMoves.triple!.cooldown,
          }));
        }
        break;
    }
  }, [gameRunning, gameState.equippedMoves, attackCooldowns]);

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
          {/* Moving clouds/environment will go here */}
        </View>

        {/* Phoenix */}
        <Phoenix position={[phoenixPos.x, phoenixPos.y]} />
        
        {/* Game UI */}
        <GameUI
          health={health}
          maxHealth={gameState.playerStats.maxHealth}
          score={score}
          gameTime={gameTime}
          worldId={currentWorld}
          attackCooldowns={attackCooldowns}
          equippedMoves={gameState.equippedMoves}
          onBack={() => onNavigate('menu')}
          onPause={() => setGameRunning(!gameRunning)}
        />
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