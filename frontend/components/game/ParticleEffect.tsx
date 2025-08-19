import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ParticleEffectProps {
  position: [number, number];
  type: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function ParticleEffect({ 
  position, 
  type, 
  color, 
  size, 
  life, 
  maxLife 
}: ParticleEffectProps) {
  const [x, y] = position;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const lifePercentage = life / maxLife;
    
    // Fade out as life decreases
    Animated.timing(fadeAnimation, {
      toValue: lifePercentage,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Scale animation based on particle type
    if (type === 'explosion') {
      Animated.timing(scaleAnimation, {
        toValue: 2 - lifePercentage,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [life, maxLife, type, fadeAnimation, scaleAnimation]);

  const getParticleShape = () => {
    switch (type) {
      case 'explosion':
        return (
          <View
            style={[
              styles.explosionParticle,
              {
                width: size,
                height: size,
                backgroundColor: color,
              },
            ]}
          />
        );
      
      case 'spark':
        return (
          <View
            style={[
              styles.sparkParticle,
              {
                width: size * 0.5,
                height: size,
                backgroundColor: color,
              },
            ]}
          />
        );
      
      case 'smoke':
        return (
          <View
            style={[
              styles.smokeParticle,
              {
                width: size * 1.5,
                height: size * 1.5,
                backgroundColor: color,
              },
            ]}
          />
        );
      
      case 'fire':
        return (
          <View
            style={[
              styles.fireParticle,
              {
                width: size,
                height: size * 1.2,
                backgroundColor: color,
              },
            ]}
          />
        );
      
      default:
        return (
          <View
            style={[
              styles.defaultParticle,
              {
                width: size,
                height: size,
                backgroundColor: color,
              },
            ]}
          />
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - size / 2,
          top: y - size / 2,
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }],
        },
      ]}
    >
      {getParticleShape()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  explosionParticle: {
    borderRadius: 50,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  sparkParticle: {
    borderRadius: 25,
    shadowColor: '#ffff44',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  smokeParticle: {
    borderRadius: 75,
    opacity: 0.6,
  },
  fireParticle: {
    borderRadius: 30,
    shadowColor: '#ff6644',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  defaultParticle: {
    borderRadius: 50,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});