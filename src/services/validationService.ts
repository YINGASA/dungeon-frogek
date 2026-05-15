import { LevelConfig } from '../types/game';

export const validateLevelConfigClient = (level: LevelConfig): string[] => {
  const errors: string[] = [];
  const rooms = level.floors.flatMap((floor) => floor.rooms);
  if (level.floors.length < 3) errors.push('至少需要 3 层地牢。');
  if (rooms.length < 8) errors.push('至少需要 8 个房间。');
  if (level.enemies.length < 8) errors.push('至少需要 8 个普通怪配置。');
  if (level.enemies.filter((enemy) => enemy.role === 'elite').length < 2) errors.push('至少需要 2 个精英怪。');
  if (!level.boss) errors.push('至少需要 1 个首领。');
  if (level.equipment.length < 10) errors.push('至少需要 10 件装备。');
  if (level.relics.length < 8) errors.push('至少需要 8 个遗物。');
  if (level.events.length < 5) errors.push('至少需要 5 个随机事件。');
  const byId = new Map(rooms.map((room) => [room.id, room]));
  const visited = new Set<string>();
  const stack = rooms[0] ? [rooms[0].id] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    byId.get(id)?.connections.forEach((next) => {
      if (byId.has(next)) stack.push(next);
    });
  }
  if (rooms.some((room) => !visited.has(room.id))) errors.push('房间连接不可完全到达。');
  return errors;
};
