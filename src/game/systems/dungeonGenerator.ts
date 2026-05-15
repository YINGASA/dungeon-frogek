import { LevelConfig } from '../../types/game';
import { DEFAULT_LEVEL } from '../data/defaultLevel';

export const getPlayableLevel = (level?: LevelConfig) => level ?? DEFAULT_LEVEL;
