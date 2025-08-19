import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

export default function ParticleBackground() {
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Create initial particles
    const particles: Particle[] = [];
    
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(Math.random() * height),
        opacity: new Animated.Value(Math.random() * 0.6 + 0.2),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        color: Math.random() > 0.5 ? '#ff4444' : '#ff8844',
        size: Math.random() * 8 + 4,
      });
    }
    
    particlesRef.current = particles;
    animateParticles();
  }, []);

  const animateParticles = () => {
    particlesRef.current.forEach((particle, index) => {
      const animateParticle = () => {
        // Random float animation
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: false,
            }),
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: false,
            }),
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.4 + 0.1,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: false,
            }),
          ]),
          Animated.delay(Math.random() * 1000),
        ]).start(() => animateParticle());
      };
      
      // Stagger start times
      setTimeout(animateParticle, index * 200);
    });
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity,
              transform: [{ scale: particle.scale }],
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});