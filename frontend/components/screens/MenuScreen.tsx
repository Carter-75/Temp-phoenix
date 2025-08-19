import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import ParticleBackground from '../particles/ParticleBackground';

const { width, height } = Dimensions.get('window');

interface MenuScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function MenuScreen({ onNavigate }: MenuScreenProps) {
  const { gameState } = useGameState();

  return (
    <View style={styles.container}>
      <ParticleBackground />
      
      {/* Banner Ad Placeholder */}
      <View style={styles.bannerAd}>
        <Text style={styles.adText}>Banner Ad Placement</Text>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>PHOENIX</Text>
          <Text style={styles.subtitle}>FLYING LEGENDS</Text>
        </View>

        {/* Player Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{gameState.playerStats.level}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Coins</Text>
            <Text style={styles.statValue}>{gameState.playerStats.coins}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Health</Text>
            <Text style={styles.statValue}>{gameState.playerStats.maxHealth}</Text>
          </View>
        </View>

        {/* Menu Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => onNavigate('game')}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              PLAY GAME
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onNavigate('shop')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              UPGRADE SHOP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {}}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              WORLDS
            </Text>
          </TouchableOpacity>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>
            XP: {gameState.playerStats.xp} / {gameState.playerStats.xpToNext}
          </Text>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpProgress,
                {
                  width: `${
                    (gameState.playerStats.xp / gameState.playerStats.xpToNext) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000014',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerAd: {
    height: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ff6644',
  },
  adText: {
    color: '#fff',
    fontSize: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff4444',
    textShadowColor: '#ff8844',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ff8844',
    letterSpacing: 3,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  statLabel: {
    color: '#ff8844',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
  },
  primaryButton: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6644',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#ff8844',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#ff8844',
  },
  xpContainer: {
    width: '80%',
    marginTop: 40,
    alignItems: 'center',
  },
  xpLabel: {
    color: '#ff8844',
    fontSize: 14,
    marginBottom: 8,
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 136, 68, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#ff8844',
    borderRadius: 4,
  },
});