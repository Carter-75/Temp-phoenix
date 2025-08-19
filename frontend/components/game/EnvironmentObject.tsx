import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface EnvironmentObjectProps {
  position: [number, number];
  type: string;
  size: number;
  opacity: number;
}

export default function EnvironmentObject({ 
  position, 
  type, 
  size, 
  opacity 
}: EnvironmentObjectProps) {
  const [x, y] = position;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle floating animation
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle scaling animation
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 4000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.9,
          duration: 4000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
      ])
    );

    float.start();
    scale.start();

    return () => {
      float.stop();
      scale.stop();
    };
  }, [floatAnimation, scaleAnimation]);

  const floatX = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  const floatY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 3],
  });

  const renderObject = () => {
    switch (type) {
      case 'cloud':
        return renderCloud();
      case 'star':
        return renderStar();
      case 'nebula':
        return renderNebula();
      default:
        return renderCloud();
    }
  };

  const renderCloud = () => {
    // Cloud made of particles
    const cloudParticles = [
      { x: 0, y: 0, size: size * 0.3, color: '#ffffff' },
      { x: -size * 0.15, y: -size * 0.1, size: size * 0.25, color: '#f0f0f0' },
      { x: size * 0.15, y: -size * 0.1, size: size * 0.25, color: '#f0f0f0' },
      { x: -size * 0.1, y: size * 0.15, size: size * 0.2, color: '#e0e0e0' },
      { x: size * 0.1, y: size * 0.15, size: size * 0.2, color: '#e0e0e0' },
      { x: -size * 0.25, y: 0, size: size * 0.15, color: '#d0d0d0' },
      { x: size * 0.25, y: 0, size: size * 0.15, color: '#d0d0d0' },
    ];

    return (
      <>
        {cloudParticles.map((particle, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: opacity * 0.7,
              },
            ]}
          />
        ))}
      </>
    );
  };

  const renderStar = () => {
    return (
      <View
        style={[
          styles.star,
          {
            width: size * 0.3,
            height: size * 0.3,
            backgroundColor: '#ffff88',
            opacity: opacity,
          },
        ]}
      />
    );
  };

  const renderNebula = () => {
    const nebulaParticles = [
      { x: 0, y: 0, size: size * 0.4, color: '#ff44ff' },
      { x: -size * 0.2, y: -size * 0.15, size: size * 0.35, color: '#4444ff' },
      { x: size * 0.2, y: size * 0.15, size: size * 0.3, color: '#44ffff' },
      { x: -size * 0.15, y: size * 0.1, size: size * 0.25, color: '#ff4488' },
      { x: size * 0.15, y: -size * 0.1, size: size * 0.25, color: '#8844ff' },
    ];

    return (
      <>
        {nebulaParticles.map((particle, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: opacity * 0.4,
              },
            ]}
          />
        ))}
      </>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - size / 2,
          top: y - size / 2,
          transform: [
            { translateX: floatX },
            { translateY: floatY },
            { scale: scaleAnimation },
          ],
        },
      ]}
    >
      {renderObject()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  star: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#ffff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
});