export const enemyIntent = (role: string, distance: number, range: number) => {
  if (role === 'ranged' || role === 'summoner') return distance > range ? 'approach' : 'kite';
  return 'chase';
};
