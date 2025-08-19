import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface EnemyProps {
  position: [number, number];
  type: string;
  health: number;
  maxHealth: number;
}

export default function Enemy({ position, type, health, maxHealth }: EnemyProps) {
  const [x, y] = position;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Floating animation
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    float.start();

    return () => {
      pulse.stop();
      float.stop();
    };
  }, [pulseAnimation, floatAnimation]);

  const getEnemyParticles = () => {
    switch (type) {
      case 'Fire Imp':
        return [
          // Core body
          { x: 0, y: 0, size: 6, color: '#ff2222' },
          { x: -2, y: -2, size: 4, color: '#ff4444' },
          { x: 2, y: -2, size: 4, color: '#ff4444' },
          { x: -3, y: 1, size: 3, color: '#ff6644' },
          { x: 3, y: 1, size: 3, color: '#ff6644' },
          { x: 0, y: 3, size: 3, color: '#ff8844' },
          // Eyes
          { x: -1, y: -1, size: 1, color: '#ffff44' },
          { x: 1, y: -1, size: 1, color: '#ffff44' },
        ];
      
      case 'Shadow Wraith':
        return [
          // Dark core
          { x: 0, y: 0, size: 8, color: '#220022' },
          { x: -3, y: -1, size: 5, color: '#440044' },
          { x: 3, y: -1, size: 5, color: '#440044' },
          { x: -2, y: 2, size: 4, color: '#660066' },
          { x: 2, y: 2, size: 4, color: '#660066' },
          // Glowing eyes
          { x: -2, y: -2, size: 2, color: '#aa00aa' },
          { x: 2, y: -2, size: 2, color: '#aa00aa' },
        ];
      
      case 'Flame Turret':
        return [
          // Base
          { x: 0, y: 2, size: 8, color: '#884422' },
          { x: -3, y: 3, size: 5, color: '#aa6644' },
          { x: 3, y: 3, size: 5, color: '#aa6644' },
          // Cannon
          { x: 0, y: -2, size: 6, color: '#ff4422' },
          { x: 0, y: -5, size: 4, color: '#ff6644' },
          { x: 0, y: -8, size: 2, color: '#ff8844' },
        ];
      
      default:
        return [
          { x: 0, y: 0, size: 6, color: '#ff4444' },
        ];
    }
  };

  const particles = getEnemyParticles();
  
  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const floatY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const healthPercentage = health / maxHealth;

  return (
    <View style={[styles.container, { left: x - 20, top: y - 20 }]}>
      {/* Enemy particles */}
      <Animated.View
        style={[
          styles.enemyBody,
          {
            transform: [
              { scale: pulseScale },
              { translateY: floatY },
            ],
          },
        ]}
      >
        {particles.map((particle, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                left: 20 + particle.x,
                top: 20 + particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: healthPercentage * 0.8 + 0.2, // Fade as health decreases
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Health bar */}
      {health < maxHealth && (
        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${healthPercentage * 100}%`,
                  backgroundColor: healthPercentage > 0.5 ? '#44ff44' : 
                                 healthPercentage > 0.25 ? '#ffff44' : '#ff4444',
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Damage glow effect when hurt */}
      {health < maxHealth && (
        <Animated.View
          style={[
            styles.damageGlow,
            {
              opacity: pulseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  enemyBody: {
    width: 40,
    height: 40,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ff2222',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  healthBarContainer: {
    position: 'absolute',
    top: -8,
    left: 5,
    right: 5,
  },
  healthBarBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  damageGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff2222',
    left: -5,
    top: -5,
    shadowColor: '#ff2222',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});