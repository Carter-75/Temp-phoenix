import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface PhoenixProps {
  position: [number, number];
  isAttacking?: boolean;
}

export default function Phoenix({ position, isAttacking = false }: PhoenixProps) {
  const [x, y] = position;
  const wingAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wing flapping animation
    const wingFlap = Animated.loop(
      Animated.sequence([
        Animated.timing(wingAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(wingAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow effect animation
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    wingFlap.start();
    glowPulse.start();

    return () => {
      wingFlap.stop();
      glowPulse.stop();
    };
  }, [wingAnimation, glowAnimation]);

  const wingScale = wingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Particle positions for phoenix body
  const particles = [
    // Body core
    { x: 0, y: 0, size: 8, color: '#ffff44' }, // Center
    { x: -3, y: -2, size: 6, color: '#ff6644' },
    { x: 3, y: -2, size: 6, color: '#ff6644' },
    { x: -2, y: 2, size: 5, color: '#ff4444' },
    { x: 2, y: 2, size: 5, color: '#ff4444' },
    
    // Head
    { x: 0, y: -8, size: 4, color: '#ff8844' },
    { x: -1, y: -10, size: 3, color: '#ffaa44' }, // Beak
    
    // Tail
    { x: 0, y: 8, size: 4, color: '#ff4444' },
    { x: -2, y: 12, size: 3, color: '#ff6644' },
    { x: 2, y: 12, size: 3, color: '#ff6644' },
    { x: 0, y: 16, size: 2, color: '#ff8844' },
  ];

  // Wing particles (animated)
  const wingParticles = [
    // Left wing
    { x: -12, y: -4, size: 4, color: '#ff6644' },
    { x: -16, y: -2, size: 3, color: '#ff8844' },
    { x: -20, y: 0, size: 2, color: '#ffaa44' },
    { x: -14, y: 2, size: 3, color: '#ff4444' },
    
    // Right wing  
    { x: 12, y: -4, size: 4, color: '#ff6644' },
    { x: 16, y: -2, size: 3, color: '#ff8844' },
    { x: 20, y: 0, size: 2, color: '#ffaa44' },
    { x: 14, y: 2, size: 3, color: '#ff4444' },
  ];

  return (
    <View style={[styles.container, { left: x - 25, top: y - 25 }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowOpacity }],
          },
        ]}
      />

      {/* Phoenix body particles */}
      {particles.map((particle, index) => (
        <View
          key={`body-${index}`}
          style={[
            styles.particle,
            {
              left: 25 + particle.x,
              top: 25 + particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            },
          ]}
        />
      ))}

      {/* Animated wing particles */}
      <Animated.View
        style={[
          styles.wings,
          {
            transform: [{ scaleY: wingScale }],
          },
        ]}
      >
        {wingParticles.map((particle, index) => (
          <View
            key={`wing-${index}`}
            style={[
              styles.particle,
              {
                left: 25 + particle.x,
                top: 25 + particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Attack effect */}
      {isAttacking && (
        <View style={styles.attackEffect}>
          <Animated.View
            style={[
              styles.attackGlow,
              {
                opacity: glowAnimation,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6644',
    left: -5,
    top: -5,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  wings: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  attackEffect: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  attackGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffff44',
    left: -15,
    top: -15,
    shadowColor: '#ffff44',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
});