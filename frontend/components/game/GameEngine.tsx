import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Phoenix from './Phoenix';
import Enemy from './Enemy';
import Projectile from './Projectile';
import EnvironmentObject from './EnvironmentObject';
import ParticleEffect from './ParticleEffect';
import Boss from './Boss';

const { width, height } = Dimensions.get('window');

export interface GameEntity {
  id: string;
  x: number;
  y: number;
  type: string;
}

export interface Phoenix extends GameEntity {
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  attackType?: 'hold' | 'double' | 'triple';
}

export interface Enemy extends GameEntity {
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackPattern: string;
  lastAttack: number;
  targetX: number;
  targetY: number;
  enemyType: string;
  coins: number;
  xp: number;
}

export interface Projectile extends GameEntity {
  vx: number;
  vy: number;
  damage: number;
  owner: 'phoenix' | 'enemy';
  projectileType: string;
  color: string;
  life: number;
}

export interface EnvironmentObject extends GameEntity {
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export interface ParticleEffect extends GameEntity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  particleType: string;
}

export interface Boss extends GameEntity {
  health: number;
  maxHealth: number;
  damage: number;
  phase: number;
  lastAttack: number;
  attackPattern: string[];
  currentAttack: number;
  bossType: string;
  isVulnerable: boolean;
}

export interface GameState {
  phoenix: Phoenix;
  enemies: Enemy[];
  projectiles: Projectile[];
  environmentObjects: EnvironmentObject[];
  particles: ParticleEffect[];
  boss: Boss | null;
  score: number;
  enemiesKilled: number;
  worldId: number;
  gameTime: number;
  bossSpawned: boolean;
  attackCooldowns: {
    hold: number;
    double: number;
    triple: number;
  };
}

interface GameEngineProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
  phoenixPosition: { x: number; y: number };
  gameRunning: boolean;
  equippedMoves: any;
  onGameEvent: (event: string, data: any) => void;
}

export default function GameEngine({
  gameState,
  onUpdateGameState,
  phoenixPosition,
  gameRunning,
  equippedMoves,
  onGameEvent,
}: GameEngineProps) {
  const frameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());
  const enemySpawnTimerRef = useRef<number>(0);
  const environmentSpawnTimerRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);

  const getNextId = useCallback(() => {
    idCounterRef.current += 1;
    return `entity_${idCounterRef.current}`;
  }, []);

  // Main game loop
  const gameLoop = useCallback(() => {
    if (!gameRunning) return;

    const now = Date.now();
    const deltaTime = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    onUpdateGameState((prevState) => {
      const newState = { ...prevState };
      
      // Update phoenix position
      newState.phoenix = {
        ...newState.phoenix,
        x: phoenixPosition.x,
        y: phoenixPosition.y,
      };

      // Spawn enemies
      enemySpawnTimerRef.current += deltaTime;
      if (enemySpawnTimerRef.current > getEnemySpawnInterval(newState.worldId, newState.bossSpawned)) {
        if (!newState.bossSpawned && newState.enemies.length < getMaxEnemies(newState.worldId)) {
          newState.enemies.push(spawnEnemy(newState.worldId, getNextId()));
          enemySpawnTimerRef.current = 0;
        }
      }

      // Spawn environment objects
      environmentSpawnTimerRef.current += deltaTime;
      if (environmentSpawnTimerRef.current > 2000) { // Every 2 seconds
        newState.environmentObjects.push(spawnEnvironmentObject(getNextId()));
        environmentSpawnTimerRef.current = 0;
      }

      // Spawn boss if time is up
      if (newState.gameTime >= 300 && !newState.bossSpawned) { // 5 minutes
        newState.boss = spawnBoss(newState.worldId, getNextId());
        newState.bossSpawned = true;
        newState.enemies = []; // Clear regular enemies
        onGameEvent('bossSpawned', { worldId: newState.worldId });
      }

      // Update enemies
      newState.enemies = updateEnemies(newState.enemies, newState.phoenix, deltaTime);

      // Update boss
      if (newState.boss) {
        newState.boss = updateBoss(newState.boss, newState.phoenix, deltaTime);
        if (newState.boss.health <= 0) {
          onGameEvent('bossDefeated', { 
            worldId: newState.worldId, 
            xp: newState.boss.maxHealth,
            coins: newState.boss.maxHealth * 2
          });
          newState.boss = null;
        }
      }

      // Update projectiles
      newState.projectiles = updateProjectiles(newState.projectiles, deltaTime);

      // Update environment objects
      newState.environmentObjects = updateEnvironmentObjects(newState.environmentObjects, deltaTime);

      // Update particles
      newState.particles = updateParticles(newState.particles, deltaTime);

      // Handle collisions
      const collisionResults = handleCollisions(newState);
      Object.assign(newState, collisionResults);

      return newState;
    });

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameRunning, phoenixPosition, onUpdateGameState, onGameEvent, getNextId]);

  useEffect(() => {
    if (gameRunning) {
      frameRef.current = requestAnimationFrame(gameLoop);
    } else if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameRunning, gameLoop]);

  return (
    <View style={styles.container}>
      {/* Environment Objects */}
      {gameState.environmentObjects.map((obj) => (
        <EnvironmentObject
          key={obj.id}
          position={[obj.x, obj.y]}
          type={obj.type}
          size={obj.size}
          opacity={obj.opacity}
        />
      ))}

      {/* Particles */}
      {gameState.particles.map((particle) => (
        <ParticleEffect
          key={particle.id}
          position={[particle.x, particle.y]}
          type={particle.particleType}
          color={particle.color}
          size={particle.size}
          life={particle.life}
          maxLife={particle.maxLife}
        />
      ))}

      {/* Projectiles */}
      {gameState.projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          position={[projectile.x, projectile.y]}
          type={projectile.projectileType}
          color={projectile.color}
          owner={projectile.owner}
        />
      ))}

      {/* Enemies */}
      {gameState.enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          position={[enemy.x, enemy.y]}
          type={enemy.enemyType}
          health={enemy.health}
          maxHealth={enemy.maxHealth}
        />
      ))}

      {/* Boss */}
      {gameState.boss && (
        <Boss
          key={gameState.boss.id}
          position={[gameState.boss.x, gameState.boss.y]}
          type={gameState.boss.bossType}
          health={gameState.boss.health}
          maxHealth={gameState.boss.maxHealth}
          phase={gameState.boss.phase}
          isVulnerable={gameState.boss.isVulnerable}
        />
      )}

      {/* Phoenix */}
      <Phoenix
        position={[gameState.phoenix.x, gameState.phoenix.y]}
        isAttacking={gameState.phoenix.isAttacking}
        attackType={gameState.phoenix.attackType}
      />
    </View>
  );
}

