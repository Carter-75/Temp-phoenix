import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface BossProps {
  position: [number, number];
  type: string;
  health: number;
  maxHealth: number;
  phase: number;
  isVulnerable: boolean;
}

export default function Boss({ 
  position, 
  type, 
  health, 
  maxHealth, 
  phase,
  isVulnerable 
}: BossProps) {
  const [x, y] = position;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const phaseAnimation = useRef(new Animated.Value(1)).current;
  const vulnerableAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation for boss presence
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Phase transition animation
    Animated.timing(phaseAnimation, {
      toValue: phase,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Vulnerability indicator
    if (isVulnerable) {
      const vulnerable = Animated.loop(
        Animated.sequence([
          Animated.timing(vulnerableAnimation, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(vulnerableAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      vulnerable.start();
    } else {
      vulnerableAnimation.setValue(1);
    }

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [pulseAnimation, phaseAnimation, vulnerableAnimation, phase, isVulnerable]);

  const getBossParticles = () => {
    const baseSize = 80;
    
    switch (type) {
      case 'Inferno Guardian':
        return [
          // Main body
          { x: 0, y: 0, size: baseSize * 0.6, color: '#ff2222' },
          { x: -20, y: -10, size: baseSize * 0.4, color: '#ff4444' },
          { x: 20, y: -10, size: baseSize * 0.4, color: '#ff4444' },
          { x: -15, y: 15, size: baseSize * 0.3, color: '#ff6644' },
          { x: 15, y: 15, size: baseSize * 0.3, color: '#ff6644' },
          // Eyes
          { x: -12, y: -15, size: baseSize * 0.1, color: '#ffff44' },
          { x: 12, y: -15, size: baseSize * 0.1, color: '#ffff44' },
          // Crown/horns
          { x: -10, y: -25, size: baseSize * 0.15, color: '#ff8844' },
          { x: 10, y: -25, size: baseSize * 0.15, color: '#ff8844' },
          { x: 0, y: -30, size: baseSize * 0.2, color: '#ffaa44' },
        ];
      
      case 'Shadow Lord':
        return [
          // Dark core
          { x: 0, y: 0, size: baseSize * 0.7, color: '#110011' },
          { x: -25, y: -15, size: baseSize * 0.4, color: '#220022' },
          { x: 25, y: -15, size: baseSize * 0.4, color: '#220022' },
          { x: -20, y: 20, size: baseSize * 0.35, color: '#330033' },
          { x: 20, y: 20, size: baseSize * 0.35, color: '#330033' },
          // Glowing elements
          { x: -15, y: -20, size: baseSize * 0.12, color: '#aa00aa' },
          { x: 15, y: -20, size: baseSize * 0.12, color: '#aa00aa' },
          { x: 0, y: -25, size: baseSize * 0.15, color: '#ff00ff' },
        ];
      
      case 'Crystal Titan':
        return [
          // Crystal body
          { x: 0, y: 0, size: baseSize * 0.8, color: '#44aaff' },
          { x: -30, y: -20, size: baseSize * 0.5, color: '#66ccff' },
          { x: 30, y: -20, size: baseSize * 0.5, color: '#66ccff' },
          { x: -25, y: 25, size: baseSize * 0.4, color: '#88eeff' },
          { x: 25, y: 25, size: baseSize * 0.4, color: '#88eeff' },
          // Crystal shards
          { x: -10, y: -30, size: baseSize * 0.2, color: '#aaffff' },
          { x: 10, y: -30, size: baseSize * 0.2, color: '#aaffff' },
          { x: 0, y: -35, size: baseSize * 0.25, color: '#ffffff' },
        ];
      
      case 'Phoenix King':
        return [
          // Golden phoenix body
          { x: 0, y: 0, size: baseSize * 0.7, color: '#ffaa00' },
          { x: -30, y: -15, size: baseSize * 0.5, color: '#ff8800' },
          { x: 30, y: -15, size: baseSize * 0.5, color: '#ff8800' },
          { x: -25, y: 20, size: baseSize * 0.4, color: '#ff6600' },
          { x: 25, y: 20, size: baseSize * 0.4, color: '#ff6600' },
          // Crown
          { x: 0, y: -35, size: baseSize * 0.3, color: '#ffcc00' },
          { x: -15, y: -40, size: baseSize * 0.15, color: '#ffdd44' },
          { x: 15, y: -40, size: baseSize * 0.15, color: '#ffdd44' },
          // Wings
          { x: -45, y: 0, size: baseSize * 0.6, color: '#ff4400' },
          { x: 45, y: 0, size: baseSize * 0.6, color: '#ff4400' },
        ];

      default:
        return [
          { x: 0, y: 0, size: baseSize * 0.6, color: '#ff4444' },
          { x: -20, y: -10, size: baseSize * 0.4, color: '#ff6644' },
          { x: 20, y: -10, size: baseSize * 0.4, color: '#ff6644' },
        ];
    }
  };

  const particles = getBossParticles();
  const healthPercentage = health / maxHealth;

  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const phaseGlow = phaseAnimation.interpolate({
    inputRange: [1, 3],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[styles.container, { left: x - 60, top: y - 60 }]}>
      {/* Boss name */}
      <View style={styles.nameContainer}>
        <Text style={styles.bossName}>{type}</Text>
      </View>

      {/* Health bar */}
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
        <Text style={styles.healthText}>
          {health}/{maxHealth}
        </Text>
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseText}>Phase {phase}</Text>
      </View>

      {/* Boss particles */}
      <Animated.View
        style={[
          styles.bossBody,
          {
            opacity: vulnerableAnimation,
            transform: [
              { scale: pulseScale },
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
                left: 60 + particle.x,
                top: 60 + particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: healthPercentage * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Phase glow effect */}
      <Animated.View
        style={[
          styles.phaseGlow,
          {
            opacity: phaseGlow,
            backgroundColor: type.includes('Shadow') ? '#aa00aa' : 
                           type.includes('Crystal') ? '#44aaff' : 
                           type.includes('Phoenix') ? '#ffaa00' : '#ff4444',
          },
        ]}
      />

      {/* Vulnerability indicator */}
      {isVulnerable && (
        <Animated.View
          style={[
            styles.vulnerableIndicator,
            {
              opacity: vulnerableAnimation,
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
    width: 120,
    height: 120,
  },
  nameContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bossName: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  healthBarContainer: {
    position: 'absolute',
    top: -25,
    left: 10,
    right: 10,
  },
  healthBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthText: {
    color: '#fff',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  phaseContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  phaseText: {
    color: '#ffaa44',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bossBody: {
    width: 120,
    height: 120,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  phaseGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    left: -10,
    top: -10,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  vulnerableIndicator: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#ffff44',
    left: -5,
    top: -5,
  },
});