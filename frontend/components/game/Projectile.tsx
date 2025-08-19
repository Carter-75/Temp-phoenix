import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ProjectileProps {
  position: [number, number];
  type: string;
  color: string;
  owner: 'phoenix' | 'enemy';
}

export default function Projectile({ position, type, color, owner }: ProjectileProps) {
  const [x, y] = position;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const trailAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing glow animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    );

    // Trail effect
    const trail = Animated.loop(
      Animated.sequence([
        Animated.timing(trailAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(trailAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    trail.start();

    return () => {
      pulse.stop();
      trail.stop();
    };
  }, [pulseAnimation, trailAnimation]);

  const getProjectileParticles = () => {
    switch (type) {
      case 'fire_dart':
        return [
          { x: 0, y: 0, size: 6, color: color },
          { x: -2, y: 1, size: 4, color: '#ffaa44' },
          { x: 2, y: 1, size: 4, color: '#ffaa44' },
        ];
      
      case 'flame_burst':
        return [
          { x: 0, y: 0, size: 8, color: color },
          { x: -3, y: -1, size: 5, color: '#ff6644' },
          { x: 3, y: -1, size: 5, color: '#ff6644' },
          { x: -1, y: 2, size: 4, color: '#ffaa44' },
          { x: 1, y: 2, size: 4, color: '#ffaa44' },
        ];
      
      case 'phoenix_strike':
        return [
          { x: 0, y: 0, size: 10, color: color },
          { x: -4, y: -2, size: 6, color: '#ff4444' },
          { x: 4, y: -2, size: 6, color: '#ff4444' },
          { x: -2, y: 3, size: 5, color: '#ffaa44' },
          { x: 2, y: 3, size: 5, color: '#ffaa44' },
          { x: 0, y: -4, size: 4, color: '#ffff44' },
        ];
      
      case 'fireball':
        return [
          { x: 0, y: 0, size: 8, color: '#ff2222' },
          { x: -3, y: -2, size: 6, color: '#ff4444' },
          { x: 3, y: -2, size: 6, color: '#ff4444' },
          { x: -2, y: 2, size: 5, color: '#ff6644' },
          { x: 2, y: 2, size: 5, color: '#ff6644' },
        ];
      
      case 'shadow_bolt':
        return [
          { x: 0, y: 0, size: 6, color: '#220022' },
          { x: -2, y: -1, size: 4, color: '#440044' },
          { x: 2, y: -1, size: 4, color: '#440044' },
          { x: 0, y: 2, size: 3, color: '#aa00aa' },
        ];
      
      default:
        return [{ x: 0, y: 0, size: 6, color: color }];
    }
  };

  const particles = getProjectileParticles();
  
  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const trailOpacity = trailAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={[styles.container, { left: x - 10, top: y - 10 }]}>
      {/* Trail effect */}
      <Animated.View
        style={[
          styles.trail,
          {
            opacity: trailOpacity,
            backgroundColor: color,
          },
        ]}
      />

      {/* Main projectile particles */}
      <Animated.View
        style={[
          styles.projectileBody,
          {
            transform: [{ scale: pulseScale }],
          },
        ]}
      >
        {particles.map((particle, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                left: 10 + particle.x,
                top: 10 + particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: pulseAnimation,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  trail: {
    position: 'absolute',
    width: 16,
    height: 4,
    left: 2,
    top: 8,
    borderRadius: 2,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  projectileBody: {
    width: 20,
    height: 20,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  glow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    left: -5,
    top: -5,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});