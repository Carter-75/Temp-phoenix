import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MenuScreen from './screens/MenuScreen';
import GameScreen from './screens/GameScreen';
import ShopScreen from './screens/ShopScreen';
import WorldSelectScreen from './screens/WorldSelectScreen';
import { GameStateProvider } from './contexts/GameStateContext';

export type Screen = 'menu' | 'game' | 'shop' | 'worldSelect';

export default function GameContainer() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [selectedWorld, setSelectedWorld] = useState<number>(1);

  const handleWorldSelect = (worldId: number) => {
    setSelectedWorld(worldId);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuScreen onNavigate={setCurrentScreen} />;
      case 'game':
        return <GameScreen onNavigate={setCurrentScreen} worldId={selectedWorld} />;
      case 'shop':
        return <ShopScreen onNavigate={setCurrentScreen} />;
      case 'worldSelect':
        return <WorldSelectScreen onNavigate={setCurrentScreen} onSelectWorld={handleWorldSelect} />;
      default:
        return <MenuScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <GameStateProvider>
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </GameStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});