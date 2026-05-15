import { EventConfig } from '../../types/game';

export const pickEvent = (events: EventConfig[], id?: string) => events.find((event) => event.id === id) ?? events[0];
