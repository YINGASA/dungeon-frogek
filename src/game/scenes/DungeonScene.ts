import Phaser from 'phaser';
import { GameRun, LevelConfig, PlayerClassConfig } from '../../types/game';
import { storageService } from '../../services/storageService';

type EnemyKind = 'slime' | 'skeleton' | 'bat' | 'archer' | 'boss';
type RoomKind = 'spawn' | 'battle' | 'treasure' | 'elite' | 'supply' | 'boss';
type GameFlowState = 'title' | 'playing' | 'paused' | 'ended';
type PlayerActionState = 'normal' | 'attacking' | 'dashing' | 'shielding' | 'dead';
type SoundName =
  | 'swing'
  | 'hit'
  | 'hurt'
  | 'enemyDie'
  | 'pickup'
  | 'chest'
  | 'portal'
  | 'bossEnter'
  | 'bossPhase'
  | 'victory'
  | 'defeat';

type Fighter = Phaser.Physics.Arcade.Sprite & {
  stats: {
    id: string;
    name: string;
    kind: EnemyKind | 'player';
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
    range: number;
    cooldown: number;
    nextAttack: number;
    ranged?: boolean;
    boss?: boolean;
  };
};

interface UnitHud {
  name: Phaser.GameObjects.Text;
  hpBg: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
}

interface RoomDef {
  id: string;
  name: string;
  kind: RoomKind;
  description: string;
  enemies: EnemyKind[];
  reward?: 'chest' | 'potion';
}

const ROOMS: RoomDef[] = [
  { id: 'room-1', name: '出生房', kind: 'spawn', description: '灵墟入口，空气里漂浮着发光的晶尘。', enemies: [] },
  { id: 'room-2', name: '普通战斗房', kind: 'battle', description: '晶化史莱姆与骷髅守卫堵住了通道。', enemies: ['slime', 'skeleton'] },
  { id: 'room-3', name: '宝箱房', kind: 'treasure', description: '一只旧宝箱被源晶光芒包裹。', enemies: [], reward: 'chest' },
  { id: 'room-4', name: '高级战斗房', kind: 'elite', description: '暗影蝙蝠盘旋，符文射手正在蓄能。', enemies: ['bat', 'bat', 'archer'] },
  { id: 'room-5', name: '补给房', kind: 'supply', description: '石台上放着一瓶小型生命药水。', enemies: [], reward: 'potion' },
  { id: 'room-6', name: '首领房', kind: 'boss', description: '污染源晶凝聚成晶核守卫。', enemies: ['boss'] }
];

const ENEMIES: Record<EnemyKind, Omit<Fighter['stats'], 'id' | 'nextAttack'>> = {
  slime: { name: '晶化史莱姆', kind: 'slime', hp: 25, maxHp: 25, atk: 7, def: 0, speed: 55, range: 30, cooldown: 1100 },
  skeleton: { name: '骷髅守卫', kind: 'skeleton', hp: 45, maxHp: 45, atk: 10, def: 2, speed: 82, range: 34, cooldown: 1050 },
  bat: { name: '暗影蝙蝠', kind: 'bat', hp: 20, maxHp: 20, atk: 9, def: 0, speed: 140, range: 28, cooldown: 820 },
  archer: { name: '符文射手', kind: 'archer', hp: 35, maxHp: 35, atk: 10, def: 1, speed: 70, range: 230, cooldown: 1450, ranged: true },
  boss: { name: '晶核守卫', kind: 'boss', hp: 220, maxHp: 220, atk: 12, def: 3, speed: 62, range: 62, cooldown: 1100, boss: true }
};

const DUNGEON_ASSETS = [
  'floor',
  'wall',
  'door_closed',
  'door_open',
  'crystal_01',
  'crystal_02',
  'chest_closed',
  'chest_open',
  'potion_hp',
  'attack_crystal',
  'defense_charm'
] as const;

type DungeonAssetName = (typeof DUNGEON_ASSETS)[number];
const HUNTER_DIRECTIONS = ['down', 'up', 'left', 'right'] as const;
const HUNTER_FRAMES = ['1', '2'] as const;
const HUNTER_DISPLAY_SIZE = 51;
type HunterDirection = (typeof HUNTER_DIRECTIONS)[number];
type HunterFrame = 'idle' | (typeof HUNTER_FRAMES)[number];
const SLIME_FRAMES = ['idle_1', 'idle_2', 'move_1', 'move_2'] as const;
type SlimeFrame = (typeof SLIME_FRAMES)[number];
const SKELETON_FRAMES = ['idle_1', 'idle_2', 'walk_1', 'walk_2', 'attack'] as const;
type SkeletonFrame = (typeof SKELETON_FRAMES)[number];
const BAT_FRAMES = ['idle_1', 'idle_2', 'fly_1', 'fly_2', 'attack'] as const;
type BatFrame = (typeof BAT_FRAMES)[number];
const RUNE_ARCHER_FRAMES = ['idle_1', 'idle_2', 'cast_1', 'cast_2', 'attack'] as const;
type RuneArcherFrame = (typeof RUNE_ARCHER_FRAMES)[number];
const GUARDIAN_FRAMES = ['idle_1', 'idle_2', 'walk_1', 'walk_2', 'melee', 'shoot', 'phase2_idle_1', 'phase2_idle_2', 'phase2_melee', 'phase2_shoot'] as const;
type GuardianFrame = (typeof GUARDIAN_FRAMES)[number];

const BOSS_SKILL_DAMAGE = {
  phase1: {
    melee: 18,
    projectile: 14,
    spike: 18,
    shock: 18
  },
  phase2: {
    melee: 22,
    projectile: 16,
    spike: 24,
    shock: 20
  }
} as const;

interface PlayerDamageOptions {
  minDamageRatio?: number;
  invincibleMs?: number;
  shakeDuration?: number;
  shakeIntensity?: number;
  emphasized?: boolean;
}

class ProceduralSoundManager {
  private ctx?: AudioContext;
  private enabled = false;

  async init() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx ??= new AudioContextClass();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  play(name: SoundName) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const presets: Record<SoundName, { freq: number; end: number; type: OscillatorType; gain: number; slide?: number }> = {
        swing: { freq: 320, end: 0.08, type: 'triangle', gain: 0.035, slide: 160 },
        hit: { freq: 150, end: 0.07, type: 'square', gain: 0.045, slide: 70 },
        hurt: { freq: 110, end: 0.12, type: 'sawtooth', gain: 0.05, slide: 55 },
        enemyDie: { freq: 240, end: 0.18, type: 'triangle', gain: 0.04, slide: 80 },
        pickup: { freq: 640, end: 0.16, type: 'sine', gain: 0.035, slide: 980 },
        chest: { freq: 430, end: 0.2, type: 'triangle', gain: 0.04, slide: 760 },
        portal: { freq: 520, end: 0.26, type: 'sine', gain: 0.035, slide: 260 },
        bossEnter: { freq: 90, end: 0.32, type: 'sawtooth', gain: 0.055, slide: 130 },
        bossPhase: { freq: 120, end: 0.38, type: 'sawtooth', gain: 0.06, slide: 240 },
        victory: { freq: 520, end: 0.34, type: 'triangle', gain: 0.045, slide: 1040 },
        defeat: { freq: 220, end: 0.36, type: 'sawtooth', gain: 0.045, slide: 80 }
      };
      const preset = presets[name];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = preset.type;
      osc.frequency.setValueAtTime(preset.freq, now);
      if (preset.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, preset.slide), now + preset.end);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(preset.gain, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.end);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + preset.end + 0.02);
    } catch {
      // Audio should never block gameplay.
    }
  }
}

export class DungeonScene extends Phaser.Scene {
  private level: LevelConfig;
  private playerClass: PlayerClassConfig;
  private onRunEnd: (runId: string) => void;

  private player!: Fighter;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private items!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private statusText!: Phaser.GameObjects.Text;
  private skillText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private roomTitleToast?: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hudPanel?: Phaser.GameObjects.Container;
  private titlePanel?: Phaser.GameObjects.Container;
  private pausePanel?: Phaser.GameObjects.Container;
  private settlementPanel?: Phaser.GameObjects.Container;
  private doorSprite?: Phaser.GameObjects.Image;
  private doorTween?: Phaser.Tweens.Tween;
  private shieldRing?: Phaser.GameObjects.Arc;
  private bossBarBg?: Phaser.GameObjects.Rectangle;
  private bossBarFill?: Phaser.GameObjects.Rectangle;
  private bossBarText?: Phaser.GameObjects.Text;
  private unitHuds = new Map<string, UnitHud>();
  private sfx = new ProceduralSoundManager();
  private flowState: GameFlowState = 'title';
  private gameReady = false;
  private pendingHitStopUntil = 0;
  private hitStopActive = false;
  private playerActionState: PlayerActionState = 'normal';
  private dashHitEnemies = new Set<string>();
  private dashDamageTotal = 0;
  private dashLine?: Phaser.GameObjects.Line;
  private currentRoomBounds = new Phaser.Geom.Rectangle(128, 128, 704, 384);

  private currentRoomIndex = 0;
  private currentRoom = ROOMS[0];
  private roomCleared = false;
  private rewardTaken = false;
  private runEnded = false;
  private shieldUntil = 0;
  private invincibleUntil = 0;
  private skillCooldowns = { attack: 0, dashSlash: 0, shield: 0 };
  private startedAt = Date.now();
  private kills = 0;
  private gold = 0;
  private damageTaken = 0;
  private skillUses = 0;
  private reachedBossPhaseTwo = false;
  private itemsObtained: string[] = [];
  private lastFacing = new Phaser.Math.Vector2(1, 0);
  private playerDirection: HunterDirection = 'down';
  private playerWalkFrame: HunterFrame = 'idle';
  private nextWalkFrameAt = 0;

  constructor(level: LevelConfig, playerClass: PlayerClassConfig, onRunEnd: (runId: string) => void) {
    super('DungeonScene');
    this.level = level;
    this.playerClass = playerClass;
    this.onRunEnd = onRunEnd;
  }

