import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useGameState, AttackMove } from '../contexts/GameStateContext';
import { Screen } from '../GameContainer';
import ParticleBackground from '../particles/ParticleBackground';

interface ShopScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function ShopScreen({ onNavigate }: ShopScreenProps) {
  const { gameState, purchaseMove, equipMove } = useGameState();
  const [selectedTab, setSelectedTab] = useState<'hold' | 'double' | 'triple'>('double');
  const [shopMoves, setShopMoves] = useState<AttackMove[]>([]);

  useEffect(() => {
    // Generate shop moves if not already generated
    if (gameState.availableMoves.length <= 3) {
      const allMoves = [...gameState.availableMoves, ...generateShopMoves()];
      setShopMoves(allMoves);
    } else {
      setShopMoves(gameState.availableMoves);
    }
  }, [gameState.availableMoves]);

  const handlePurchase = (move: AttackMove) => {
    if (purchaseMove(move)) {
      Alert.alert('Success!', `You purchased ${move.name}!`);
    } else {
      Alert.alert('Insufficient Coins', `You need ${move.cost} coins to purchase ${move.name}.`);
    }
  };

  const handleEquip = (move: AttackMove) => {
    if (move.isOwned) {
      equipMove(move);
      Alert.alert('Equipped!', `${move.name} is now equipped!`);
    }
  };

  const filteredMoves = shopMoves.filter(move => move.type === selectedTab);

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
          <Text style={styles.title}>UPGRADE SHOP</Text>
          <Text style={styles.coinsText}>Coins: {gameState.playerStats.coins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['double', 'triple', 'hold'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()} CLICK
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Moves List */}
      <ScrollView style={styles.movesContainer} showsVerticalScrollIndicator={false}>
        {filteredMoves.map((move) => (
          <View key={move.id} style={styles.moveCard}>
            <View style={styles.moveHeader}>
              <Text style={styles.moveName}>{move.name}</Text>
              <View style={[styles.moveType, { backgroundColor: move.color }]}>
                <Text style={styles.moveTypeText}>{move.type.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.moveDescription}>{move.description}</Text>
            
            <View style={styles.moveStats}>
              <Text style={styles.statText}>Damage: {move.damage}</Text>
              <Text style={styles.statText}>Cooldown: {move.cooldown / 1000}s</Text>
            </View>

            <View style={styles.moveActions}>
              {!move.isOwned ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.purchaseButton]}
                  onPress={() => handlePurchase(move)}
                >
                  <Text style={styles.actionButtonText}>BUY - {move.cost} Coins</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    move.isEquipped ? styles.equippedButton : styles.equipButton
                  ]}
                  onPress={() => handleEquip(move)}
                  disabled={move.isEquipped}
                >
                  <Text style={styles.actionButtonText}>
                    {move.isEquipped ? 'EQUIPPED' : 'EQUIP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Generate additional shop moves
function generateShopMoves(): AttackMove[] {
  const moves: AttackMove[] = [];
  
  // Hold moves (25 total including starters)
  const holdMoves = [
    { name: 'Dragon\'s Breath', damage: 75, cooldown: 10000, cost: 100, description: 'Intense flame torrent' },
    { name: 'Solar Flare', damage: 100, cooldown: 12000, cost: 200, description: 'Blinding solar energy' },
    { name: 'Inferno Wave', damage: 125, cooldown: 15000, cost: 350, description: 'Devastating fire wave' },
    { name: 'Phoenix Nova', damage: 150, cooldown: 18000, cost: 500, description: 'Explosive nova blast' },
    { name: 'Cosmic Fire', damage: 200, cooldown: 20000, cost: 750, description: 'Otherworldly flames' },
  ];

  // Double click moves (25 total)
  const doubleMoves = [
    { name: 'Flame Burst', damage: 20, cooldown: 1200, cost: 50, description: 'Rapid fire burst' },
    { name: 'Fire Lance', damage: 25, cooldown: 1000, cost: 100, description: 'Piercing flame spear' },
    { name: 'Spark Storm', damage: 30, cooldown: 800, cost: 150, description: 'Multiple fire sparks' },
    { name: 'Blaze Bullet', damage: 35, cooldown: 600, cost: 250, description: 'High-speed fire bullet' },
    { name: 'Meteor Dash', damage: 45, cooldown: 500, cost: 400, description: 'Lightning-fast meteor' },
  ];

  // Triple click moves (25 total)
  const tripleMoves = [
    { name: 'Phoenix Claw', damage: 45, cooldown: 3500, cost: 75, description: 'Powerful claw attack' },
    { name: 'Flame Tornado', damage: 60, cooldown: 3000, cost: 150, description: 'Spinning fire vortex' },
    { name: 'Fire Storm', damage: 75, cooldown: 2500, cost: 300, description: 'Chaotic flame storm' },
    { name: 'Solar Bomb', damage: 90, cooldown: 2000, cost: 450, description: 'Explosive solar energy' },
    { name: 'Phoenix Fury', damage: 120, cooldown: 1800, cost: 650, description: 'Ultimate phoenix rage' },
  ];

  // Generate moves with proper IDs and colors
  holdMoves.forEach((move, index) => {
    moves.push({
      id: `hold_${index + 2}`,
      type: 'hold',
      color: '#ff2222',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  doubleMoves.forEach((move, index) => {
    moves.push({
      id: `double_${index + 2}`,
      type: 'double',
      color: '#ff6644',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  tripleMoves.forEach((move, index) => {
    moves.push({
      id: `triple_${index + 2}`,
      type: 'triple',
      color: '#ff8844',
      isOwned: false,
      isEquipped: false,
      ...move,
    });
  });

  return moves;
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
  coinsText: {
    color: '#ff8844',
    fontSize: 16,
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  activeTab: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6644',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  movesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  moveCard: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moveName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  moveType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  moveTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moveDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
  },
  moveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    color: '#ff8844',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moveActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: '#ff4444',
  },
  equipButton: {
    backgroundColor: '#44ff44',
  },
  equippedButton: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});