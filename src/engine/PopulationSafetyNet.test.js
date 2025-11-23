import { describe, test, expect } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';
import { Human } from '../entities/Human';

describe('Population Safety Net', () => {
    test('simple check', () => {
        expect(true).toBe(true);
    });

    test('should cull population when it exceeds 1000', () => {
        const world = new World(100, 100);
        const eventSystem = new RandomEventSystem(world);
        eventSystem.eventChance = 0;

        // Add 1002 humans
        for (let i = 0; i < 1002; i++) {
            const human = new Human(0, 0);
            world.addEntity(human);
        }

        // Mock entity counts since we manually added them
        world.entityCounts.human = 1002;

        // Tick to trigger check (needs to be multiple of 100)
        world.tickCount = 100;
        eventSystem.tick();

        // Should have killed ~501 humans
        const remaining = world.entities.filter(e => !e.markedForDeletion).length;
        // console.log('Remaining:', remaining);
        expect(remaining).toBeLessThan(600);
        expect(remaining).toBeGreaterThan(400);

        // Check event log
        const events = eventSystem.getRecentEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].message).toContain("Thanos snapped his fingers");
    });
});