  preload() {
    DUNGEON_ASSETS.forEach((name) => {
      this.load.image(`dungeon-${name}-png`, `/assets/generated/dungeon/${name}.png`);
      this.load.image(`dungeon-${name}-svg`, `/assets/generated/dungeon/${name}.svg`);
    });
    HUNTER_DIRECTIONS.forEach((direction) => {
      this.load.image(`hunter-${direction}-png`, `/assets/generated/characters/hunter/hunter_${direction}.png`);
      this.load.image(`hunter-${direction}-svg`, `/assets/generated/characters/hunter/hunter_${direction}.svg`);
      HUNTER_FRAMES.forEach((frame) => {
        this.load.image(`hunter-${direction}-${frame}-png`, `/assets/generated/characters/hunter/hunter_${direction}_${frame}.png`);
        this.load.image(`hunter-${direction}-${frame}-svg`, `/assets/generated/characters/hunter/hunter_${direction}_${frame}.svg`);
      });
    });
    SLIME_FRAMES.forEach((frame) => {
      this.load.image(`slime-${frame}-png`, `/assets/generated/monsters/crystal_slime/slime_${frame}.png`);
      this.load.image(`slime-${frame}-svg`, `/assets/generated/monsters/crystal_slime/slime_${frame}.svg`);
    });
    SKELETON_FRAMES.forEach((frame) => {
      this.load.image(`skeleton-${frame}-png`, `/assets/generated/monsters/skeleton_guard/skeleton_${frame}.png`);
      this.load.image(`skeleton-${frame}-svg`, `/assets/generated/monsters/skeleton_guard/skeleton_${frame}.svg`);
    });
    BAT_FRAMES.forEach((frame) => {
      this.load.image(`bat-${frame}-png`, `/assets/generated/monsters/shadow_bat/bat_${frame}.png`);
      this.load.image(`bat-${frame}-svg`, `/assets/generated/monsters/shadow_bat/bat_${frame}.svg`);
    });
    RUNE_ARCHER_FRAMES.forEach((frame) => {
      this.load.image(`rune-archer-${frame}-png`, `/assets/generated/monsters/rune_archer/rune_archer_${frame}.png`);
      this.load.image(`rune-archer-${frame}-svg`, `/assets/generated/monsters/rune_archer/rune_archer_${frame}.svg`);
    });
    this.load.image('rune-projectile-png', '/assets/generated/monsters/rune_archer/rune_projectile.png');
    this.load.image('rune-projectile-svg', '/assets/generated/monsters/rune_archer/rune_projectile.svg');
    GUARDIAN_FRAMES.forEach((frame) => {
      this.load.image(`guardian-${frame}-png`, `/assets/generated/boss/crystal_guardian/guardian_${frame}.png`);
      this.load.image(`guardian-${frame}-svg`, `/assets/generated/boss/crystal_guardian/guardian_${frame}.svg`);
    });
    this.load.image('guardian-crystal-projectile-png', '/assets/generated/boss/crystal_guardian/crystal_projectile.png');
    this.load.image('guardian-crystal-projectile-svg', '/assets/generated/boss/crystal_guardian/crystal_projectile.svg');
    this.load.image('guardian-crystal-spike-png', '/assets/generated/boss/crystal_guardian/crystal_spike.png');
    this.load.image('guardian-crystal-spike-svg', '/assets/generated/boss/crystal_guardian/crystal_spike.svg');
  }

  create() {
    this.resetRunState();
    this.createTextures();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,J,K,L,E,ESC,R') as Record<string, Phaser.Input.Keyboard.Key>;
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.walls = this.physics.add.staticGroup();
    this.items = this.physics.add.staticGroup();
    this.createPlayer();

    this.physics.world.setBounds(0, 0, 960, 600);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.overlap(this.player, this.items, (_player, item) => this.pickItem(item as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.handleProjectileHitEnemy(bullet as Phaser.Physics.Arcade.Sprite, enemy as Fighter));

    this.hudPanel = this.add.container(18, 16).setDepth(80);
    this.hudPanel.add(this.add.rectangle(0, 0, 265, 104, 0x07101e, 0.72).setOrigin(0).setStrokeStyle(1, 0x2d5f78, 0.8));
    this.hudPanel.add(this.add.text(14, 10, '遗迹猎人', { fontFamily: 'monospace', fontSize: '15px', color: '#eaffff' }));
    this.hpBarBg = this.add.rectangle(14, 37, 176, 13, 0x27101b).setOrigin(0);
    this.hpBarFill = this.add.rectangle(14, 37, 176, 13, 0x35e7c4).setOrigin(0);
    this.hudPanel.add([this.hpBarBg, this.hpBarFill]);
    this.statusText = this.add.text(14, 58, '', { fontFamily: 'monospace', fontSize: '14px', color: '#dff7ff', lineSpacing: 5 });
    this.hudPanel.add(this.statusText);
    this.skillText = this.add.text(18, 458, '', { fontFamily: 'monospace', fontSize: '15px', color: '#aefcff', lineSpacing: 7 }).setDepth(80);
    this.roomText = this.add.text(690, 14, '', { fontFamily: 'monospace', fontSize: '15px', color: '#8fffe6', align: 'right', wordWrap: { width: 250 } }).setDepth(80);
    this.logText = this.add.text(18, 552, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffe6ad', wordWrap: { width: 900 } }).setDepth(80);
    this.setGameplayUiVisible(false);
    this.player.setVisible(false);
    this.showTitleScreen();
  }

  private setGameplayUiVisible(visible: boolean) {
    this.hudPanel?.setVisible(visible);
    this.skillText?.setVisible(visible);
    this.roomText?.setVisible(visible);
    this.logText?.setVisible(visible);
  }

  private showTitleScreen() {
    this.flowState = 'title';
    this.gameReady = false;
    this.physics.world.pause();
    this.setGameplayUiVisible(false);
    this.destroyBossBar();
    this.roomTitleToast?.destroy();
    this.pausePanel?.destroy();
    this.setWorldVisible(false);
    this.titlePanel?.destroy();
    this.titlePanel = this.add.container(480, 300).setDepth(220);
    this.titlePanel.add(this.add.rectangle(0, 0, 690, 430, 0x07101e, 0.96).setStrokeStyle(2, 0x35e7c4, 0.95));
    this.titlePanel.add(this.add.text(0, -145, '灵墟地牢', { fontFamily: 'monospace', fontSize: '46px', color: '#ffffff', stroke: '#0bd8c7', strokeThickness: 2 }).setOrigin(0.5));
    this.titlePanel.add(this.add.text(0, -88, '进入被污染的地下遗迹，击败晶核守卫，净化源晶核心。', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#dff7ff'
    }).setOrigin(0.5));
    const startButton = this.createMenuButton(0, 0, 210, '开始游戏', () => {
      void this.sfx.init();
      this.startGame();
    });
    const helpButton = this.createMenuButton(0, 66, 210, '操作说明', () => this.showControlHelp());
    this.titlePanel.add(startButton);
    this.titlePanel.add(helpButton);
    this.titlePanel.add(this.add.text(0, 145, 'WASD 移动  J 攻击  K 冲刺斩  L 护盾  E 互动  Esc 暂停', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#8fffe6'
    }).setOrigin(0.5));
  }

  private showControlHelp() {
    if (!this.titlePanel) return;
    const help = this.add.container(0, 34).setDepth(221);
    help.add(this.add.rectangle(0, 0, 390, 170, 0x0b1628, 0.96).setStrokeStyle(1, 0x8ffcff));
    help.add(this.add.text(-160, -64, [
      'WASD / 方向键移动',
      'J 普通攻击',
      'K 冲刺斩',
      'L 护盾',
      'E 互动',
      'Esc 暂停'
    ], { fontFamily: 'monospace', fontSize: '17px', color: '#eaffff', lineSpacing: 7 }));
    this.titlePanel.add(help);
    this.time.delayedCall(2600, () => help.destroy());
  }

