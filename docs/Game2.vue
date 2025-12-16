<script setup lang="ts">
import { onMounted, ref } from 'vue';

const gameContainer = ref<HTMLDivElement | null>(null);
let game: any = null;
let Phaser: any = null;

// 调试函数
function debugLog(message: string) {
  console.log(`[Game2.vue] ${message}`);
}

onMounted(async () => {
  debugLog('onMounted 开始执行');

  // 动态导入Phaser
  if (typeof window !== 'undefined') {
    Phaser = await import('phaser').then((module) => module.default || module);
    debugLog('Phaser已可用！版本: ' + Phaser.VERSION);
    initGame();
  } else {
    debugLog('Phaser只能在客户端环境中运行');
  }
});

function initGame() {
  debugLog('开始初始化游戏');

  if (!gameContainer.value || !Phaser) {
    debugLog('游戏容器或Phaser不存在');
    return;
  }

  try {
    // 游戏配置
    const config: any = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.value,
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // 地牢游戏不需要重力
          debug: false, // 调试模式
        },
      },
    };

    // 初始化游戏
    game = new Phaser.Game(config);
    debugLog('游戏初始化成功');
  } catch (error) {
    debugLog(`游戏初始化失败: ${error}`);
  }
}

function preload() {
  debugLog('preload函数被调用');

  // 预加载资源
  // 使用Phaser.io的示例资源
  this.load.image('player', 'https://labs.phaser.io/assets/sprites/orange-cat1.png');
  this.load.image('wall', 'https://labs.phaser.io/assets/sprites/block.png');
  this.load.image('floor', 'https://labs.phaser.io/assets/sprites/diamond.png');
  this.load.image('sword', 'https://labs.phaser.io/assets/sprites/bullet.png');
  this.load.image('background', 'https://labs.phaser.io/assets/skies/dungeon.png');
}

function create() {
  debugLog('create函数被调用');

  // 创建背景
  this.add.image(400, 300, 'background').setScale(2);

  // 创建地板网格
  this.floorGroup = this.physics.add.staticGroup();
  for (let x = 0; x < 800; x += 40) {
    for (let y = 0; y < 600; y += 40) {
      const floor = this.floorGroup.create(x, y, 'floor');
      floor.setScale(0.5);
    }
  }

  // 创建玩家
  this.player = this.physics.add.sprite(400, 300, 'player');
  this.player.setCollideWorldBounds(true); // 限制在游戏区域内
  this.player.setScale(1.5);

  // 创建障碍物组
  this.obstacles = this.physics.add.staticGroup();

  // 初始生成障碍物
  generateObstacles.call(this);

  // 创建刀（用于鼠标点击攻击）
  this.sword = this.physics.add.sprite(this.player.x, this.player.y, 'sword');
  this.sword.setScale(5); // 增大刀的大小
  this.sword.setVisible(false);

  // 键盘控制
  this.cursors = this.input.keyboard.createCursorKeys();
  this.wasd = {
    w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
  };

  // 鼠标点击挥刀
  this.input.on(
    'pointerdown',
    () => {
      swingSword.call(this);
    },
    this
  );

  // 鼠标移动
  this.input.on(
    'pointermove',
    (pointer: any) => {
      this.mouseX = pointer.x;
      this.mouseY = pointer.y;
    },
    this
  );

  // 碰撞检测
  this.physics.add.collider(this.player, this.obstacles);

  // 初始化游戏状态
  this.swordSwinging = false;
  this.mouseX = 400;
  this.mouseY = 300;
  this.movementThreshold = 50; // 移动多少距离后更新障碍物
  this.lastObstacleUpdate = { x: 400, y: 300 };
}

function update() {
  // 角色移动
  const speed = 200;
  let moved = false;

  // 重置速度
  this.player.setVelocity(0);

  // WASD控制
  if (this.wasd.w.isDown) {
    this.player.setVelocityY(-speed);
    moved = true;
  } else if (this.wasd.s.isDown) {
    this.player.setVelocityY(speed);
    moved = true;
  }

  if (this.wasd.a.isDown) {
    this.player.setVelocityX(-speed);
    moved = true;
  } else if (this.wasd.d.isDown) {
    this.player.setVelocityX(speed);
    moved = true;
  }

  // 如果角色移动了，检查是否需要更新障碍物
  if (moved) {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.lastObstacleUpdate.x,
      this.lastObstacleUpdate.y
    );

    if (distance > this.movementThreshold) {
      updateObstacles.call(this);
      this.lastObstacleUpdate = { x: this.player.x, y: this.player.y };
    }
  }

  // 更新刀的位置（跟随鼠标）
  if (this.swordSwinging) {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.mouseX, this.mouseY);

    const swordDistance = 40; // 增加刀与玩家的距离，适应更大的刀
    this.sword.x = this.player.x + Math.cos(angle) * swordDistance;
    this.sword.y = this.player.y + Math.sin(angle) * swordDistance;
  }
}

