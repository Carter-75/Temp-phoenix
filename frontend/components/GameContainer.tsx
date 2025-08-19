import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MenuScreen from './screens/MenuScreen';
import GameScreen from './screens/GameScreen';
import ShopScreen from './screens/ShopScreen';
import { GameStateProvider } from './contexts/GameStateContext';

export type Screen = 'menu' | 'game' | 'shop' | 'worldSelect';

export default function GameContainer() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuScreen onNavigate={setCurrentScreen} />;
      case 'game':
        return <GameScreen onNavigate={setCurrentScreen} />;
      case 'shop':
        return <ShopScreen onNavigate={setCurrentScreen} />;
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