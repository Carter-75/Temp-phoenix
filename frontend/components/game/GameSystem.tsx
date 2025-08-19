import { GameEngineUpdateEventOptionType } from 'react-native-game-engine';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface Phoenix {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: string;
  attackPattern: string;
  damage: number;
  speed: number;
  lastAttack: number;
  targetX: number;
  targetY: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  owner: 'phoenix' | 'enemy';
  type: string;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface EnvironmentObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'cloud' | 'obstacle';
  size: number;
}

export interface GameData {
  phoenix: Phoenix;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  environmentObjects: EnvironmentObject[];
  score: number;
  gameTime: number;
  worldId: number;
  attackCooldowns: {
    hold: number;
    double: number;
    triple: number;
  };
  isAttacking: boolean;
  lastTouchTime: number;
  touchCount: number;
}

interface GameCallbacks {
  gainXP: (amount: number) => void;
  gainCoins: (amount: number) => void;
  setHealth: (health: number) => void;
  setScore: (score: number) => void;
}

export function createGameSystem(
  gameDataRef: React.MutableRefObject<GameData>,
  callbacks: GameCallbacks
) {
  let enemySpawnTimer = 0;
  let particleIdCounter = 0;
  let projectileIdCounter = 0;
  let enemyIdCounter = 0;

  return (entities: any, { time }: GameEngineUpdateEventOptionType) => {
    const gameData = gameDataRef.current;
    const deltaTime = time.current - time.previous;

    // Spawn environment objects (clouds)
    if (Math.random() < 0.02) {
      spawnEnvironmentObject(gameData);
    }

    // Spawn enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > getEnemySpawnInterval(gameData.worldId)) {
      spawnEnemy(gameData);
      enemySpawnTimer = 0;
    }

    // Update environment objects
    updateEnvironmentObjects(gameData, deltaTime);

    // Update enemies
    updateEnemies(gameData, deltaTime, callbacks);

    // Update projectiles
    updateProjectiles(gameData, deltaTime);

    // Update particles
    updateParticles(gameData, deltaTime);

    // Check collisions
    checkCollisions(gameData, callbacks);

    // Update phoenix position in entities
    if (entities.phoenix) {
      entities.phoenix.position = [gameData.phoenix.x, gameData.phoenix.y];
    }

    return entities;
  };

  function spawnEnvironmentObject(gameData: GameData) {
    const envObject: EnvironmentObject = {
      id: `env_${Date.now()}`,
      x: Math.random() * width,
      y: -50,
      vx: 0,
      vy: 50 + Math.random() * 30,
      type: 'cloud',
      size: 30 + Math.random() * 40,
    };
    gameData.environmentObjects.push(envObject);
  }

  function getEnemySpawnInterval(worldId: number): number {
    // Enemies spawn faster in higher worlds
    return Math.max(1000, 3000 - (worldId * 200));
  }

  function spawnEnemy(gameData: GameData) {
    const enemyTypes = getEnemyTypesForWorld(gameData.worldId);
    const selectedType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    const enemy: Enemy = {
      id: `enemy_${enemyIdCounter++}`,
      x: Math.random() * (width - 60) + 30,
      y: -50,
      health: selectedType.health,
      maxHealth: selectedType.health,
      type: selectedType.name,
      attackPattern: selectedType.attackPattern,
      damage: selectedType.damage,
      speed: selectedType.speed,
      lastAttack: Date.now(),
      targetX: gameData.phoenix.x,
      targetY: gameData.phoenix.y,
    };
    
    gameData.enemies.push(enemy);
  }

  function getEnemyTypesForWorld(worldId: number) {
    const baseEnemies = [
      {
        name: 'Fire Imp',
        health: 30 + (worldId * 5),
        damage: 10 + (worldId * 2),
        speed: 40 + (worldId * 5),
        attackPattern: 'direct',
      },
      {
        name: 'Shadow Wraith',
        health: 40 + (worldId * 7),
        damage: 15 + (worldId * 3),
        speed: 60 + (worldId * 8),
        attackPattern: 'chase',
      },
      {
        name: 'Flame Turret',
        health: 60 + (worldId * 10),
        damage: 20 + (worldId * 4),
        speed: 20,
        attackPattern: 'ranged',
      },
    ];
    return baseEnemies;
  }

  function updateEnvironmentObjects(gameData: GameData, deltaTime: number) {
    gameData.environmentObjects = gameData.environmentObjects.filter(obj => {
      obj.y += obj.vy * (deltaTime / 1000);
      return obj.y < height + 100; // Remove when off screen
    });
  }

  function updateEnemies(gameData: GameData, deltaTime: number, callbacks: GameCallbacks) {
    gameData.enemies = gameData.enemies.filter(enemy => {
      // Movement
      if (enemy.attackPattern === 'chase') {
        const dx = gameData.phoenix.x - enemy.x;
        const dy = gameData.phoenix.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          enemy.x += (dx / distance) * enemy.speed * (deltaTime / 1000);
          enemy.y += (dy / distance) * enemy.speed * (deltaTime / 1000);
        }
      } else {
        enemy.y += enemy.speed * (deltaTime / 1000);
      }

      // Attack patterns
      const now = Date.now();
      if (now - enemy.lastAttack > getAttackInterval(enemy.attackPattern)) {
        performEnemyAttack(enemy, gameData);
        enemy.lastAttack = now;
      }

      // Remove if off screen or dead
      if (enemy.y > height + 50 || enemy.health <= 0) {
        if (enemy.health <= 0) {
          // Enemy killed - give rewards
          const xpReward = 10 + (gameData.worldId * 2);
          const coinReward = 5 + (gameData.worldId * 1);
          callbacks.gainXP(xpReward);
          callbacks.gainCoins(coinReward);
          
          // Create death particles
          createDeathParticles(gameData, enemy.x, enemy.y);
        }
        return false;
      }
      
      return true;
    });
  }

  function getAttackInterval(attackPattern: string): number {
    switch (attackPattern) {
      case 'direct': return 2000;
      case 'chase': return 1500;
      case 'ranged': return 3000;
      default: return 2000;
    }
  }

  function performEnemyAttack(enemy: Enemy, gameData: GameData) {
    if (enemy.attackPattern === 'ranged') {
      // Create projectile toward phoenix
      const dx = gameData.phoenix.x - enemy.x;
      const dy = gameData.phoenix.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const speed = 200;
        const projectile: Projectile = {
          id: `proj_${projectileIdCounter++}`,
          x: enemy.x,
          y: enemy.y,
          vx: (dx / distance) * speed,
          vy: (dy / distance) * speed,
          damage: enemy.damage,
          owner: 'enemy',
          type: 'fireball',
          color: '#ff4444',
        };
        gameData.projectiles.push(projectile);
      }
    }
  }

  function updateProjectiles(gameData: GameData, deltaTime: number) {
    gameData.projectiles = gameData.projectiles.filter(proj => {
      proj.x += proj.vx * (deltaTime / 1000);
      proj.y += proj.vy * (deltaTime / 1000);

      // Remove if off screen
      return proj.x > -50 && proj.x < width + 50 && 
             proj.y > -50 && proj.y < height + 50;
    });
  }

  function updateParticles(gameData: GameData, deltaTime: number) {
    gameData.particles = gameData.particles.filter(particle => {
      particle.x += particle.vx * (deltaTime / 1000);
      particle.y += particle.vy * (deltaTime / 1000);
      particle.life -= deltaTime;

      return particle.life > 0;
    });
  }

  function checkCollisions(gameData: GameData, callbacks: GameCallbacks) {
    // Phoenix vs enemies
    gameData.enemies.forEach(enemy => {
      const dx = enemy.x - gameData.phoenix.x;
      const dy = enemy.y - gameData.phoenix.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        // Collision - damage phoenix
        gameData.phoenix.health = Math.max(0, gameData.phoenix.health - enemy.damage);
        callbacks.setHealth(gameData.phoenix.health);
        
        // Push enemy away
        enemy.x += dx * 2;
        enemy.y += dy * 2;
      }
    });

    // Projectiles vs targets
    gameData.projectiles = gameData.projectiles.filter(proj => {
      if (proj.owner === 'phoenix') {
        // Phoenix projectile vs enemies
        for (let enemy of gameData.enemies) {
          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 20) {
            enemy.health -= proj.damage;
            createHitParticles(gameData, proj.x, proj.y);
            return false; // Remove projectile
          }
        }
      } else {
        // Enemy projectile vs phoenix
        const dx = proj.x - gameData.phoenix.x;
        const dy = proj.y - gameData.phoenix.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
          gameData.phoenix.health = Math.max(0, gameData.phoenix.health - proj.damage);
          callbacks.setHealth(gameData.phoenix.health);
          createHitParticles(gameData, proj.x, proj.y);
          return false; // Remove projectile
        }
      }
      return true;
    });
  }

  function createDeathParticles(gameData: GameData, x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const particle: Particle = {
        id: `particle_${particleIdCounter++}`,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 1000 + Math.random() * 1000,
        maxLife: 2000,
        color: Math.random() > 0.5 ? '#ff4444' : '#ff8844',
        size: 3 + Math.random() * 5,
      };
      gameData.particles.push(particle);
    }
  }

  function createHitParticles(gameData: GameData, x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const particle: Particle = {
        id: `particle_${particleIdCounter++}`,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color: '#ffff44',
        size: 2 + Math.random() * 3,
      };
      gameData.particles.push(particle);
    }
  }
}