  private createMenuButton(x: number, y: number, width: number, label: string, onClick: () => void) {
    const button = this.add.container(x, y);
    const rect = this.add.rectangle(0, 0, width, 44, 0x12314c, 0.94).setStrokeStyle(2, 0x35e7c4).setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x1d4d70, 0.98));
    rect.on('pointerout', () => rect.setFillStyle(0x12314c, 0.94));
    rect.on('pointerdown', onClick);
    button.add([rect, text]);
    return button;
  }

  private startGame() {
    this.titlePanel?.destroy();
    this.titlePanel = undefined;
    this.resetRunState();
    this.flowState = 'playing';
    this.gameReady = true;
    this.time.paused = false;
    this.physics.world.resume();
    this.setGameplayUiVisible(true);
    this.player.stats = {
      id: 'player',
      name: '遗迹猎人',
      kind: 'player',
      hp: 120,
      maxHp: 120,
      atk: 14,
      def: 4,
      speed: 175,
      range: 54,
      cooldown: 330,
      nextAttack: 0
    };
    this.player.setTexture(this.hunterAssetKey('down')).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setVisible(true).setActive(true).enableBody(true, 480, 330, true, true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.unitHuds.forEach((hud) => {
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
    });
    this.unitHuds.clear();
    this.createUnitHud(this.player);
    this.loadRoom(0);
    this.log('进入灵墟。按 E 进入下一房间，战斗房必须清空后才能继续。');
    this.updateUi(this.time.now);
  }

  private pauseGame() {
    if (this.flowState !== 'playing' || this.runEnded) return;
    this.flowState = 'paused';
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.pausePanel?.destroy();
    this.pausePanel = this.add.container(480, 300).setDepth(210);
    this.pausePanel.add(this.add.rectangle(0, 0, 430, 315, 0x07101e, 0.97).setStrokeStyle(2, 0x8ffcff));
    this.pausePanel.add(this.add.text(0, -112, '游戏暂停', { fontFamily: 'monospace', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5));
    this.pausePanel.add(this.createMenuButton(0, -42, 180, '继续游戏', () => this.resumeGame()));
    this.pausePanel.add(this.createMenuButton(0, 22, 180, '重新开始', () => this.restartRun()));
    this.pausePanel.add(this.createMenuButton(0, 86, 180, '返回标题', () => this.returnToTitle()));
  }

  private resumeGame() {
    if (this.flowState !== 'paused') return;
    this.flowState = 'playing';
    this.pausePanel?.destroy();
    this.pausePanel = undefined;
    this.time.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private restartRun() {
    this.pausePanel?.destroy();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.setWorldVisible(true);
    this.startGame();
  }

  private returnToTitle() {
    this.pausePanel?.destroy();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.setWorldVisible(false);
    this.showTitleScreen();
  }

  private setWorldVisible(visible: boolean) {
    this.player?.setVisible(visible);
    this.enemies?.setVisible(visible);
    this.bullets?.setVisible(visible);
    this.walls?.setVisible(visible);
    this.items?.setVisible(visible);
    this.children.list
      .filter((child) => child.getData?.('roomObj'))
      .forEach((child) => (child as Phaser.GameObjects.GameObject & { setVisible?: (value: boolean) => void }).setVisible?.(visible));
    this.unitHuds.forEach((hud) => {
      hud.name.setVisible(visible);
      hud.hpBg.setVisible(visible);
      hud.hpFill.setVisible(visible);
    });
  }

  update(time: number) {
    if (this.flowState === 'title') return;
    if (this.flowState === 'ended' || this.runEnded) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.flowState === 'paused') this.resumeGame();
      else this.pauseGame();
      return;
    }
    if (this.flowState === 'paused') return;
    if (this.hitStopActive) {
      if (time >= this.pendingHitStopUntil) this.endHitStop();
      else return;
    }

    if (this.playerActionState === 'dashing') {
      this.updateDashHits();
    } else {
      this.movePlayer(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.J)) this.normalAttack(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.K)) this.dashSlash(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.L)) this.activateShield(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();

    this.updateEnemies(time);
    this.updateBossHazards(time);
    if (!this.roomCleared && this.countLivingEnemies() === 0) {
      this.roomCleared = true;
      this.updateDoor();
      this.sfx.play('portal');
      this.log(`${this.currentRoom.name} 已清理。右侧传送门已开启，按 E 进入下一房间。`);
    }
    this.updateInvincibleVisual(time);
    this.updateUi(time);
    this.updateUnitHuds();
    this.handleEnemyProjectileHits();
    this.cleanupProjectiles();
  }

  private assetKey(name: DungeonAssetName) {
    const png = `dungeon-${name}-png`;
    const svg = `dungeon-${name}-svg`;
    const fallback = `dungeon-${name}-fallback`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    return fallback;
  }

  private hunterAssetKey(direction: HunterDirection, frame: HunterFrame = 'idle'): string {
    const suffix = frame === 'idle' ? '' : `-${frame}`;
    const png = `hunter-${direction}${suffix}-png`;
    const svg = `hunter-${direction}${suffix}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle') return this.hunterAssetKey(direction, 'idle');
    return 'hunter';
  }

  private hasGeneratedHunter(direction: HunterDirection, frame: HunterFrame = 'idle') {
    const suffix = frame === 'idle' ? '' : `-${frame}`;
    return this.textures.exists(`hunter-${direction}${suffix}-png`) || this.textures.exists(`hunter-${direction}${suffix}-svg`);
  }

  private slimeAssetKey(frame: SlimeFrame = 'idle_1'): string {
    const png = `slime-${frame}-png`;
    const svg = `slime-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.slimeAssetKey('idle_1');
    return 'slime';
  }

  private hasGeneratedSlime(frame: SlimeFrame = 'idle_1') {
    return this.textures.exists(`slime-${frame}-png`) || this.textures.exists(`slime-${frame}-svg`);
  }

  private skeletonAssetKey(frame: SkeletonFrame = 'idle_1'): string {
    const png = `skeleton-${frame}-png`;
    const svg = `skeleton-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.skeletonAssetKey('idle_1');
    return 'skeleton';
  }

  private hasGeneratedSkeleton(frame: SkeletonFrame = 'idle_1') {
    return this.textures.exists(`skeleton-${frame}-png`) || this.textures.exists(`skeleton-${frame}-svg`);
  }

  private batAssetKey(frame: BatFrame = 'idle_1'): string {
    const png = `bat-${frame}-png`;
    const svg = `bat-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.batAssetKey('idle_1');
    return 'bat';
  }

  private hasGeneratedBat(frame: BatFrame = 'idle_1') {
    return this.textures.exists(`bat-${frame}-png`) || this.textures.exists(`bat-${frame}-svg`);
  }

  private runeArcherAssetKey(frame: RuneArcherFrame = 'idle_1'): string {
    const png = `rune-archer-${frame}-png`;
    const svg = `rune-archer-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.runeArcherAssetKey('idle_1');
    return 'archer';
  }

  private hasGeneratedRuneArcher(frame: RuneArcherFrame = 'idle_1') {
    return this.textures.exists(`rune-archer-${frame}-png`) || this.textures.exists(`rune-archer-${frame}-svg`);
  }

  private runeProjectileKey() {
    if (this.textures.exists('rune-projectile-png')) return 'rune-projectile-png';
    if (this.textures.exists('rune-projectile-svg')) return 'rune-projectile-svg';
    return 'bullet';
  }

  private guardianAssetKey(frame: GuardianFrame = 'idle_1'): string {
    const png = `guardian-${frame}-png`;
    const svg = `guardian-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.guardianAssetKey('idle_1');
    return 'boss';
  }

  private hasGeneratedGuardian(frame: GuardianFrame = 'idle_1') {
    return this.textures.exists(`guardian-${frame}-png`) || this.textures.exists(`guardian-${frame}-svg`);
  }

  private guardianProjectileKey() {
    if (this.textures.exists('guardian-crystal-projectile-png')) return 'guardian-crystal-projectile-png';
    if (this.textures.exists('guardian-crystal-projectile-svg')) return 'guardian-crystal-projectile-svg';
    return 'bullet';
  }

  private guardianSpikeKey() {
    if (this.textures.exists('guardian-crystal-spike-png')) return 'guardian-crystal-spike-png';
    if (this.textures.exists('guardian-crystal-spike-svg')) return 'guardian-crystal-spike-svg';
    return 'spike';
  }

  private resetRunState() {
    this.unitHuds.forEach((hud) => {
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
    });
    this.unitHuds.clear();
    this.currentRoomIndex = 0;
    this.currentRoom = ROOMS[0];
    this.roomCleared = false;
    this.rewardTaken = false;
    this.runEnded = false;
    this.shieldUntil = 0;
    this.invincibleUntil = 0;
    this.skillCooldowns = { attack: 0, dashSlash: 0, shield: 0 };
    this.startedAt = Date.now();
    this.kills = 0;
    this.gold = 0;
    this.damageTaken = 0;
    this.skillUses = 0;
    this.reachedBossPhaseTwo = false;
    this.itemsObtained = [];
    this.lastFacing = new Phaser.Math.Vector2(1, 0);
    this.playerDirection = 'down';
    this.playerWalkFrame = 'idle';
    this.nextWalkFrameAt = 0;
    this.playerActionState = 'normal';
    this.dashHitEnemies.clear();
    this.dashDamageTotal = 0;
    this.dashLine = undefined;
    this.doorSprite = undefined;
    this.shieldRing = undefined;
    this.bossBarBg = undefined;
    this.bossBarFill = undefined;
    this.bossBarText = undefined;
  }

  private createTextures() {
    this.createHunterTexture();
    this.createEnemyTexture('slime', 0x56d7b4, 0xbffff1, 'slime');
    this.createEnemyTexture('skeleton', 0xdedede, 0x7b8496, 'skeleton');
    this.createEnemyTexture('bat', 0x32224f, 0xb18cff, 'bat');
    this.createEnemyTexture('archer', 0x4356d8, 0xb8c5ff, 'archer');
    this.createEnemyTexture('boss', 0xff4f9b, 0x9ffff0, 'boss');
    this.createTileFallbacks();
    this.createTileTexture('bullet', 0x8ffcff, 0xffffff, 18);
    this.createTileTexture('spike', 0xff4f5f, 0xffd1d7, 4);
  }

  private createHunterTexture() {
    if (this.textures.exists('hunter')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x102033).fillCircle(24, 24, 22);
    g.lineStyle(3, 0x8ffcff).strokeCircle(24, 24, 20);
    g.fillStyle(0x35e7c4).fillTriangle(24, 6, 9, 37, 39, 37);
    g.fillStyle(0xffffff).fillRect(22, 13, 4, 23);
    g.fillStyle(0xffe6ad).fillCircle(24, 21, 5);
    g.generateTexture('hunter', 48, 48);
    g.destroy();
  }

  private createEnemyTexture(key: string, fill: number, stroke: number, icon: EnemyKind) {
    if (this.textures.exists(key)) return;
    const size = icon === 'boss' ? 72 : 44;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fill).fillRoundedRect(0, 0, size, size, icon === 'slime' ? 18 : 8);
    g.lineStyle(3, stroke).strokeRoundedRect(3, 3, size - 6, size - 6, icon === 'slime' ? 16 : 8);
    g.fillStyle(0xffffff, 0.92);
    if (icon === 'slime') g.fillCircle(size / 2, size / 2, 9);
    if (icon === 'skeleton') {
      g.fillCircle(size / 2, 16, 9);
      g.fillRect(size / 2 - 3, 24, 6, 14);
    }
    if (icon === 'bat') {
      g.fillTriangle(8, 22, 20, 12, 20, 32);
      g.fillTriangle(size - 8, 22, size - 20, 12, size - 20, 32);
      g.fillCircle(size / 2, 22, 7);
    }
    if (icon === 'archer') {
      g.lineStyle(4, 0xffffff).strokeCircle(size / 2, size / 2, 12);
      g.fillTriangle(size / 2 + 14, size / 2, size / 2 + 4, size / 2 - 6, size / 2 + 4, size / 2 + 6);
    }
    if (icon === 'boss') {
      g.fillStyle(0xffffff).fillTriangle(36, 7, 13, 56, 59, 56);
      g.lineStyle(5, 0x8ffcff).strokeCircle(36, 36, 18);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createTileFallbacks() {
    this.createTileTexture('dungeon-floor-fallback', 0x121f33, 0x21354f, 0);
    this.createTileTexture('dungeon-wall-fallback', 0x303c59, 0x5a6f98, 8);
    this.createTileTexture('dungeon-door_closed-fallback', 0x25364f, 0x60799f, 6);
    this.createTileTexture('dungeon-door_open-fallback', 0x28f1d0, 0xcffff7, 12);
    this.createTileTexture('dungeon-crystal_01-fallback', 0x36f0df, 0xcaffff, 4);
    this.createTileTexture('dungeon-crystal_02-fallback', 0x4aa8ff, 0xd8ffff, 4);
    this.createTileTexture('dungeon-chest_closed-fallback', 0xffb84d, 0xffffff, 4);
    this.createTileTexture('dungeon-chest_open-fallback', 0xffd47d, 0x8ffcff, 4);
    this.createTileTexture('dungeon-potion_hp-fallback', 0xff4f7b, 0xffffff, 12);
    this.createTileTexture('dungeon-attack_crystal-fallback', 0xff6538, 0xffe0b2, 4);
    this.createTileTexture('dungeon-defense_charm-fallback', 0x2b8cff, 0xd9ffff, 8);
  }

  private createTileTexture(key: string, fill: number, stroke: number, radius = 6) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fill).fillRoundedRect(0, 0, 36, 36, radius);
    g.lineStyle(3, stroke).strokeRoundedRect(2, 2, 32, 32, radius);
    g.generateTexture(key, 36, 36);
    g.destroy();
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(480, 330, this.hunterAssetKey('down')) as Fighter;
    this.player.setDepth(30).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.player.stats = {
      id: 'player',
      name: '遗迹猎人',
      kind: 'player',
      hp: 120,
      maxHp: 120,
      atk: 14,
      def: 4,
      speed: 175,
      range: 54,
      cooldown: 330,
      nextAttack: 0
    };
    this.createUnitHud(this.player);
  }

  private loadRoom(index: number) {
    this.currentRoomIndex = index;
    this.currentRoom = ROOMS[index];
    this.roomCleared = this.currentRoom.enemies.length === 0;
    this.rewardTaken = !this.currentRoom.reward;
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.walls.clear(true, true);
    this.items.clear(true, true);
    this.clearEnemyHuds();
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.roomTitleToast?.destroy();
    this.roomTitleToast = undefined;
    this.children.list.filter((child) => child.getData?.('roomObj')).forEach((child) => child.destroy());
    this.drawRoom();
    this.spawnEnemies();
    this.player.setPosition(170, 320);
    this.showRoomTitle();
    this.updateDoor();
    if (this.currentRoom.kind === 'boss') this.sfx.play('bossEnter');
    this.log(this.currentRoom.kind === 'spawn' ? '出生房安全。按 E 进入普通战斗房。' : `${this.currentRoom.name}：${this.currentRoom.description}`);
  }

  private drawRoom() {
    const bossRoom = this.currentRoom.kind === 'boss';
    const roomColor = bossRoom ? 0x12091d : 0x101a2b;
    const borderColor = bossRoom ? 0xff4f9b : 0x2b4665;
    this.add.rectangle(480, 320, bossRoom ? 780 : 720, bossRoom ? 450 : 410, roomColor).setStrokeStyle(3, borderColor).setData('roomObj', true).setDepth(0);
    const cols = bossRoom ? 20 : 18;
    const rows = bossRoom ? 11 : 10;
    const startX = 480 - (cols * 32) / 2 + 16;
    const startY = 320 - (rows * 32) / 2 + 16;
    for (let x = 0; x < cols; x += 1) {
      for (let y = 0; y < rows; y += 1) {
        this.add.image(startX + x * 32, startY + y * 32, this.assetKey('floor')).setDisplaySize(32, 32).setData('roomObj', true).setDepth(1);
      }
    }
    const left = bossRoom ? 80 : 128;
    const right = bossRoom ? 880 : 832;
    const top = bossRoom ? 80 : 128;
    const bottom = bossRoom ? 560 : 512;
    this.currentRoomBounds = new Phaser.Geom.Rectangle(left + 34, top + 34, right - left - 68, bottom - top - 68);
    const wallKey = this.assetKey('wall');
    for (let x = left; x <= right; x += 32) {
      this.walls.add(this.physics.add.staticSprite(x, top, wallKey).setDisplaySize(34, 34).setDepth(4));
      this.walls.add(this.physics.add.staticSprite(x, bottom, wallKey).setDisplaySize(34, 34).setDepth(4));
    }
    for (let y = top; y <= bottom; y += 32) {
      this.walls.add(this.physics.add.staticSprite(left, y, wallKey).setDisplaySize(34, 34).setDepth(4));
      this.walls.add(this.physics.add.staticSprite(right, y, wallKey).setDisplaySize(34, 34).setDepth(4));
    }
    this.addCrystalDecorations(bossRoom);
    this.doorSprite = this.add.image(right, 320, this.assetKey('door_closed')).setDisplaySize(46, 98).setData('roomObj', true).setDepth(6);
    if (this.currentRoom.reward === 'chest') this.items.add(this.physics.add.staticSprite(480, 320, this.assetKey('chest_closed')).setDisplaySize(52, 52).setDepth(20).setData('item', 'chest'));
    if (this.currentRoom.reward === 'potion') this.items.add(this.physics.add.staticSprite(480, 320, this.assetKey('potion_hp')).setDisplaySize(44, 44).setDepth(20).setData('item', 'potion'));
    if (bossRoom) this.createBossBar();
    else this.destroyBossBar();
  }

  private addCrystalDecorations(bossRoom: boolean) {
    const points = bossRoom ? [[210, 170], [750, 180], [235, 470], [710, 450], [480, 150]] : [[245, 190], [690, 210], [300, 455], [710, 430]];
    points.forEach(([x, y], index) => {
      const crystal = this.add.image(x, y, this.assetKey(index % 2 ? 'crystal_02' : 'crystal_01')).setDisplaySize(38, 44).setData('roomObj', true).setDepth(3);
      this.tweens.add({ targets: crystal, alpha: 0.42, yoyo: true, repeat: -1, duration: 900 + index * 110 });
    });
  }

  private spawnEnemies() {
    const spots = [
      [430, 260],
      [560, 360],
      [600, 250],
      [430, 390]
    ];
    this.currentRoom.enemies.forEach((kind, index) => {
      const base = ENEMIES[kind];
      const [x, y] = kind === 'boss' ? [590, 320] : spots[index] ?? [520, 310];
      const texture = kind === 'slime' ? this.slimeAssetKey('idle_1') : kind === 'skeleton' ? this.skeletonAssetKey('idle_1') : kind === 'bat' ? this.batAssetKey('idle_1') : kind === 'archer' ? this.runeArcherAssetKey('idle_1') : kind === 'boss' ? this.guardianAssetKey('idle_1') : kind;
      const enemy = this.physics.add.sprite(x, y, texture) as Fighter;
      enemy.setDepth(kind === 'boss' ? 25 : 24).setDisplaySize(kind === 'boss' ? 112 : kind === 'skeleton' ? 42 : kind === 'bat' ? 42 : kind === 'archer' ? 42 : 38, kind === 'boss' ? 126 : kind === 'skeleton' ? 50 : kind === 'bat' ? 34 : kind === 'archer' ? 48 : 38).setCollideWorldBounds(true);
      if (kind === 'boss') (enemy.body as Phaser.Physics.Arcade.Body).setSize(70, 70, true);
      if (kind === 'slime') enemy.setData('animFrame', 0).setData('nextAnimAt', 0);
      if (kind === 'skeleton') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('attackingVisual', false);
      if (kind === 'bat') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('attackingVisual', false).setData('floatPhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
      if (kind === 'archer') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('castingVisual', false);
      if (kind === 'boss') {
        enemy
          .setData('animFrame', 0)
          .setData('nextAnimAt', 0)
          .setData('phase2Visual', false)
          .setData('actionVisual', false)
          .setData('closeSince', 0)
          .setData('nextShock', this.time.now + 2500)
          .setData('shockCharging', false)
          .setData('nextSpike', this.time.now + 2200);
      }
      const eliteBoosted = this.currentRoom.kind === 'elite' && kind !== 'boss';
      const hp = eliteBoosted ? Math.ceil(base.hp * 1.1) : base.hp;
      const maxHp = eliteBoosted ? Math.ceil(base.maxHp * 1.1) : base.maxHp;
      const atk = eliteBoosted ? Math.ceil(base.atk * 1.15) : base.atk;
      const cooldown = eliteBoosted ? Math.round(base.cooldown / 1.1) : base.cooldown;
      enemy.stats = { ...base, hp, maxHp, atk, cooldown, id: `${kind}-${index}-${this.currentRoom.id}`, nextAttack: 0 };
      this.enemies.add(enemy);
      this.createUnitHud(enemy);
    });
  }

  private movePlayer(time: number) {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;
    const direction = new Phaser.Math.Vector2(vx, vy);
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.lastFacing.copy(direction);
      this.updatePlayerDirection(direction, time, true);
    } else {
      this.playerWalkFrame = 'idle';
      const idleKey = this.hunterAssetKey(this.playerDirection, 'idle');
      if (this.player.texture.key !== idleKey) {
        this.player.setTexture(idleKey).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE);
        (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
        if (this.hasGeneratedHunter(this.playerDirection, 'idle')) this.player.setRotation(0);
      }
    }
    this.player.setVelocity(direction.x * this.player.stats.speed, direction.y * this.player.stats.speed);
  }

  private updatePlayerDirection(direction: Phaser.Math.Vector2, time: number, moving: boolean) {
    const nextDirection: HunterDirection = Math.abs(direction.x) > Math.abs(direction.y)
      ? direction.x < 0 ? 'left' : 'right'
      : direction.y < 0 ? 'up' : 'down';
    let frame: HunterFrame = 'idle';
    if (moving) {
      if (time >= this.nextWalkFrameAt) {
        this.playerWalkFrame = this.playerWalkFrame === '1' ? '2' : '1';
        this.nextWalkFrameAt = time + 160;
      }
      frame = this.playerWalkFrame === 'idle' ? '1' : this.playerWalkFrame;
    } else {
      this.playerWalkFrame = 'idle';
    }
    const textureKey = this.hunterAssetKey(nextDirection, frame);
    if (nextDirection === this.playerDirection && this.player.texture.key === textureKey) return;
    this.playerDirection = nextDirection;
    this.player.setTexture(textureKey).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.player.setRotation(this.hasGeneratedHunter(nextDirection, frame) ? 0 : Phaser.Math.Angle.Between(0, 0, direction.x, direction.y) + Math.PI / 2);
  }

  private normalAttack(time: number) {
    if (this.playerActionState !== 'normal') return;
    if (time < this.skillCooldowns.attack) return;
    this.playerActionState = 'attacking';
    this.skillCooldowns.attack = time + 330;
    this.sfx.play('swing');
    this.showAttackArc(64, 0xffffff, 0.26);
    this.hitInArc(this.player.stats.atk, 62, '普通攻击', 60, 32, 220);
    this.time.delayedCall(150, () => {
      if (this.playerActionState === 'attacking') this.playerActionState = 'normal';
    });
  }

  private dashSlash(time: number) {
    if (this.playerActionState !== 'normal') return;
    if (time < this.skillCooldowns.dashSlash) {
      this.log('冲刺斩还在冷却。');
      return;
    }
    this.skillCooldowns.dashSlash = time + 5000;
    this.skillUses += 1;
    this.sfx.play('swing');
    this.playerActionState = 'dashing';
    this.dashHitEnemies.clear();
    this.dashDamageTotal = 0;
    this.dashDamageTotal = 0;
    const startX = this.player.x;
    const startY = this.player.y;
    const target = this.getLegalPoint(startX + this.lastFacing.x * 140, startY + this.lastFacing.y * 140, 18);
    this.player.setVelocity(0, 0);
    this.showDashSlashTrail(startX, startY, target.x, target.y);
    for (let i = 0; i < 4; i += 1) this.time.delayedCall(i * 45, () => this.spawnDashTrail());
    this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: 200,
      ease: 'Quad.easeOut',
      onUpdate: () => this.updateDashHits(),
      onComplete: () => this.finishDash()
    });
  }

  private activateShield(time: number) {
    if (this.playerActionState === 'dashing' || this.playerActionState === 'attacking') return;
    if (time < this.skillCooldowns.shield) {
      this.log('护盾还在冷却。');
      return;
    }
    this.playerActionState = 'shielding';
    this.skillCooldowns.shield = time + 8000;
    this.shieldUntil = time + 3000;
    this.skillUses += 1;
    this.shieldRing?.destroy();
    this.shieldRing = this.add.circle(this.player.x, this.player.y, 38, 0x6dfcff, 0.12).setStrokeStyle(3, 0x8ffcff, 0.95).setDepth(29);
    this.tweens.add({ targets: this.shieldRing, scale: 1.18, alpha: 0.58, yoyo: true, repeat: -1, duration: 420 });
    this.player.setTint(0x9ffff0);
    this.time.delayedCall(3000, () => {
      if (this.player.active && this.time.now >= this.invincibleUntil) this.player.clearTint();
      this.shieldRing?.destroy();
      this.shieldRing = undefined;
      if (this.playerActionState === 'shielding') this.playerActionState = 'normal';
    });
    this.log('护盾启动：3 秒内受到伤害减少 50%。');
  }

  private showAttackArc(range: number, color: number, alpha: number) {
    const center = new Phaser.Math.Vector2(this.player.x, this.player.y).add(this.lastFacing.clone().scale(range * 0.36));
    const arc = this.add.arc(center.x, center.y, range * 0.42, -42, 42, false, color, alpha).setStrokeStyle(4, color, 0.9).setDepth(28);
    arc.setRotation(Phaser.Math.Angle.Between(0, 0, this.lastFacing.x, this.lastFacing.y));
    this.tweens.add({ targets: arc, alpha: 0, scale: 1.18, duration: 190, onComplete: () => arc.destroy() });
  }

  private spawnDashTrail() {
    if (!this.player.active) return;
    const trail = this.add.sprite(this.player.x, this.player.y, this.player.texture.key).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setDepth(18).setAlpha(0.46).setTint(0x67d8ff).setRotation(this.player.rotation);
    this.tweens.add({ targets: trail, alpha: 0, scale: 0.72, duration: 260, onComplete: () => trail.destroy() });
  }

  private hitInArc(rawDamage: number, range: number, source: string, hitStopMs: number, knockbackDistance = 0, stunMs = 0) {
    const center = new Phaser.Math.Vector2(this.player.x, this.player.y).add(this.lastFacing.clone().scale(range * 0.58));
    let hit = false;
    const knockedNames: string[] = [];
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active) return;
      if (Phaser.Math.Distance.Between(center.x, center.y, enemy.x, enemy.y) <= range) {
        this.damageEnemy(enemy, rawDamage);
        if (!enemy.stats.boss && knockbackDistance > 0) {
          this.knockbackEnemy(enemy, this.player.x, this.player.y, knockbackDistance, stunMs);
          knockedNames.push(enemy.stats.name);
        }
        hit = true;
      }
    });
    if (hit) {
      this.sfx.play('hit');
      this.startHitStop(hitStopMs);
    }
    if (knockedNames.length === 1) this.log(`${source}命中，击退了${knockedNames[0]}。`);
    else if (knockedNames.length > 1) this.log(`${source}命中，击退了 ${knockedNames.length} 个敌人。`);
    else this.log(hit ? `${source}命中敌人。` : `${source}挥空。`);
  }

  private startHitStop(durationMs: number) {
    if (this.hitStopActive || this.flowState !== 'playing') return;
    this.hitStopActive = true;
    this.pendingHitStopUntil = this.time.now + durationMs;
    this.physics.world.pause();
    this.tweens.pauseAll();
  }

  private endHitStop() {
    this.hitStopActive = false;
    if (this.flowState !== 'playing') return;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private getLegalPoint(x: number, y: number, padding = 18) {
    return {
      x: Phaser.Math.Clamp(x, this.currentRoomBounds.left + padding, this.currentRoomBounds.right - padding),
      y: Phaser.Math.Clamp(y, this.currentRoomBounds.top + padding, this.currentRoomBounds.bottom - padding)
    };
  }

  private knockbackEnemy(enemy: Fighter, sourceX: number, sourceY: number, distance: number, stunMs: number) {
    if (!enemy.active || enemy.stats.boss || enemy.getData('dying')) return;
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    const target = this.getLegalPoint(enemy.x + Math.cos(angle) * distance, enemy.y + Math.sin(angle) * distance, 22);
    enemy.setData('stunUntil', this.time.now + stunMs);
    enemy.setVelocity(0, 0);
    this.tweens.add({
      targets: enemy,
      x: target.x,
      y: target.y,
      duration: Math.min(150, stunMs),
      ease: 'Quad.easeOut'
    });
  }

  private showDashSlashTrail(startX: number, startY: number, endX: number, endY: number) {
    this.dashLine?.destroy();
    this.dashLine = this.add.line(0, 0, startX, startY, endX, endY, 0x67f4ff, 0.34).setOrigin(0).setLineWidth(8).setDepth(27);
    this.tweens.add({
      targets: this.dashLine,
      alpha: 0,
      duration: 230,
      onComplete: () => {
        this.dashLine?.destroy();
        this.dashLine = undefined;
      }
    });
  }

  private updateDashHits() {
    if (this.playerActionState !== 'dashing') return;
    let hits = 0;
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active || enemy.getData('dying') || this.dashHitEnemies.has(enemy.stats.id)) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > (enemy.stats.boss ? 72 : 44)) return;
      this.dashHitEnemies.add(enemy.stats.id);
      const rawDamage = Math.round(this.player.stats.atk * 1.5);
      this.dashDamageTotal += Math.max(1, rawDamage - enemy.stats.def);
      this.damageEnemy(enemy, rawDamage, true);
      if (!enemy.stats.boss) this.knockbackEnemy(enemy, this.player.x - this.lastFacing.x * 24, this.player.y - this.lastFacing.y * 24, 62, 320);
      else this.startHitStop(95);
      hits += 1;
    });
    if (hits === 1) this.log(`冲刺斩贯穿敌人，造成 ${this.dashDamageTotal} 点伤害。`);
    if (hits > 1) this.log(`冲刺斩命中 ${hits} 个敌人。`);
  }

  private finishDash() {
    this.player.setVelocity(0, 0);
    const legal = this.getLegalPoint(this.player.x, this.player.y, 18);
    this.player.setPosition(legal.x, legal.y);
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).active && (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (boss && Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y) < 58) {
      this.knockbackPlayerFrom(boss.x, boss.y, 38);
    }
    if (this.dashHitEnemies.size > 0) this.log(`冲刺斩命中 ${this.dashHitEnemies.size} 个敌人，共造成 ${this.dashDamageTotal} 点伤害。`);
    else this.log('冲刺斩掠过地面。');
    this.dashHitEnemies.clear();
    if (this.playerActionState === 'dashing') this.playerActionState = 'normal';
  }

  private updateEnemies(time: number) {
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active || enemy.getData('dying')) return;
      if (!enemy.stats.boss && time < Number(enemy.getData('stunUntil') ?? 0)) {
        enemy.setVelocity(0, 0);
        return;
      }
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const phaseTwo = Boolean(enemy.stats.boss && enemy.stats.hp / enemy.stats.maxHp < 0.5);
      if (phaseTwo) this.reachedBossPhaseTwo = true;
      const cooldown = enemy.stats.boss
        ? phaseTwo ? enemy.stats.cooldown / 1.35 : enemy.stats.cooldown * 0.9
        : phaseTwo ? enemy.stats.cooldown / 1.3 : enemy.stats.cooldown;
      if (enemy.stats.kind === 'slime') this.updateSlimeAnimation(enemy, time);
      if (enemy.stats.kind === 'skeleton') this.updateSkeletonAnimation(enemy, time, distance);
      if (enemy.stats.kind === 'bat') this.updateBatAnimation(enemy, time, distance);
      if (enemy.stats.kind === 'archer') this.updateRuneArcherAnimation(enemy, time);

      if (enemy.stats.boss) {
        this.updateGuardianAnimation(enemy, time, distance, phaseTwo);
        this.updateBoss(enemy, distance, time, cooldown, phaseTwo);
        return;
      }

      if (enemy.stats.ranged) {
        if (distance > enemy.stats.range) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
        else if (distance < enemy.stats.range * 0.62) this.physics.moveToObject(enemy, this.player, -enemy.stats.speed);
        else enemy.setVelocity(0, 0);
        if (time >= enemy.stats.nextAttack) {
          enemy.stats.nextAttack = time + cooldown;
          if (enemy.stats.kind === 'archer') this.showRuneArcherCast(enemy);
          this.fireEnemyProjectile(enemy, false);
        }
        return;
      }

      this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
      if (distance <= enemy.stats.range + 18 && time >= enemy.stats.nextAttack) {
        enemy.stats.nextAttack = time + cooldown;
        if (enemy.stats.kind === 'skeleton') this.showSkeletonAttack(enemy);
        if (enemy.stats.kind === 'bat') this.showBatAttack(enemy);
        this.damagePlayer(enemy.stats.atk, enemy.stats.name);
      }
    });
  }

  private updateSlimeAnimation(enemy: Fighter, time: number) {
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10;
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 180 : 360));
    const frame: SlimeFrame = moving ? frameIndex === 0 ? 'move_1' : 'move_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.slimeAssetKey(frame)).setDisplaySize(38, moving ? 40 : 38);
    if (!this.hasGeneratedSlime(frame)) enemy.setRotation(0);
  }

  private updateSkeletonAnimation(enemy: Fighter, time: number, distance: number) {
    if (enemy.getData('attackingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > enemy.stats.range + 18 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 210 : 430));
    const frame: SkeletonFrame = moving ? frameIndex === 0 ? 'walk_1' : 'walk_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.skeletonAssetKey(frame)).setDisplaySize(42, 50);
    if (!this.hasGeneratedSkeleton(frame)) enemy.setRotation(0);
  }

  private showSkeletonAttack(enemy: Fighter) {
    enemy.setData('attackingVisual', true);
    enemy.setTexture(this.skeletonAssetKey('attack')).setDisplaySize(44, 52);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const slashX = enemy.x + Math.cos(angle) * 30;
    const slashY = enemy.y + Math.sin(angle) * 30;
    const slash = this.add.arc(slashX, slashY, 22, -50, 50, false, 0xdbe7ff, 0.28).setStrokeStyle(4, 0xe9f2ff, 0.78).setDepth(27);
    slash.setRotation(angle);
    this.tweens.add({ targets: slash, alpha: 0, scale: 1.12, duration: 160, onComplete: () => slash.destroy() });
    this.time.delayedCall(180, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('attackingVisual', false);
      enemy.setTexture(this.skeletonAssetKey('idle_1')).setDisplaySize(42, 50);
    });
  }

  private updateBatAnimation(enemy: Fighter, time: number, distance: number) {
    const floatOffset = Math.sin(time / 120 + Number(enemy.getData('floatPhase') ?? 0)) * 0.045;
    enemy.setOrigin(0.5, 0.5 + floatOffset);
    if (enemy.getData('attackingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > enemy.stats.range + 18 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 115 : 280));
    const frame: BatFrame = moving ? frameIndex === 0 ? 'fly_1' : 'fly_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.batAssetKey(frame)).setDisplaySize(42, 34);
    if (!this.hasGeneratedBat(frame)) enemy.setRotation(0);
  }

  private showBatAttack(enemy: Fighter) {
    enemy.setData('attackingVisual', true);
    enemy.setTexture(this.batAssetKey('attack')).setDisplaySize(44, 36);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const x = enemy.x + Math.cos(angle) * 27;
    const y = enemy.y + Math.sin(angle) * 27;
    const claw = this.add.arc(x, y, 20, -55, 55, false, 0xb65cff, 0.32).setStrokeStyle(4, 0xd68cff, 0.78).setDepth(27);
    claw.setRotation(angle);
    const shadow = this.add.ellipse(enemy.x - Math.cos(angle) * 12, enemy.y - Math.sin(angle) * 12, 38, 18, 0x4b1d6b, 0.22).setDepth(23);
    this.tweens.add({ targets: claw, alpha: 0, scale: 1.16, duration: 140, onComplete: () => claw.destroy() });
    this.tweens.add({ targets: shadow, alpha: 0, duration: 180, onComplete: () => shadow.destroy() });
    this.time.delayedCall(150, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('attackingVisual', false);
      enemy.setTexture(this.batAssetKey('idle_1')).setDisplaySize(42, 34);
    });
  }

  private updateRuneArcherAnimation(enemy: Fighter, time: number) {
    if (enemy.getData('castingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + 430);
    const frame: RuneArcherFrame = frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.runeArcherAssetKey(frame)).setDisplaySize(42, 48);
    if (!this.hasGeneratedRuneArcher(frame)) enemy.setRotation(0);
  }

  private showRuneArcherCast(enemy: Fighter) {
    enemy.setData('castingVisual', true);
    enemy.setTexture(this.runeArcherAssetKey('cast_1')).setDisplaySize(42, 48);
    const ring = this.add.circle(enemy.x + 16, enemy.y - 4, 18, 0x615bff, 0.12).setStrokeStyle(2, 0x8ffcff, 0.78).setDepth(27);
    this.tweens.add({ targets: ring, scale: 1.38, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    this.time.delayedCall(90, () => {
      if (enemy.active && !enemy.getData('dying')) enemy.setTexture(this.runeArcherAssetKey('cast_2')).setDisplaySize(42, 48);
    });
    this.time.delayedCall(170, () => {
      if (enemy.active && !enemy.getData('dying')) enemy.setTexture(this.runeArcherAssetKey('attack')).setDisplaySize(44, 50);
    });
    this.time.delayedCall(300, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('castingVisual', false);
      enemy.setTexture(this.runeArcherAssetKey('idle_1')).setDisplaySize(42, 48);
    });
  }

  private updateGuardianAnimation(enemy: Fighter, time: number, distance: number, phaseTwo: boolean) {
    if (phaseTwo && !enemy.getData('phase2Visual')) {
      enemy.setData('phase2Visual', true);
      this.cameras.main.shake(260, 0.008);
      this.sfx.play('bossPhase');
      this.log('晶核守卫的源晶开始暴走！');
      const burst = this.add.circle(enemy.x, enemy.y, 42, 0xff4fa3, 0.16).setStrokeStyle(4, 0xffb3dc, 0.86).setDepth(27);
      this.tweens.add({ targets: burst, scale: 2.1, alpha: 0, duration: 520, onComplete: () => burst.destroy() });
    }
    if (enemy.getData('actionVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > 92 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 260 : 520));
    const frame: GuardianFrame = phaseTwo
      ? frameIndex === 0 ? 'phase2_idle_1' : 'phase2_idle_2'
      : moving ? frameIndex === 0 ? 'walk_1' : 'walk_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.guardianAssetKey(frame)).setDisplaySize(112, 126);
    (enemy.body as Phaser.Physics.Arcade.Body).setSize(70, 70, true);
    if (!this.hasGeneratedGuardian(frame)) enemy.setRotation(0);
  }

  private updateBoss(enemy: Fighter, distance: number, time: number, cooldown: number, phaseTwo: boolean) {
    this.updateBossShock(enemy, distance, time, phaseTwo);
    if (enemy.getData('shockCharging')) {
      enemy.setVelocity(0, 0);
      return;
    }
    if (distance > 92) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
    else if (distance < 72) this.physics.moveToObject(enemy, this.player, -enemy.stats.speed * 0.7);
    else enemy.setVelocity(0, 0);

    if (time < enemy.stats.nextAttack) return;
    enemy.stats.nextAttack = time + cooldown;
    if (distance <= 92) this.startBossMelee(enemy, phaseTwo);
    this.fireEnemyProjectile(enemy, phaseTwo);
  }

  private updateBossShock(enemy: Fighter, distance: number, time: number, phaseTwo: boolean) {
    if (enemy.getData('shockCharging')) return;
    const triggerDistance = phaseTwo ? 88 : 80;
    if (distance > triggerDistance) {
      enemy.setData('closeSince', 0);
      return;
    }
    const closeSince = Number(enemy.getData('closeSince') ?? 0) || time;
    enemy.setData('closeSince', closeSince);
    if (time - closeSince < (phaseTwo ? 1200 : 1500)) return;
    if (time < Number(enemy.getData('nextShock') ?? 0)) return;
    this.startBossShock(enemy, phaseTwo);
  }

  private startBossShock(enemy: Fighter, phaseTwo: boolean) {
    enemy.setData('shockCharging', true);
    enemy.setData('nextShock', this.time.now + (phaseTwo ? 4000 : 5000));
    enemy.setData('closeSince', 0);
    const radius = phaseTwo ? 108 : 96;
    const warning = this.add.circle(enemy.x, enemy.y, radius, phaseTwo ? 0xff3f98 : 0x42cfff, 0.12).setStrokeStyle(4, phaseTwo ? 0xff8ac6 : 0x9fffff, 0.9).setDepth(23);
    this.tweens.add({ targets: warning, scale: 1.1, alpha: 0.3, yoyo: true, repeat: 2, duration: 190 });
    this.log('晶核守卫正在蓄积晶核震荡，快拉开距离！');
    this.time.delayedCall(600, () => {
      warning.destroy();
      enemy.setData('shockCharging', false);
      if (!enemy.active || this.runEnded) return;
      const burst = this.add.circle(enemy.x, enemy.y, radius, phaseTwo ? 0xff4fa3 : 0x67d8ff, 0.18).setStrokeStyle(5, phaseTwo ? 0xffd2eb : 0xd8ffff, 0.86).setDepth(27);
      this.tweens.add({ targets: burst, scale: 1.35, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= radius) {
        const damage = phaseTwo ? BOSS_SKILL_DAMAGE.phase2.shock : BOSS_SKILL_DAMAGE.phase1.shock;
        const damaged = this.damagePlayer(damage, '晶核震荡', {
          minDamageRatio: 0.7,
          invincibleMs: 600,
          shakeDuration: 230,
          shakeIntensity: 0.01,
          emphasized: true
        });
        if (damaged) this.knockbackPlayerFrom(enemy.x, enemy.y, phaseTwo ? 78 : 68);
      }
    });
  }

  private startBossMelee(enemy: Fighter, phaseTwo: boolean) {
    if (enemy.getData('meleeCharging')) return;
    enemy.setData('meleeCharging', true);
    enemy.setData('actionVisual', true);
    enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_melee' : 'melee')).setDisplaySize(118, 132);
    const warning = this.add.circle(this.player.x, this.player.y, 46, 0xff4f7b, 0.16).setStrokeStyle(3, 0xff9cab).setDepth(22);
    this.time.delayedCall(520, () => {
      warning.destroy();
      enemy.setData('meleeCharging', false);
      if (!enemy.active || this.runEnded) return;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const wave = this.add.arc(enemy.x + Math.cos(angle) * 56, enemy.y + Math.sin(angle) * 56, 44, -45, 45, false, phaseTwo ? 0xff6db8 : 0x8ffcff, 0.24).setStrokeStyle(6, phaseTwo ? 0xffb3dc : 0xd8ffff, 0.74).setDepth(27);
      wave.setRotation(angle);
      this.tweens.add({ targets: wave, alpha: 0, scale: 1.22, duration: 220, onComplete: () => wave.destroy() });
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= 104) {
        const damaged = this.damagePlayer(phaseTwo ? BOSS_SKILL_DAMAGE.phase2.melee : BOSS_SKILL_DAMAGE.phase1.melee, '晶核守卫重击', {
          minDamageRatio: 0.7,
          invincibleMs: 600,
          shakeDuration: 190,
          shakeIntensity: 0.008,
          emphasized: true
        });
        if (damaged) this.knockbackPlayerFrom(enemy.x, enemy.y, 56);
      }
      this.time.delayedCall(150, () => {
        if (!enemy.active || enemy.getData('dying')) return;
        enemy.setData('actionVisual', false);
        enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_idle_1' : 'idle_1')).setDisplaySize(112, 126);
      });
    });
  }

  private fireEnemyProjectile(enemy: Fighter, spread: boolean) {
    if (!enemy.active || this.runEnded) return;
    const shots = spread ? [-12, 0, 12] : [0];
    shots.forEach((offset) => {
      const isRuneProjectile = enemy.stats.kind === 'archer';
      const isBossProjectile = Boolean(enemy.stats.boss);
      if (isBossProjectile) {
        enemy.setData('actionVisual', true);
        const phaseTwo = enemy.stats.hp / enemy.stats.maxHp < 0.5;
        enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_shoot' : 'shoot')).setDisplaySize(116, 130);
        this.time.delayedCall(220, () => {
          if (!enemy.active || enemy.getData('dying')) return;
          enemy.setData('actionVisual', false);
        });
      }
      const bullet = this.physics.add.sprite(enemy.x, enemy.y, isBossProjectile ? this.guardianProjectileKey() : isRuneProjectile ? this.runeProjectileKey() : 'bullet');
      bullet.setDepth(26).setDisplaySize(enemy.stats.boss ? 22 : 16, enemy.stats.boss ? 22 : 16);
      const phaseTwo = isBossProjectile && enemy.stats.hp / enemy.stats.maxHp < 0.5;
      bullet.setData('damage', isBossProjectile ? phaseTwo ? BOSS_SKILL_DAMAGE.phase2.projectile : BOSS_SKILL_DAMAGE.phase1.projectile : enemy.stats.atk);
      bullet.setData('owner', 'enemy');
      bullet.setData('handled', false);
      bullet.setData('runeProjectile', isRuneProjectile);
      bullet.setData('guardianProjectile', isBossProjectile);
      bullet.setData('hitReason', isBossProjectile ? '晶体弹' : '符文弹道');
      bullet.setData('bossSkill', isBossProjectile);
      this.bullets.add(bullet);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + Phaser.Math.DegToRad(offset);
      bullet.setRotation(angle);
      if (isRuneProjectile) {
        bullet.setDisplaySize(22, 22);
        this.tweens.add({ targets: bullet, angle: bullet.angle + 360, duration: 560, repeat: -1 });
      }
      if (isBossProjectile) {
        bullet.setDisplaySize(26, 26);
        this.tweens.add({ targets: bullet, angle: bullet.angle + 360, duration: 720, repeat: -1 });
      }
      this.physics.velocityFromRotation(angle, enemy.stats.boss ? 185 : 175, bullet.body!.velocity);
      this.time.delayedCall(2600, () => this.destroyProjectile(bullet));
    });
    this.log(enemy.stats.boss ? '晶核守卫释放晶体弹。' : '符文射手发射弹道。');
  }

  private handleProjectileHitEnemy(projectile: Phaser.Physics.Arcade.Sprite, enemy: Fighter) {
    if (!projectile.active || projectile.getData('owner') !== 'player' || projectile.getData('handled')) return;
    projectile.setData('handled', true);
    this.damageEnemy(enemy, Number(projectile.getData('damage')));
    this.destroyProjectile(projectile);
  }

  private handleEnemyProjectileHits() {
    if (this.runEnded || !this.player.active) return;
    this.bullets.getChildren().forEach((object) => {
      const projectile = object as Phaser.Physics.Arcade.Sprite;
      if (!projectile.active || projectile.getData('owner') !== 'enemy' || projectile.getData('handled')) return;
      if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) > 24) return;
      projectile.setData('handled', true);
      const bossSkill = Boolean(projectile.getData('bossSkill'));
      this.damagePlayer(Number(projectile.getData('damage')), String(projectile.getData('hitReason') || '符文弹道'), bossSkill
        ? { minDamageRatio: 0.7, invincibleMs: 580, shakeDuration: 155, shakeIntensity: 0.007, emphasized: true }
        : undefined);
      this.destroyProjectile(projectile);
    });
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Sprite) {
    if (!projectile.active) return;
    const x = projectile.x;
    const y = projectile.y;
    const rune = Boolean(projectile.getData('runeProjectile'));
    const guardian = Boolean(projectile.getData('guardianProjectile'));
    projectile.disableBody(true, true);
    projectile.destroy();
    if (rune) this.spawnRuneBurst(x, y);
    if (guardian) this.spawnGuardianCrystalBurst(x, y);
  }

  private spawnRuneBurst(x: number, y: number) {
    const ring = this.add.circle(x, y, 8, 0x675bff, 0.12).setStrokeStyle(2, 0x8ffcff, 0.76).setDepth(27);
    this.tweens.add({ targets: ring, scale: 2.1, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + Math.PI / 4;
      const shard = this.add.rectangle(x, y, 8, 3, i % 2 ? 0x8ffcff : 0x8c63ff, 0.82).setDepth(28).setRotation(angle);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 18,
        y: y + Math.sin(angle) * 18,
        alpha: 0,
        duration: 240,
        onComplete: () => shard.destroy()
      });
    }
  }

  private spawnGuardianCrystalBurst(x: number, y: number) {
    const ring = this.add.circle(x, y, 10, 0x4f8cff, 0.14).setStrokeStyle(3, 0xd8ffff, 0.82).setDepth(27);
    this.tweens.add({ targets: ring, scale: 2.25, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5;
      const shard = this.add.triangle(x, y, 0, 10, 6, 0, 12, 10, i % 2 ? 0xff6db8 : 0x6fdcff, 0.86).setStrokeStyle(1, 0xffffff, 0.55).setDepth(28);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 22,
        y: y + Math.sin(angle) * 22,
        alpha: 0,
        angle: i % 2 ? 90 : -90,
        duration: 280,
        onComplete: () => shard.destroy()
      });
    }
  }

  private updateBossHazards(time: number) {
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (!boss || time < (boss.getData('nextSpike') ?? 0)) return;
    const phaseTwo = boss.stats.hp / boss.stats.maxHp < 0.5;
    boss.setData('nextSpike', time + (phaseTwo ? 2100 : 3400));
    const x = Phaser.Math.Between(250, 720);
    const y = Phaser.Math.Between(210, 450);
    const warning = this.add.circle(x, y, phaseTwo ? 38 : 34, phaseTwo ? 0xff2f85 : 0x9b3cff, phaseTwo ? 0.24 : 0.18).setStrokeStyle(phaseTwo ? 4 : 3, phaseTwo ? 0xffa1df : 0xff6dff).setDepth(12);
    this.time.delayedCall(800, () => {
      warning.destroy();
      const spike = this.add.sprite(x, y, this.guardianSpikeKey()).setDepth(18).setDisplaySize(46, 46);
      if (!this.runEnded && Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 48) {
        this.damagePlayer(phaseTwo ? BOSS_SKILL_DAMAGE.phase2.spike : BOSS_SKILL_DAMAGE.phase1.spike, '晶体地刺', {
          minDamageRatio: 0.7,
          invincibleMs: 580,
          shakeDuration: 175,
          shakeIntensity: 0.008,
          emphasized: true
        });
      }
      this.tweens.add({ targets: spike, alpha: 0, scale: 1.35, duration: 360, onComplete: () => spike.destroy() });
    });
  }

  private damageEnemy(enemy: Fighter, rawDamage: number, emphasized = false) {
    if (!enemy.active || enemy.getData('dying')) return;
    const damage = Math.max(1, rawDamage - enemy.stats.def);
    enemy.stats.hp -= damage;
    this.sfx.play('hit');
    this.showDamageNumber(enemy.x, enemy.y - 28, damage, emphasized ? '#8ffcff' : '#ffffff', emphasized);
    enemy.setTint(enemy.stats.kind === 'slime' ? 0xeaffff : enemy.stats.kind === 'skeleton' ? 0xffdddd : enemy.stats.kind === 'bat' ? 0xf0d2ff : enemy.stats.kind === 'archer' ? 0xded8ff : enemy.stats.boss ? 0xf1fbff : 0xffffff);
    if (enemy.stats.kind === 'slime') enemy.setAlpha(1);
    this.time.delayedCall(95, () => {
      if (enemy.active) enemy.clearTint();
    });
    if (enemy.stats.hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Fighter) {
    if (enemy.getData('dying')) return;
    enemy.setData('dying', true);
    this.sfx.play('enemyDie');
    const wasBoss = enemy.stats.boss;
    const name = enemy.stats.name;
    this.kills += 1;
    this.gold += wasBoss ? 60 : 8;
    this.destroyUnitHud(enemy);
    enemy.disableBody(true, false);
    if (enemy.stats.kind === 'slime') this.spawnSlimeShards(enemy.x, enemy.y);
    if (enemy.stats.kind === 'skeleton') this.spawnSkeletonBones(enemy.x, enemy.y);
    if (enemy.stats.kind === 'bat') this.spawnBatSmoke(enemy.x, enemy.y);
    if (enemy.stats.kind === 'archer') this.spawnRuneShards(enemy.x, enemy.y);
    if (wasBoss) this.spawnGuardianDeath(enemy.x, enemy.y);
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: wasBoss ? 0.35 : 0.2,
      angle: wasBoss ? 0 : 90,
      duration: wasBoss ? 720 : 260,
      onComplete: () => {
        enemy.destroy();
        if (wasBoss) this.finishRun(true, '源晶净化完成');
      }
    });
    this.log(`${name} 被击败。`);
  }

  private spawnSlimeShards(x: number, y: number) {
    const points = [
      [-14, -10],
      [12, -8],
      [-10, 12],
      [14, 10],
      [0, -16],
      [2, 16]
    ];
    points.forEach(([dx, dy], index) => {
      const shard = this.add.triangle(x, y, 0, 12, 7, 0, 14, 12, index % 2 ? 0x7fffee : 0x37e8d4, 0.86).setStrokeStyle(1, 0xd7ffff, 0.75).setDepth(26);
      this.tweens.add({
        targets: shard,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 70 : -70,
        duration: 300,
        onComplete: () => shard.destroy()
      });
    });
  }

  private spawnSkeletonBones(x: number, y: number) {
    const pieces = [
      [-18, -12, 0xdedbd2],
      [18, -10, 0xc7c3b8],
      [-16, 14, 0xbdb8ad],
      [16, 15, 0xe4e0d5],
      [0, -22, 0x8fa8c8],
      [0, 20, 0x9ba5b6]
    ];
    pieces.forEach(([dx, dy, color], index) => {
      const piece = index === 4
        ? this.add.circle(x, y, 4, color, 0.95)
        : this.add.rectangle(x, y, index === 5 ? 12 : 15, index === 5 ? 6 : 5, color, 0.92);
      piece.setStrokeStyle(1, 0xffffff, 0.42).setDepth(26);
      this.tweens.add({
        targets: piece,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 85 : -85,
        duration: 340,
        onComplete: () => piece.destroy()
      });
    });
  }

  private spawnBatSmoke(x: number, y: number) {
    const clouds = [
      [-18, -10, 14],
      [16, -12, 12],
      [-12, 13, 10],
      [13, 12, 11],
      [0, -20, 9],
      [0, 18, 13]
    ];
    clouds.forEach(([dx, dy, size], index) => {
      const cloud = this.add.ellipse(x, y, size, size * 0.72, index % 2 ? 0x6a2a8d : 0x2a173d, 0.56).setDepth(26);
      this.tweens.add({
        targets: cloud,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        scale: 1.55,
        duration: 360,
        onComplete: () => cloud.destroy()
      });
    });
  }

  private spawnRuneShards(x: number, y: number) {
    const pieces = [
      [-18, -14],
      [18, -13],
      [-16, 14],
      [16, 15],
      [0, -22],
      [0, 20]
    ];
    pieces.forEach(([dx, dy], index) => {
      const piece = this.add.polygon(x, y, [0, -7, 7, 0, 0, 7, -7, 0], index % 2 ? 0x8ffcff : 0x7b62ff, 0.82).setStrokeStyle(1, 0xe8ffff, 0.5).setDepth(26);
      this.tweens.add({
        targets: piece,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 90 : -90,
        duration: 340,
        onComplete: () => piece.destroy()
      });
    });
  }

  private spawnGuardianDeath(x: number, y: number) {
    this.cameras.main.shake(260, 0.006);
    const flash = this.add.circle(x, y, 36, 0xff6db8, 0.22).setStrokeStyle(4, 0xd8ffff, 0.9).setDepth(30);
    this.tweens.add({ targets: flash, scale: 2.4, alpha: 0, duration: 620, onComplete: () => flash.destroy() });
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 36 + (i % 3) * 12;
      const shard = this.add.triangle(x, y, 0, 18, 8, 0, 16, 18, i % 2 ? 0xff6db8 : 0x6fdcff, 0.9).setStrokeStyle(1, 0xffffff, 0.55).setDepth(31);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        angle: i % 2 ? 160 : -160,
        duration: 720,
        onComplete: () => shard.destroy()
      });
    }
  }

  private damagePlayer(rawDamage: number, reason: string, options: PlayerDamageOptions = {}): boolean {
    if (this.runEnded || !this.player.active || this.time.now < this.invincibleUntil) return false;
    const shieldActive = this.time.now < this.shieldUntil;
    const reducedDamage = Math.max(1, rawDamage - this.player.stats.def);
    const minDamage = options.minDamageRatio ? Math.ceil(rawDamage * options.minDamageRatio) : 1;
    const damageBeforeShield = Math.max(reducedDamage, minDamage);
    const damage = Math.max(1, Math.round(damageBeforeShield * (shieldActive ? 0.5 : 1)));
    this.player.stats.hp -= damage;
    this.damageTaken += damage;
    this.invincibleUntil = this.time.now + (options.invincibleMs ?? 800);
    this.sfx.play('hurt');
    this.showDamageNumber(this.player.x, this.player.y - 34, damage, options.emphasized ? '#ff4f7b' : '#ff8aa8', options.emphasized);
    this.cameras.main.shake(options.shakeDuration ?? (damage >= 8 ? 165 : 120), options.shakeIntensity ?? (damage >= 8 ? 0.007 : 0.005));
    this.log(`${reason}造成 ${damage} 点伤害。${shieldActive ? '护盾抵消了部分伤害。' : ''}`);
    if (this.player.stats.hp <= 0) this.finishRun(false, reason);
    return true;
  }

  private knockbackPlayerFrom(sourceX: number, sourceY: number, distance: number) {
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.player.x, this.player.y);
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 122, 838);
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 122, 518);
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 105,
      ease: 'Quad.easeOut'
    });
  }

  private updateInvincibleVisual(time: number) {
    if (!this.player.active || this.runEnded) return;
    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
      this.player.setTint(0xff9ab1);
      return;
    }
    this.player.setAlpha(1);
    if (time >= this.shieldUntil) this.player.clearTint();
  }

  private showDamageNumber(x: number, y: number, damage: number, color: string, emphasized = false) {
    const text = this.add.text(x - 10, y, `-${damage}`, { fontFamily: 'monospace', fontSize: emphasized ? '22px' : '18px', color, stroke: '#07101e', strokeThickness: 3 }).setDepth(90);
    this.tweens.add({ targets: text, y: y - 30, alpha: 0, duration: 680, onComplete: () => text.destroy() });
  }

  private interact() {
    if (this.currentRoom.reward && !this.rewardTaken) {
      this.log('先拾取房间奖励。');
      return;
    }
    if (!this.roomCleared) {
      this.log('清除敌人后传送门才会开启。');
      return;
    }
    if (this.currentRoomIndex >= ROOMS.length - 1) return;
    this.sfx.play('portal');
    this.loadRoom(this.currentRoomIndex + 1);
  }

  private pickItem(item: Phaser.Physics.Arcade.Sprite) {
    if (this.rewardTaken) return;
    const type = item.getData('item') as 'chest' | 'potion';
    this.rewardTaken = true;
    item.disableBody(true, true);
    item.destroy();
    if (type === 'potion') {
      this.sfx.play('pickup');
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 30);
      this.itemsObtained.push('小型生命药水');
      this.showRewardToast('potion_hp', '获得：小型生命药水 HP +30');
      this.log('获得小型生命药水：回复 30 点生命。按 E 继续。');
      return;
    }
    this.sfx.play('chest');
    this.add.sprite(480, 320, this.assetKey('chest_open')).setDisplaySize(54, 54).setDepth(20).setData('roomObj', true);
    if (Phaser.Math.Between(0, 1) === 0) {
      this.player.stats.atk += 3;
      this.itemsObtained.push('攻击晶石');
      this.add.sprite(520, 320, this.assetKey('attack_crystal')).setDisplaySize(40, 44).setDepth(20).setData('roomObj', true);
      this.showRewardToast('attack_crystal', '获得：攻击晶石 ATK +3');
      this.log('宝箱奖励：攻击晶石，攻击 +3。按 E 继续。');
    } else {
      this.player.stats.def += 1;
      this.itemsObtained.push('防御护符');
      this.add.sprite(520, 320, this.assetKey('defense_charm')).setDisplaySize(40, 44).setDepth(20).setData('roomObj', true);
      this.showRewardToast('defense_charm', '获得：防御护符 DEF +1');
      this.log('宝箱奖励：防御护符，防御 +1。按 E 继续。');
    }
  }

  private showRewardToast(assetName: DungeonAssetName, message: string) {
    const x = Phaser.Math.Clamp(this.player.x + 12, 150, 760);
    const y = Phaser.Math.Clamp(this.player.y - 76, 110, 470);
    const container = this.add.container(x, y).setDepth(98).setData('roomObj', true);
    const bg = this.add.rectangle(0, 0, 250, 48, 0x07101e, 0.88).setStrokeStyle(1, 0x8ffcff);
    const icon = this.add.image(-104, 0, this.assetKey(assetName)).setDisplaySize(34, 34);
    const text = this.add.text(-78, -10, message, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f5ffff',
      stroke: '#07101e',
      strokeThickness: 2
    });
    container.add([bg, icon, text]);
    this.tweens.add({
      targets: container,
      y: y - 28,
      alpha: 0,
      delay: 1200,
      duration: 520,
      onComplete: () => container.destroy()
    });
  }

  private cleanupProjectiles() {
    this.bullets.getChildren().forEach((object) => {
      const bullet = object as Phaser.Physics.Arcade.Sprite;
      if (bullet.x < 90 || bullet.x > 890 || bullet.y < 70 || bullet.y > 570) this.destroyProjectile(bullet);
    });
  }

  private updateUi(time: number) {
    const dashLeft = Math.max(0, Math.ceil((this.skillCooldowns.dashSlash - time) / 1000));
    const shieldLeft = Math.max(0, Math.ceil((this.skillCooldowns.shield - time) / 1000));
    const hpRatio = Phaser.Math.Clamp(this.player.stats.hp / this.player.stats.maxHp, 0, 1);
    this.hpBarFill.width = 176 * hpRatio;
    this.hpBarFill.setFillStyle(hpRatio < 0.32 ? 0xff5f7d : 0x35e7c4);
    this.statusText.setText([
      `HP ${Math.max(0, Math.ceil(this.player.stats.hp))}/${this.player.stats.maxHp}`,
      `ATK ${this.player.stats.atk}    DEF ${this.player.stats.def}`,
      `金币 ${this.gold}    道具 ${this.itemsObtained.join('、') || '无'}`
    ]);
    this.skillText.setText([
      '[J] 普通攻击',
      `[K] 冲刺斩：${dashLeft === 0 ? '可用' : `冷却 ${dashLeft} 秒`}`,
      `[L] 护盾：${shieldLeft === 0 ? '可用' : `冷却 ${shieldLeft} 秒`}`
    ]);
    this.roomText.setText([
      `${this.currentRoomIndex + 1}/6 ${this.currentRoom.name}`,
      this.roomCleared ? '传送门：已开启，按 E 进入' : '传送门：清除敌人后开启'
    ]);
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (boss && this.bossBarFill && this.bossBarText) {
      this.bossBarFill.width = 340 * Math.max(0, boss.stats.hp / boss.stats.maxHp);
      this.bossBarText.setText(`晶核守卫 ${Math.max(0, Math.ceil(boss.stats.hp))}/${boss.stats.maxHp}${boss.stats.hp / boss.stats.maxHp < 0.5 ? '  第二阶段' : '  第一阶段'}`);
    }
    if (this.shieldRing) this.shieldRing.setPosition(this.player.x, this.player.y);
  }

  private showRoomTitle() {
    this.roomTitleToast?.destroy();
    const title = this.currentRoom.kind === 'boss'
      ? '第 6 房：首领房：晶核守卫'
      : `第 ${this.currentRoomIndex + 1} 房：${this.currentRoom.name}`;
    this.roomTitleToast = this.add.text(480, 300, title, {
      fontFamily: 'monospace',
      fontSize: this.currentRoom.kind === 'boss' ? '30px' : '28px',
      color: this.currentRoom.kind === 'boss' ? '#ffd7e6' : '#ffffff',
      stroke: '#07101e',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(95);
    this.tweens.add({
      targets: this.roomTitleToast,
      alpha: 1,
      y: 286,
      duration: 220,
      onComplete: () => {
        if (!this.roomTitleToast || this.runEnded) return;
        this.tweens.add({
          targets: this.roomTitleToast,
          alpha: 0,
          y: 272,
          delay: 1000,
          duration: 420,
          onComplete: () => {
            this.roomTitleToast?.destroy();
            this.roomTitleToast = undefined;
          }
        });
      }
    });
  }

  private updateDoor() {
    if (!this.doorSprite) return;
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.doorSprite.setTexture(this.assetKey(this.roomCleared ? 'door_open' : 'door_closed'));
    this.doorSprite.setDisplaySize(46, 98);
    this.doorSprite.clearTint();
    const baseScaleX = this.doorSprite.scaleX;
    const baseScaleY = this.doorSprite.scaleY;
    if (this.roomCleared) {
      this.doorSprite.setAlpha(1).setTint(0xbaffff);
      this.doorTween = this.tweens.add({
        targets: this.doorSprite,
        alpha: 0.64,
        scaleX: baseScaleX * 1.08,
        scaleY: baseScaleY * 1.08,
        yoyo: true,
        repeat: -1,
        duration: 820
      });
    } else {
      this.doorSprite.setAlpha(0.52).setTint(0x40536a);
    }
  }

  private countLivingEnemies() {
    return (this.enemies.getChildren() as Fighter[]).filter((enemy) => enemy.active && !enemy.getData('dying')).length;
  }

  private createBossBar() {
    this.destroyBossBar();
    this.bossBarBg = this.add.rectangle(480, 58, 348, 18, 0x240f1e).setStrokeStyle(2, 0xff78ab).setDepth(85);
    this.bossBarFill = this.add.rectangle(309, 58, 340, 12, 0xff4f9b).setOrigin(0, 0.5).setDepth(86);
    this.bossBarText = this.add.text(480, 30, '晶核守卫', { fontFamily: 'monospace', fontSize: '16px', color: '#ffd7e6' }).setOrigin(0.5).setDepth(86);
  }

  private destroyBossBar() {
    this.bossBarBg?.destroy();
    this.bossBarFill?.destroy();
    this.bossBarText?.destroy();
    this.bossBarBg = undefined;
    this.bossBarFill = undefined;
    this.bossBarText = undefined;
  }

  private createUnitHud(fighter: Fighter) {
    const width = fighter.stats.boss ? 104 : fighter.stats.kind === 'player' ? 58 : 52;
    const hud: UnitHud = {
      name: this.add.text(fighter.x, fighter.y - 44, fighter.stats.name, { fontFamily: 'monospace', fontSize: '12px', color: '#eaffff', stroke: '#07101e', strokeThickness: 3 }).setOrigin(0.5).setDepth(70),
      hpBg: this.add.rectangle(fighter.x, fighter.y - 28, width, 6, 0x250c18).setDepth(69),
      hpFill: this.add.rectangle(fighter.x - width / 2, fighter.y - 28, width, 6, fighter.stats.kind === 'player' ? 0x35e7c4 : 0xff5f7d).setOrigin(0, 0.5).setDepth(70)
    };
    this.unitHuds.set(fighter.stats.id, hud);
  }

  private updateUnitHuds() {
    const fighters = [this.player, ...(this.enemies.getChildren() as Fighter[])].filter((fighter) => fighter?.active);
    fighters.forEach((fighter) => {
      const hud = this.unitHuds.get(fighter.stats.id);
      if (!hud) return;
      const width = fighter.stats.boss ? 104 : fighter.stats.kind === 'player' ? 58 : 52;
      const yOffset = fighter.stats.boss ? 62 : 28;
      hud.name.setPosition(fighter.x, fighter.y - (fighter.stats.boss ? 82 : 42));
      hud.hpBg.setPosition(fighter.x, fighter.y - yOffset);
      hud.hpFill.setPosition(fighter.x - width / 2, fighter.y - yOffset);
      hud.hpFill.width = width * Phaser.Math.Clamp(fighter.stats.hp / fighter.stats.maxHp, 0, 1);
    });
  }

  private destroyUnitHud(fighter: Fighter) {
    const hud = this.unitHuds.get(fighter.stats.id);
    if (!hud) return;
    hud.name.destroy();
    hud.hpBg.destroy();
    hud.hpFill.destroy();
    this.unitHuds.delete(fighter.stats.id);
  }

  private clearEnemyHuds() {
    [...this.unitHuds.entries()].forEach(([id, hud]) => {
      if (id === 'player') return;
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
      this.unitHuds.delete(id);
    });
  }

  private log(message: string) {
    this.logText.setText(`战斗日志：${message}`);
  }

  private getGrade(victory: boolean, durationSeconds: number) {
    if (victory && durationSeconds <= 240) return 'A';
    if (victory) return 'B';
    if (this.reachedBossPhaseTwo) return 'C';
    return 'D';
  }

  private finishRun(victory: boolean, reason: string) {
    if (this.runEnded) return;
    this.runEnded = true;
    this.flowState = 'ended';
    this.playerActionState = 'dead';
    this.sfx.play(victory ? 'victory' : 'defeat');
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.bullets.clear(true, true);
    this.destroyBossBar();
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.roomTitleToast?.destroy();
    this.roomTitleToast = undefined;
    this.roomText.setVisible(false);
    const endedAt = Date.now();
    const durationSeconds = Math.round((endedAt - this.startedAt) / 1000);
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    const bossRemainingHpPercent = victory || !boss ? 0 : Math.max(0, (boss.stats.hp / boss.stats.maxHp) * 100);
    const grade = this.getGrade(victory, durationSeconds);
    const run: GameRun = {
      id: `lingxu-${endedAt}`,
      levelId: this.level.id,
      classId: this.playerClass.id,
      className: '遗迹猎人',
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSeconds,
      victory,
      kills: this.kills,
      elitesDefeated: 0,
      goldEarned: this.gold,
      equipmentFound: this.itemsObtained.length,
      relicsFound: 0,
      eventsTriggered: this.skillUses,
      bossRemainingHpPercent,
      deathReason: victory ? '源晶净化完成' : reason,
      score: grade === 'A' ? 95 : grade === 'B' ? 82 : grade === 'C' ? 65 : 45
    };
    storageService.saveRun(run);
    this.setGameplayUiVisible(false);
    this.setWorldVisible(true);
    this.settlementPanel?.destroy();
    const panel = this.add.container(480, 300).setDepth(240);
    this.settlementPanel = panel;
    panel.add(this.add.rectangle(0, 0, 640, 410, 0x07101e, 0.98).setStrokeStyle(2, victory ? 0x35e7c4 : 0xff4f7b));
    panel.add(this.add.text(-260, -168, victory ? '源晶已净化' : '遗迹探索终止', { fontFamily: 'monospace', fontSize: '30px', color: '#ffffff' }));
    panel.add(this.add.text(-260, -112, [
      `结果：${victory ? '胜利，源晶已净化' : '失败，遗迹探索终止'}`,
      `用时：${durationSeconds} 秒`,
      `击杀数：${this.kills}`,
      `受到伤害：${this.damageTaken}`,
      `使用技能次数：${this.skillUses}`,
      `获得道具：${this.itemsObtained.join('、') || '无'}`,
      `死亡原因：${run.deathReason}`,
      `评分：${grade}`
    ], { fontFamily: 'monospace', fontSize: '17px', color: '#dff7ff', lineSpacing: 7 }));
    panel.add(this.createMenuButton(-105, 158, 170, '重新开始', () => {
      this.settlementPanel?.destroy();
      this.startGame();
    }));
    panel.add(this.createMenuButton(105, 158, 170, '返回标题', () => {
      this.settlementPanel?.destroy();
      this.returnToTitle();
    }));
    this.onRunEnd(run.id);
  }
}
