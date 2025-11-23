import { World } from './World';
import { Human } from '../entities/Human';
import { describe, test, expect, vi } from 'vitest';

describe('Faction Safety Net', () => {
    test('Should split faction when population > 300', () => {
        const world = new World(100, 100);
        const factionName = 'MEGA_FACTION';

        // Add 301 humans of the same faction
        for (let i = 0; i < 301; i++) {
            const h = new Human(50, 50);
            h.faction = factionName;
            h.color = '#ffffff';
            world.addEntity(h);
        }

        // Mock logEvent to verify message
        const logSpy = vi.fn();
        world.onLogEvent = logSpy;

        // Force tick count to 100 to trigger check
        world.tickCount = 99;
        world.tick(); // Tick 100

        // Check if split happened
        const humans = world.entitiesByType.get('human');
        const factions = new Set();
        humans.forEach(h => factions.add(h.faction));

        expect(factions.size).toBe(2);
        expect(factions.has(factionName)).toBe(false);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('The Great Schism'), 'POPULATION');
    });
});
