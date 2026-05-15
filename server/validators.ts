import { LevelConfig } from '../src/types/game';

export const validateLevelConfig = (level: LevelConfig): string[] => {
  const errors: string[] = [];
  const rooms = level?.floors?.flatMap((floor) => floor.rooms) ?? [];
  if (!level || typeof level !== 'object') return ['LevelConfig is not an object'];
  if ((level.floors?.length ?? 0) < 3) errors.push('至少需要 3 层地牢');
  if (rooms.length < 8) errors.push('至少需要 8 个房间');
  if ((level.enemies?.filter((enemy) => enemy.role !== 'elite').length ?? 0) < 8) errors.push('至少需要 8 个普通怪');
  if ((level.enemies?.filter((enemy) => enemy.role === 'elite').length ?? 0) < 2) errors.push('至少需要 2 个精英怪');
  if (!level.boss) errors.push('至少需要 1 个 Boss');
  if ((level.equipment?.length ?? 0) < 10) errors.push('至少需要 10 个装备');
  if ((level.relics?.length ?? 0) < 8) errors.push('至少需要 8 个遗物');
  if ((level.events?.length ?? 0) < 5) errors.push('至少需要 5 个随机事件');

  const numbers: number[] = [
    ...(level.enemies ?? []).flatMap((enemy) => [enemy.hp, enemy.attack, enemy.defense, enemy.moveSpeed, enemy.attackRange, enemy.attackCooldown, enemy.goldReward, enemy.expReward]),
    ...(level.equipment ?? []).flatMap((item) => [item.attackBonus, item.defenseBonus, item.hpBonus, item.critRateBonus, item.speedBonus]),
    level.boss?.hp ?? 0,
    level.boss?.attack ?? 0,
    level.boss?.defense ?? 0
  ];
  if (numbers.some((value) => Number.isNaN(value) || value < 0)) errors.push('数值配置不能为负数');

  const byId = new Map(rooms.map((room) => [room.id, room]));
  const visited = new Set<string>();
  const stack = rooms[0] ? [rooms[0].id] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const room = byId.get(id);
    room?.connections.forEach((next) => {
      if (byId.has(next)) stack.push(next);
    });
  }
  if (rooms.length > 0 && rooms.some((room) => !visited.has(room.id))) errors.push('房间连接不可达');
  return errors;
};
