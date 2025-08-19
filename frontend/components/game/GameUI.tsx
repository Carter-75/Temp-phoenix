import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttackMove } from '../contexts/GameStateContext';

const { width } = Dimensions.get('window');

interface GameUIProps {
  health: number;
  maxHealth: number;
  score: number;
  gameTime: number;
  worldId: number;
  attackCooldowns: {
    hold: number;
    double: number;
    triple: number;
  };
  equippedMoves: {
    hold: AttackMove | null;
    double: AttackMove | null;
    triple: AttackMove | null;
  };
  onBack: () => void;
  onPause: () => void;
}

export default function GameUI({
  health,
  maxHealth,
  score,
  gameTime,
  worldId,
  attackCooldowns,
  equippedMoves,
  onBack,
  onPause,
}: GameUIProps) {
  const healthPercentage = (health / maxHealth) * 100;
  const timePercentage = (gameTime / 300) * 100; // 5 minutes = 300 seconds
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCooldownPercentage = (type: 'hold' | 'double' | 'triple') => {
    const now = Date.now();
    const cooldownEnd = attackCooldowns[type];
    const move = equippedMoves[type];
    
    if (!move || cooldownEnd <= now) return 0;
    
    const totalCooldown = move.cooldown;
    const remainingCooldown = cooldownEnd - now;
    return (remainingCooldown / totalCooldown) * 100;
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      {/* Top UI */}
      <View style={styles.topUI} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.worldInfo}>
          <Text style={styles.worldText}>World {worldId}</Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
          <Text style={styles.buttonText}>⏸</Text>
        </TouchableOpacity>
      </View>

      {/* Health Bar */}
      <View style={styles.healthContainer} pointerEvents="none">
        <Text style={styles.healthLabel}>Health</Text>
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${healthPercentage}%`,
                backgroundColor: healthPercentage > 50 ? '#44ff44' : 
                               healthPercentage > 25 ? '#ffff44' : '#ff4444',
              },
            ]}
          />
        </View>
        <Text style={styles.healthText}>{health}/{maxHealth}</Text>
      </View>

      {/* Time Progress */}
      <View style={styles.timeContainer} pointerEvents="none">
        <Text style={styles.timeLabel}>Time: {formatTime(gameTime)}</Text>
        <View style={styles.timeBar}>
          <View
            style={[
              styles.timeFill,
              { width: `${timePercentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Attack Cooldowns */}
      <View style={styles.cooldownContainer} pointerEvents="none">
        {(['double', 'triple', 'hold'] as const).map((type) => {
          const move = equippedMoves[type];
          const cooldownPercentage = getCooldownPercentage(type);
          
          if (!move) return null;

          return (
            <View key={type} style={styles.cooldownItem}>
              <Text style={styles.cooldownLabel}>
                {type === 'double' ? '2x' : type === 'triple' ? '3x' : 'HOLD'}
              </Text>
              <View style={styles.cooldownBar}>
                <View
                  style={[
                    styles.cooldownFill,
                    {
                      width: `${100 - cooldownPercentage}%`,
                      backgroundColor: move.color,
                    },
                  ]}
                />
                {cooldownPercentage > 0 && (
                  <View
                    style={[
                      styles.cooldownOverlay,
                      { width: `${cooldownPercentage}%` },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  topUI: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 136, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  worldInfo: {
    alignItems: 'center',
  },
  worldText: {
    color: '#ff8844',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
  },
  healthContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
  },
  healthLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  healthBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
  timeContainer: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
  },
  timeLabel: {
    color: '#ff8844',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  timeBar: {
    height: 6,
    backgroundColor: 'rgba(255, 136, 68, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timeFill: {
    height: '100%',
    backgroundColor: '#ff8844',
    borderRadius: 3,
  },
  cooldownContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cooldownItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  cooldownLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cooldownBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cooldownFill: {
    height: '100%',
    borderRadius: 2,
  },
  cooldownOverlay: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 2,
  },
});