// 生成障碍物
function generateObstacles() {
  // 清除现有障碍物
  this.obstacles.clear(true, true);

  // 随机生成障碍物
  const obstacleCount = Phaser.Math.Between(10, 20);

  for (let i = 0; i < obstacleCount; i++) {
    let x, y;
    let validPosition = false;

    // 确保障碍物不与玩家重叠
    while (!validPosition) {
      x = Phaser.Math.Between(50, 750);
      y = Phaser.Math.Between(50, 550);

      const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      if (distanceToPlayer > 100) {
        // 距离玩家至少100像素
        validPosition = true;
      }
    }

    const obstacle = this.obstacles.create(x, y, 'wall');
    obstacle.setScale(1.5);
    obstacle.refreshBody();
  }
}

// 更新障碍物（角色移动时）
function updateObstacles() {
  // 随机移除一些旧障碍物
  const obstaclesToRemove = Phaser.Math.Between(2, 5);
  let removed = 0;

  // 使用getChildren()获取障碍物数组，避免在迭代过程中修改组的内容
  const obstaclesArray = this.obstacles.getChildren();
  obstaclesArray.forEach((obstacle: any) => {
    if (removed < obstaclesToRemove && Math.random() < 0.3 && obstacle) {
      obstacle.destroy();
      removed++;
    }
  });

  // 随机添加新障碍物
  const obstaclesToAdd = Phaser.Math.Between(2, 5);

  for (let i = 0; i < obstaclesToAdd; i++) {
    let x, y;
    let validPosition = false;

    // 确保新障碍物不与玩家和现有障碍物重叠
    while (!validPosition) {
      x = Phaser.Math.Between(50, 750);
      y = Phaser.Math.Between(50, 550);

      const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      let collision = false;

      // 检查与现有障碍物的碰撞
      this.obstacles.children.iterate((obstacle: any) => {
        const distance = Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y);
        if (distance < 40) {
          collision = true;
        }
      });

      if (distanceToPlayer > 100 && !collision) {
        validPosition = true;
      }
    }

    const obstacle = this.obstacles.create(x, y, 'wall');
    obstacle.setScale(1.5);
    obstacle.refreshBody();
  }
}

// 挥刀动画
function swingSword() {
  if (!this.swordSwinging) {
    this.swordSwinging = true;
    this.sword.setVisible(true);

    // 计算刀的位置（指向鼠标）
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.mouseX, this.mouseY);

    const swordDistance = 30;
    this.sword.x = this.player.x + Math.cos(angle) * swordDistance;
    this.sword.y = this.player.y + Math.sin(angle) * swordDistance;

    // 刀的旋转动画
    this.tweens.add({
      targets: this.sword,
      rotation: angle + Math.PI / 2,
      duration: 100,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.swordSwinging = false;
        this.sword.setVisible(false);
      },
    });

    // 刀的攻击范围检测
    // 使用getChildren()获取障碍物数组，避免在迭代过程中修改组的内容
    const obstaclesArray = this.obstacles.getChildren();
    obstaclesArray.forEach((obstacle: any) => {
      if (obstacle) {
        const distance = Phaser.Math.Distance.Between(
          this.sword.x,
          this.sword.y,
          obstacle.x,
          obstacle.y
        );

        if (distance < 45) {
          // 增加攻击范围，与更大的刀匹配
          // 移除被攻击的障碍物
          obstacle.destroy();
        }
      }
    });
  }
}
</script>

<template>
  <div class="game-container">
    <h2>地牢冒险游戏</h2>
    <div class="game-info">
      <p>WASD控制移动 | 鼠标点击挥刀</p>
      <p>移动会生成新的障碍物</p>
    </div>
    <div ref="gameContainer" class="game-canvas"></div>
  </div>
</template>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h2 {
  color: #333;
  margin-bottom: 10px;
}

.game-info {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
}

.game-canvas {
  width: 100%;
  height: 600px;
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}
</style>
