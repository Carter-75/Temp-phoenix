import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  GestureResponderEvent,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const TOUCH_TOLERANCE = 10; // pixels - tolerance for hold attack

interface AttackSystemProps {
  onTouch: (touchCount: number) => void;
  onPanGesture: (event: any) => void;
  gameRunning: boolean;
}

export default function AttackSystem({
  onTouch,
  onPanGesture,
  gameRunning,
}: AttackSystemProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const handlePanGesture = useCallback((event: any) => {
    if (!gameRunning) return;
    
    if (event.nativeEvent.state === State.ACTIVE) {
      onPanGesture(event);
    }
  }, [gameRunning, onPanGesture]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    if (!gameRunning) return;

    const { locationX, locationY } = event.nativeEvent;
    touchStartRef.current = { x: locationX, y: locationY };
    
    // Increment tap count
    tapCountRef.current += 1;

    // Clear existing timers
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Set hold timer for potential hold attack
    holdTimerRef.current = setTimeout(() => {
      if (touchStartRef.current && !isHoldingRef.current) {
        isHoldingRef.current = true;
        onTouch(1); // Hold attack
      }
    }, 300); // 300ms to trigger hold

    // Set tap detection timer
    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current > 0 && !isHoldingRef.current) {
        // Process tap attacks
        if (tapCountRef.current >= 3) {
          onTouch(3); // Triple click
        } else if (tapCountRef.current === 2) {
          onTouch(2); // Double click
        }
      }
      tapCountRef.current = 0;
    }, 200); // 200ms window for multiple taps

  }, [gameRunning, onTouch]);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    if (!gameRunning || !touchStartRef.current) return;

    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - touchStartRef.current.x;
    const dy = locationY - touchStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved too much, cancel hold attack
    if (distance > TOUCH_TOLERANCE && isHoldingRef.current) {
      // Don't cancel - this allows for small movements during hold
      // Just update phoenix position through pan gesture
    }

    // Update phoenix position
    onPanGesture({
      nativeEvent: {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      }
    });
  }, [gameRunning, onPanGesture]);

  const handleTouchEnd = useCallback(() => {
    if (!gameRunning) return;

    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Reset hold state
    isHoldingRef.current = false;
    touchStartRef.current = null;
  }, [gameRunning]);

  const handleTouchCancel = useCallback(() => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    tapCountRef.current = 0;
    isHoldingRef.current = false;
    touchStartRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <PanGestureHandler onGestureEvent={handlePanGesture}>
      <View
        style={styles.touchArea}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      />
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
  },
});