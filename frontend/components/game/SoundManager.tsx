import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

interface SoundManagerProps {
  gameState: any;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface SoundLibrary {
  backgroundMusic: Audio.Sound | null;
  phoenixAttack: Audio.Sound | null;
  enemyHit: Audio.Sound | null;
  phoenixHit: Audio.Sound | null;
  enemyDeath: Audio.Sound | null;
  bossSpawn: Audio.Sound | null;
  bossDefeat: Audio.Sound | null;
  coinCollect: Audio.Sound | null;
  levelUp: Audio.Sound | null;
  worldComplete: Audio.Sound | null;
}

export default function SoundManager({ 
  gameState, 
  soundEnabled, 
  musicEnabled 
}: SoundManagerProps) {
  const soundsRef = useRef<SoundLibrary>({
    backgroundMusic: null,
    phoenixAttack: null,
    enemyHit: null,
    phoenixHit: null,
    enemyDeath: null,
    bossSpawn: null,
    bossDefeat: null,
    coinCollect: null,
    levelUp: null,
    worldComplete: null,
  });

  const isInitializedRef = useRef(false);

  useEffect(() => {
    initializeSounds();
    return () => {
      cleanupSounds();
    };
  }, []);

  useEffect(() => {
    if (isInitializedRef.current) {
      handleBackgroundMusic();
    }
  }, [musicEnabled, gameState.worldId]);

  const initializeSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create synthesized sounds using Web Audio API (for web compatibility)
      // In a real app, you would load actual sound files
      soundsRef.current = {
        backgroundMusic: await createSynthesizedSound('background', 2000, 0.3, true),
        phoenixAttack: await createSynthesizedSound('attack', 200, 0.5, false),
        enemyHit: await createSynthesizedSound('hit', 150, 0.4, false),
        phoenixHit: await createSynthesizedSound('damage', 300, 0.6, false),
        enemyDeath: await createSynthesizedSound('death', 500, 0.5, false),
        bossSpawn: await createSynthesizedSound('boss_spawn', 1000, 0.7, false),
        bossDefeat: await createSynthesizedSound('boss_defeat', 2000, 0.8, false),
        coinCollect: await createSynthesizedSound('coin', 100, 0.3, false),
        levelUp: await createSynthesizedSound('levelup', 800, 0.6, false),
        worldComplete: await createSynthesizedSound('world_complete', 1500, 0.7, false),
      };

      isInitializedRef.current = true;
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }
  };

  const createSynthesizedSound = async (
    type: string, 
    duration: number, 
    volume: number, 
    loop: boolean
  ): Promise<Audio.Sound | null> => {
    try {
      // For web compatibility, we'll use a simple tone generation approach
      // In a production app, you would load actual sound files
      const { sound } = await Audio.Sound.createAsync(
        { uri: generateToneDataUri(type, duration) },
        { 
          volume, 
          isLooping: loop,
          shouldPlay: false 
        }
      );
      return sound;
    } catch (error) {
      console.error(`Error creating sound ${type}:`, error);
      return null;
    }
  };

  const generateToneDataUri = (type: string, duration: number): string => {
    // Generate simple tone data URIs for different sound types
    const frequency = getSoundFrequency(type);
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration / 1000);
    
    // Create a simple sine wave
    let audioData = '';
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      const intSample = Math.floor(sample * 32767);
      audioData += String.fromCharCode(intSample & 0xFF);
      audioData += String.fromCharCode((intSample >> 8) & 0xFF);
    }
    
    return `data:audio/wav;base64,${btoa(audioData)}`;
  };

  const getSoundFrequency = (type: string): number => {
    switch (type) {
      case 'background': return 220; // A3
      case 'attack': return 440; // A4
      case 'hit': return 330; // E4
      case 'damage': return 220; // A3 (lower)
      case 'death': return 165; // E3 (low)
      case 'boss_spawn': return 110; // A2 (very low)
      case 'boss_defeat': return 880; // A5 (high)
      case 'coin': return 660; // E5
      case 'levelup': return 550; // C#5
      case 'world_complete': return 880; // A5
      default: return 440;
    }
  };

  const playSound = async (soundName: keyof SoundLibrary) => {
    if (!soundEnabled && soundName !== 'backgroundMusic') return;
    if (!musicEnabled && soundName === 'backgroundMusic') return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.error(`Error playing sound ${soundName}:`, error);
      }
    }
  };

  const stopSound = async (soundName: keyof SoundLibrary) => {
    const sound = soundsRef.current[soundName];
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error(`Error stopping sound ${soundName}:`, error);
      }
    }
  };

  const handleBackgroundMusic = async () => {
    if (musicEnabled) {
      await playSound('backgroundMusic');
    } else {
      await stopSound('backgroundMusic');
    }
  };

  const cleanupSounds = async () => {
    for (const soundName of Object.keys(soundsRef.current) as Array<keyof SoundLibrary>) {
      const sound = soundsRef.current[soundName];
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error(`Error unloading sound ${soundName}:`, error);
        }
      }
    }
  };

  // Export sound playing functions for external use
  const soundAPI = {
    playAttack: () => playSound('phoenixAttack'),
    playEnemyHit: () => playSound('enemyHit'),
    playPhoenixHit: () => playSound('phoenixHit'),
    playEnemyDeath: () => playSound('enemyDeath'),
    playBossSpawn: () => playSound('bossSpawn'),
    playBossDefeat: () => playSound('bossDefeat'),
    playCoinCollect: () => playSound('coinCollect'),
    playLevelUp: () => playSound('levelUp'),
    playWorldComplete: () => playSound('worldComplete'),
  };

  // Attach to global for external access
  (global as any).gameSounds = soundAPI;

  return null; // This is a sound manager, no visual component
}

export const useGameSounds = () => {
  return (global as any).gameSounds || {};
};