// Helper functions
function getEnemySpawnInterval(worldId: number, bossSpawned: boolean): number {
  if (bossSpawned) return 99999; // Don't spawn during boss fight
  return Math.max(800, 2500 - (worldId * 150)); // Faster spawning in higher worlds
}

function getMaxEnemies(worldId: number): number {
  return Math.min(8, 3 + worldId); // More enemies in higher worlds
}

function spawnEnemy(worldId: number, id: string): Enemy {
  const enemyTypes = getEnemyTypesForWorld(worldId);
  const selectedType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
  
  return {
    id,
    x: Math.random() * (width - 60) + 30,
    y: -50,
    type: 'enemy',
    health: selectedType.health,
    maxHealth: selectedType.health,
    damage: selectedType.damage,
    speed: selectedType.speed,
    attackPattern: selectedType.attackPattern,
    lastAttack: Date.now(),
    targetX: 0,
    targetY: 0,
    enemyType: selectedType.name,
    coins: selectedType.coins,
    xp: selectedType.xp,
  };
}

function getEnemyTypesForWorld(worldId: number) {
  const baseMultiplier = 1 + (worldId - 1) * 0.3;
  
  return [
    {
      name: 'Fire Imp',
      health: Math.floor(30 * baseMultiplier),
      damage: Math.floor(15 * baseMultiplier),
      speed: 50 + (worldId * 5),
      attackPattern: 'direct',
      coins: 3 + worldId,
      xp: 5 + worldId,
    },
    {
      name: 'Shadow Wraith',
      health: Math.floor(40 * baseMultiplier),
      damage: Math.floor(20 * baseMultiplier),
      speed: 70 + (worldId * 8),
      attackPattern: 'chase',
      coins: 4 + worldId,
      xp: 7 + worldId,
    },
    {
      name: 'Flame Turret',
      health: Math.floor(60 * baseMultiplier),
      damage: Math.floor(25 * baseMultiplier),
      speed: 20,
      attackPattern: 'ranged',
      coins: 6 + worldId,
      xp: 10 + worldId,
    },
  ];
}

