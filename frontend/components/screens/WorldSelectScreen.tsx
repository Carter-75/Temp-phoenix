import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useGameState } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import ParticleBackground from '../particles/ParticleBackground';

const { width, height } = Dimensions.get('window');

interface WorldSelectScreenProps {
  onNavigate: (screen: Screen) => void;
  onSelectWorld: (worldId: number) => void;
}

export default function WorldSelectScreen({ onNavigate, onSelectWorld }: WorldSelectScreenProps) {
  const { gameState } = useGameState();

  const worldData = [
    {
      id: 1,
      name: 'Ember Plains',
      boss: 'Inferno Guardian',
      theme: 'Fire',
      color: '#ff4444',
      description: 'Where your journey begins. Face the flames of creation.',
    },
    {
      id: 2,
      name: 'Shadow Realm',
      boss: 'Shadow Lord',
      theme: 'Dark',
      color: '#440044',
      description: 'Darkness whispers secrets. Can you hear them?',
    },
    {
      id: 3,
      name: 'Crystal Caverns',
      boss: 'Crystal Titan',
      theme: 'Crystal',
      color: '#44aaff',
      description: 'Shimmering formations hide ancient power.',
    },
    {
      id: 4,
      name: 'Storm Peaks',
      boss: 'Storm Wyvern',
      theme: 'Lightning',
      color: '#ffff44',
      description: 'Thunder echoes through the mountain heights.',
    },
    {
      id: 5,
      name: 'Void Nexus',
      boss: 'Void Reaper',
      theme: 'Void',
      color: '#220022',
      description: 'Where reality bends and breaks.',
    },
    {
      id: 6,
      name: 'Phoenix Sanctum',
      boss: 'Phoenix King',
      theme: 'Holy Fire',
      color: '#ffaa00',
      description: 'The sacred realm of the phoenix lords.',
    },
    {
      id: 7,
      name: 'Frozen Wastes',
      boss: 'Ice Empress',
      theme: 'Ice',
      color: '#88ccff',
      description: 'Eternal winter grips this desolate land.',
    },
    {
      id: 8,
      name: 'Dragon Throne',
      boss: 'Dragon Emperor',
      theme: 'Ancient',
      color: '#ff8800',
      description: 'Where dragons once ruled supreme.',
    },
    {
      id: 9,
      name: 'Chaos Dimension',
      boss: 'Chaos Demon',
      theme: 'Chaos',
      color: '#ff00ff',
      description: 'Madness incarnate awaits the worthy.',
    },
    {
      id: 10,
      name: 'Eternal Flame',
      boss: 'Eternal Phoenix',
      theme: 'Divine',
      color: '#ffffff',
      description: 'The final trial. Will you ascend?',
    },
  ];

  const getWorldProgress = (worldId: number) => {
    return gameState.worldProgress.find(w => w.worldId === worldId);
  };

  const handleWorldSelect = (worldId: number) => {
    const progress = getWorldProgress(worldId);
    if (progress?.unlocked) {
      onSelectWorld(worldId);
      onNavigate('game');
    }
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />
      
      {/* Banner Ad Placeholder */}
      <View style={styles.bannerAd}>
        <Text style={styles.adText}>Banner Ad Placement</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('menu')}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>WORLD SELECT</Text>
          <Text style={styles.subtitle}>Choose Your Battlefield</Text>
        </View>
      </View>

      {/* Worlds Grid */}
      <ScrollView 
        style={styles.worldsContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.worldsGrid}>
          {worldData.map((world) => {
            const progress = getWorldProgress(world.id);
            const isUnlocked = progress?.unlocked || false;
            const isCompleted = progress?.completed || false;

            return (
              <TouchableOpacity
                key={world.id}
                style={[
                  styles.worldCard,
                  { borderColor: world.color },
                  !isUnlocked && styles.lockedCard,
                  isCompleted && styles.completedCard,
                ]}
                onPress={() => handleWorldSelect(world.id)}
                disabled={!isUnlocked}
              >
                {/* World Number */}
                <View style={[styles.worldNumber, { backgroundColor: world.color }]}>
                  <Text style={styles.worldNumberText}>{world.id}</Text>
                </View>

                {/* World Info */}
                <View style={styles.worldInfo}>
                  <Text style={[styles.worldName, !isUnlocked && styles.lockedText]}>
                    {world.name}
                  </Text>
                  <Text style={[styles.worldTheme, { color: world.color }]}>
                    {world.theme}
                  </Text>
                  <Text style={[styles.worldDescription, !isUnlocked && styles.lockedText]}>
                    {isUnlocked ? world.description : '???'}
                  </Text>
                  <Text style={[styles.worldBoss, !isUnlocked && styles.lockedText]}>
                    Boss: {isUnlocked ? world.boss : 'Unknown'}
                  </Text>
                </View>

                {/* Status Indicators */}
                <View style={styles.worldStatus}>
                  {!isUnlocked && (
                    <View style={styles.lockedIcon}>
                      <Text style={styles.lockedIconText}>🔒</Text>
                    </View>
                  )}
                  {isCompleted && (
                    <View style={styles.completedIcon}>
                      <Text style={styles.completedIconText}>⭐</Text>
                    </View>
                  )}
                  {isUnlocked && !isCompleted && (
                    <View style={styles.availableIcon}>
                      <Text style={styles.availableIconText}>▶</Text>
                    </View>
                  )}
                </View>

                {/* Progress Stats */}
                {isUnlocked && (
                  <View style={styles.progressStats}>
                    {progress?.bestTime && (
                      <Text style={styles.statText}>
                        Best: {Math.floor(progress.bestTime / 60)}:{String(progress.bestTime % 60).padStart(2, '0')}
                      </Text>
                    )}
                    {progress?.highScore && (
                      <Text style={styles.statText}>
                        Score: {progress.highScore}
                      </Text>
                    )}
                  </View>
                )}

                {/* World Theme Particles */}
                <View style={styles.themeParticles}>
                  {[...Array(3)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.themeParticle,
                        {
                          backgroundColor: world.color,
                          left: 10 + i * 15,
                          top: 10 + i * 8,
                          opacity: isUnlocked ? 0.6 : 0.2,
                        },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonTitle}>More Worlds Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Epic battles await in future realms...
          </Text>
          <View style={styles.comingSoonCards}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.comingSoonCard}>
                <Text style={styles.comingSoonCardText}>World {11 + i}</Text>
                <Text style={styles.comingSoonCardSubtext}>Coming Soon</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000014',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#ff8844',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  subtitle: {
    color: '#ff8844',
    fontSize: 14,
    marginTop: 2,
  },
  worldsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  worldCard: {
    width: width * 0.45,
    minHeight: 200,
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 15,
    padding: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  lockedCard: {
    opacity: 0.5,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  completedCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  worldNumber: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  worldInfo: {
    flex: 1,
  },
  worldName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  worldTheme: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  worldDescription: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 8,
  },
  worldBoss: {
    fontSize: 12,
    color: '#ff8844',
    fontWeight: 'bold',
  },
  lockedText: {
    color: '#666',
  },
  worldStatus: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  lockedIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIconText: {
    fontSize: 16,
  },
  completedIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIconText: {
    fontSize: 16,
  },
  availableIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#44ff44',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressStats: {
    position: 'absolute',
    bottom: 45,
    right: 15,
  },
  statText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  themeParticles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  themeParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  comingSoonSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff8844',
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  comingSoonCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  comingSoonCard: {
    width: width * 0.28,
    height: 100,
    backgroundColor: 'rgba(255, 136, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  comingSoonCardText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  comingSoonCardSubtext: {
    color: '#666',
    fontSize: 10,
    marginTop: 5,
  },
});