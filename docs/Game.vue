<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Phaser from 'phaser';

const gameContainer = ref<HTMLDivElement | null>(null);
let game: any = null;

// 添加一个简单的调试函数
function debugLog(message: string) {
  console.log(`[Game.vue] ${message}`);
  // 在页面上显示调试信息
  const debugDiv = document.getElementById('debug-info');
  if (debugDiv) {
    debugDiv.innerHTML += `<p>${message}</p>`;
    // 限制调试信息的数量，最多显示20条
    const paragraphs = debugDiv.querySelectorAll('p');
    if (paragraphs.length > 20) {
      paragraphs[0].remove();
    }
  }
}

onMounted(() => {
  debugLog('onMounted 开始执行');

  // 使用直接导入的Phaser初始化游戏
  alert('Phaser已可用！版本: ' + Phaser.VERSION);
  debugLog('Phaser已可用！版本: ' + Phaser.VERSION);
  initGame();
});

function initGame() {
  debugLog('开始初始化游戏');

  if (!gameContainer.value) {
    debugLog('游戏容器不存在');
    return;
  }

  debugLog(`Phaser版本: ${Phaser.VERSION}`);

  try {
    // 创建Phaser游戏配置
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
          gravity: { y: 200 },
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
  this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
  this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullet.png');
  // 加载三种怪物图片
  this.load.image('monster1', 'https://labs.phaser.io/assets/sprites/alien.png');
  this.load.image('monster2', 'https://labs.phaser.io/assets/sprites/ufo.png');
  this.load.image('monster3', 'https://labs.phaser.io/assets/sprites/space-baddie.png');
}

function create() {
  debugLog('create函数被调用');

  // 直接创建背景，自动缩放以适应游戏区域
  const bg1 = this.add.tileSprite(0, 0, 1600, 600, 'sky');
  bg1.setOrigin(0, 0);

  // 存储背景引用
  this.backgrounds = [bg1];

  debugLog('背景创建完成，使用tileSprite实现无缝滚动');

  // 创建玩家（小人）
  const player = this.physics.add.image(400, 500, 'player');
  player.setCollideWorldBounds(true);

  // 创建鼠标指针
  this.input.on(
    'pointermove',
    function (pointer) {
      // 只有在游戏未结束时才允许玩家移动
      if (!this.gameOver) {
        // 横向跟随鼠标移动
        player.x = pointer.x;
        player.y = pointer.y;
      }
    },
    this
  );

  // 初始化游戏状态
  this.gameOver = false;

  // 初始化分数
  this.score = 0;

  // 创建右上角计分文本
  this.scoreText = this.add.text(500, 10, `击杀: ${this.score}`, {
    font: '24px Arial',
    fill: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 10, y: 5 },
  });
  this.scoreText.setOrigin(1, 0); // 右上角对齐
  this.scoreText.depth = 9999;

  // 创建子弹组
  const maxBullets = 30;
  const bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: maxBullets,
  });

  // 简化子弹数量显示：直接在游戏场景中创建一个简单的文本对象
  const bulletCount = { current: maxBullets };

  // 创建一个简单的文本显示，放在左上角
  const bulletText = this.add.text(10, 10, `粒子高能光束: ${bulletCount.current}`, {
    font: '14px Arial',
    fill: '#ffffff',
    backgroundColor: '#000000',
  });

  // 确保文本在最上层
  bulletText.depth = 9999;

  // 调试：显示文本信息
  console.log('子弹文本信息:', {
    x: bulletText.x,
    y: bulletText.y,
    text: bulletText.text,
    depth: bulletText.depth,
    visible: bulletText.visible,
  });

  // 更新子弹数量的函数
  function updateBulletCount() {
    // 直接递减计数
    bulletCount.current = Math.max(0, bulletCount.current - 1);
    bulletText.setText(`粒子高能光束剩余: ${bulletCount.current}`);

    console.log('子弹数量更新:', bulletCount.current);
  }

  // 添加鼠标左键点击事件监听器，用于发射子弹
  this.input.on(
    'pointerdown',
    function (pointer) {
      // 只有在游戏未结束时才发射子弹
      if (!this.gameOver && bulletCount.current > 0) {
        const bullet = bullets.get(player.x, player.y - 20);
        if (bullet) {
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.setVelocityY(-500); // 向上发射

          // 更新子弹数量显示 - 发射时减少
          updateBulletCount();

          // 子弹超出屏幕后回收
          bullet.checkWorldBounds = true;
          bullet.on('worldbounds', function (body) {
            bullets.killAndHide(body.gameObject);
            // 子弹回收时不再减少数量
          });
        }
      } else if (bulletCount.current <= 0) {
        console.log('子弹已用完！');
      }
    },
    this
  );

  // 创建怪物组
  const monsters = this.physics.add.group({
    runChildUpdate: true,
  });

  // 定义怪物类型
  const monsterTypes = ['monster1', 'monster2', 'monster3'];

  // 生成怪物的函数
  function spawnMonster() {
    // 随机选择怪物类型
    const monsterTypeIndex = Math.floor(Math.random() * monsterTypes.length);
    const monsterType = monsterTypes[monsterTypeIndex];

    // 随机选择生成位置（上、左、右边缘）
    const sides = ['top', 'left', 'right'];
    const sideIndex = Math.floor(Math.random() * sides.length);
    const side = sides[sideIndex];
    let x, y;

    switch (side) {
      case 'top':
        x = Math.floor(Math.random() * (800 - 0 + 1)) + 0;
        y = -50;
        break;
      case 'left':
        x = -50;
        y = Math.floor(Math.random() * (600 - 0 + 1)) + 0;
        break;
      case 'right':
        x = 850;
        y = Math.floor(Math.random() * (600 - 0 + 1)) + 0;
        break;
    }

    // 创建怪物
    const monster = monsters.create(x, y, monsterType);
    monster.setCollideWorldBounds(false);
    monster.setBounce(0.7);

    // 随机调整怪物大小（1-3倍）
    const scale = Math.random() * (3 - 1) + 1;
    monster.setScale(scale);

    // 计算朝向玩家的方向
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 设置怪物朝向玩家移动的速度
    const speed = 90;
    monster.setVelocityX((dx / distance) * speed);
    monster.setVelocityY((dy / distance) * speed);

    // 设置怪物生命值
    monster.health = 2;

    // 设置怪物超出屏幕后自动消失
    monster.checkWorldBounds = true;
    monster.on('worldbounds', function (body) {
      monsters.killAndHide(body.gameObject);
      body.gameObject.setActive(false);
    });
  }

  // 设置定时器定期生成怪物
  // 增加怪物出现频率，每个定时器间隔800ms
  this.time.addEvent({
    delay: 800, // 每800ms生成一个怪物
    callback: spawnMonster,
    loop: true,
  });
  this.time.addEvent({
    delay: 800, // 每800ms生成一个怪物
    callback: spawnMonster,
    loop: true,
  });
  this.time.addEvent({
    delay: 800, // 每800ms生成一个怪物
    callback: spawnMonster,
    loop: true,
  });

  // 子弹与怪物碰撞检测
  this.physics.add.overlap(
    bullets,
    monsters,
    function (bullet, monster) {
      // 子弹消失
      bullets.killAndHide(bullet);
      bullet.setActive(false);

      // 怪物消失并移除碰撞体
      monsters.killAndHide(monster);
      monster.setActive(false);
      monster.body.enable = false; // 禁用物理碰撞体
      monster.disableBody(true, true); // 彻底禁用物理体

      // 增加分数并更新显示
      this.score += 1;
      this.scoreText.setText(`击杀: ${this.score}`);

      debugLog('子弹击中怪物！分数: ' + this.score);
    },
    null,
    this
  );

  // 怪物与玩家碰撞检测（近战攻击）
  this.physics.add.overlap(
    player,
    monsters,
    function (player, monster) {
      // 只有在游戏未结束且怪物处于活动状态时才处理碰撞
      if (!this.gameOver && monster.active) {
        // 设置游戏结束状态
        this.gameOver = true;

        // 玩家受到伤害
        debugLog('玩家受到攻击！游戏结束！');

        // 怪物消失
        monsters.killAndHide(monster);
        monster.setActive(false);
        monster.body.enable = false; // 禁用物理碰撞体

        // 创建游戏结束文本
        const gameOverText = this.add.text(400, 300, '菜 就多练', {
          font: '64px Arial',
          fill: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 20, y: 10 },
        });

        // 设置文本居中
        gameOverText.setOrigin(0.5);
        gameOverText.depth = 9999;

        // 创建最终得分文本
        const finalScoreText = this.add.text(400, 200, `得分: ${this.score}`, {
          font: '32px Arial',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 20, y: 10 },
        });

        // 设置最终得分文本居中
        finalScoreText.setOrigin(0.5);
        finalScoreText.depth = 9999;

        // 暂停游戏
        this.physics.pause();

        // 可以添加重新开始按钮
        const restartButton = this.add.text(400, 400, 'man 再来一次', {
          font: '32px Arial',
          fill: '#ffffff',
          backgroundColor: '#0066cc',
          padding: { x: 20, y: 10 },
        });
        restartButton.setOrigin(0.5);
        restartButton.depth = 9999;

        // 重新开始按钮点击事件
        restartButton.setInteractive();
        restartButton.on(
          'pointerdown',
          function () {
            // 重新加载页面
            window.location.reload();
          },
          this
        );
      }
    },
    null,
    this
  );

  debugLog('游戏场景创建完成');
}

function update() {
  // 背景滚动 - 使用tileSprite的tilePositionX属性实现无缝滚动
  const backgroundSpeed = 2;

  this.backgrounds.forEach((bg) => {
    bg.tilePositionX += backgroundSpeed;
  });
}
</script>

<template>
  <div class="game-container">
    <h2>是男人就冲30杀！</h2>
    <div ref="gameContainer" class="game-canvas"></div>

    <!-- 调试信息区域 -->
    <div id="debug-info" class="debug-info">
      <h3>调试信息： (文明游戏 请勿骂人)</h3>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.game-canvas {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}
</style>
