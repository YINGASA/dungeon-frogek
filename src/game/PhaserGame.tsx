import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { LevelConfig, PlayerClassConfig } from '../types/game';
import { DungeonScene } from './scenes/DungeonScene';

export const PhaserGame = ({ level, playerClass, onRunEnd }: { level: LevelConfig; playerClass: PlayerClassConfig; onRunEnd: (runId: string) => void }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    hostRef.current.focus();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 960,
      height: 600,
      backgroundColor: '#08111f',
      input: {
        keyboard: {
          target: window,
          capture: [
            Phaser.Input.Keyboard.KeyCodes.W,
            Phaser.Input.Keyboard.KeyCodes.A,
            Phaser.Input.Keyboard.KeyCodes.S,
            Phaser.Input.Keyboard.KeyCodes.D,
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.J,
            Phaser.Input.Keyboard.KeyCodes.K,
            Phaser.Input.Keyboard.KeyCodes.L,
            Phaser.Input.Keyboard.KeyCodes.E,
            Phaser.Input.Keyboard.KeyCodes.ESC,
            Phaser.Input.Keyboard.KeyCodes.R
          ]
        }
      },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [new DungeonScene(level, playerClass, onRunEnd)],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    });
    window.setTimeout(() => hostRef.current?.focus(), 50);
    return () => game.destroy(true);
  }, [level, playerClass, onRunEnd]);

  return <div className="game-host" ref={hostRef} tabIndex={0} onMouseDown={() => hostRef.current?.focus()} />;
};
