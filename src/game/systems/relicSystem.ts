import { RelicConfig } from '../../types/game';

export const hasRelicEffect = (relics: RelicConfig[], effectType: RelicConfig['effectType']) => relics.some((relic) => relic.effectType === effectType);