function spawnBoss(worldId: number, id: string): Boss {
  const bossData = getBossForWorld(worldId);
  
  return {
    id,
    x: width / 2,
    y: height * 0.2,
    type: 'boss',
    health: bossData.health,
    maxHealth: bossData.health,
    damage: bossData.damage,
    phase: 1,
    lastAttack: Date.now(),
    attackPattern: bossData.attackPattern,
    currentAttack: 0,
    bossType: bossData.name,
    isVulnerable: true,
  };
}

function getBossForWorld(worldId: number) {
  const bosses = [
    { name: 'Inferno Guardian', health: 200, damage: 30, attackPattern: ['fireball', 'charge'] },
    { name: 'Shadow Lord', health: 300, damage: 35, attackPattern: ['shadow_bolt', 'teleport', 'summon'] },
    { name: 'Crystal Titan', health: 400, damage: 40, attackPattern: ['crystal_rain', 'slam', 'shield'] },
    { name: 'Storm Wyvern', health: 500, damage: 45, attackPattern: ['lightning', 'whirlwind', 'dive'] },
    { name: 'Void Reaper', health: 600, damage: 50, attackPattern: ['void_beam', 'teleport', 'clone'] },
    { name: 'Phoenix King', health: 700, damage: 55, attackPattern: ['phoenix_fire', 'resurrect', 'meteor'] },
    { name: 'Ice Empress', health: 800, damage: 60, attackPattern: ['ice_storm', 'freeze', 'blizzard'] },
    { name: 'Dragon Emperor', health: 900, damage: 65, attackPattern: ['dragon_breath', 'fly_by', 'roar'] },
    { name: 'Chaos Demon', health: 1000, damage: 70, attackPattern: ['chaos_orb', 'reality_tear', 'madness'] },
    { name: 'Eternal Phoenix', health: 1200, damage: 75, attackPattern: ['eternal_flame', 'rebirth', 'supernova'] },
  ];
  
  return bosses[worldId - 1] || bosses[9];
}

function spawnEnvironmentObject(id: string): EnvironmentObject {
  const objectTypes = ['cloud', 'star', 'nebula'];
  const selectedType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
  
  return {
    id,
    x: Math.random() * width,
    y: -50,
    type: selectedType,
    vx: (Math.random() - 0.5) * 20,
    vy: 30 + Math.random() * 40,
    size: 40 + Math.random() * 80,
    opacity: 0.3 + Math.random() * 0.5,
  };
}

function updateEnemies(enemies: Enemy[], phoenix: Phoenix, deltaTime: number): Enemy[] {
  return enemies.filter(enemy => {
    // Movement based on attack pattern
    if (enemy.attackPattern === 'chase') {
      const dx = phoenix.x - enemy.x;
      const dy = phoenix.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed * (deltaTime / 1000);
        enemy.y += (dy / distance) * enemy.speed * (deltaTime / 1000);
      }
    } else {
      enemy.y += enemy.speed * (deltaTime / 1000);
    }

    // Remove if off screen or dead
    return enemy.y < height + 50 && enemy.health > 0;
  });
}

function updateBoss(boss: Boss, phoenix: Phoenix, deltaTime: number): Boss {
  // Boss AI logic will be implemented here
  // For now, just basic movement
  return boss;
}

function updateProjectiles(projectiles: Projectile[], deltaTime: number): Projectile[] {
  return projectiles.filter(proj => {
    proj.x += proj.vx * (deltaTime / 1000);
    proj.y += proj.vy * (deltaTime / 1000);
    proj.life -= deltaTime;

    return proj.life > 0 && 
           proj.x > -50 && proj.x < width + 50 && 
           proj.y > -50 && proj.y < height + 50;
  });
}

function updateEnvironmentObjects(objects: EnvironmentObject[], deltaTime: number): EnvironmentObject[] {
  return objects.filter(obj => {
    obj.x += obj.vx * (deltaTime / 1000);
    obj.y += obj.vy * (deltaTime / 1000);
    return obj.y < height + 100;
  });
}

function updateParticles(particles: ParticleEffect[], deltaTime: number): ParticleEffect[] {
  return particles.filter(particle => {
    particle.x += particle.vx * (deltaTime / 1000);
    particle.y += particle.vy * (deltaTime / 1000);
    particle.life -= deltaTime;
    return particle.life > 0;
  });
}

function handleCollisions(gameState: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};
  const newParticles = [...gameState.particles];
  
  // Phoenix vs enemies collision detection and other collision logic will be added here
  
  updates.particles = newParticles;
  return updates;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
});