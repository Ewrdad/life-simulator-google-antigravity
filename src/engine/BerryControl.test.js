import { describe, test, expect, beforeEach } from 'vitest';
import { World } from './World';
import { BerryBush } from '../entities/Resources';
import { CONFIG } from './Config';

describe('Berry Bush Population Control', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
        // Reset counts
        world.entityCounts.berry = 0;
    });

    test('Should respect global population limit', () => {
        // Mock config to have a low limit
        const originalLimit = CONFIG.ECOSYSTEM.BERRIES.MAX_POPULATION;
        CONFIG.ECOSYSTEM.BERRIES.MAX_POPULATION = 5;

        // Fill world with berries up to limit
        for (let i = 0; i < 5; i++) {
            world.addEntity(new BerryBush(i, 0));
        }
        expect(world.entityCounts.berry).toBe(5);

        // Try to spread from one of them
        const bush = world.entities[0];

        // Force spread chance
        const originalChance = CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE;
        CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE = 1.0;

        bush.tick(world);

        // Should NOT have increased
        expect(world.entityCounts.berry).toBe(5);

        // Restore config
        CONFIG.ECOSYSTEM.BERRIES.MAX_POPULATION = originalLimit;
        CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE = originalChance;
    });

    test('Should respect local density limit', () => {
        // Mock config
        const originalRadius = CONFIG.ECOSYSTEM.BERRIES.NEIGHBOR_RADIUS;
        const originalMaxNeighbors = CONFIG.ECOSYSTEM.BERRIES.MAX_NEIGHBORS;
        CONFIG.ECOSYSTEM.BERRIES.NEIGHBOR_RADIUS = 1;
        CONFIG.ECOSYSTEM.BERRIES.MAX_NEIGHBORS = 2;

        // Setup a crowded spot:
        // B B .
        // B . .
        // . . .
        // (0,0), (1,0), (0,1) are berries.
        // (0,0) has neighbors (1,0) and (0,1) -> 2 neighbors.
        // If limit is 2, it should NOT spread.

        const b1 = new BerryBush(0, 0);
        const b2 = new BerryBush(1, 0);
        const b3 = new BerryBush(0, 1);

        world.addEntity(b1);
        world.addEntity(b2);
        world.addEntity(b3);

        // Force spread
        const originalChance = CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE;
        CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE = 1.0;

        // Tick b1. It has 2 neighbors (b2, b3). Limit is 2. Should fail.
        const initialCount = world.entities.length;
        b1.tick(world);

        expect(world.entities.length).toBe(initialCount);

        // Restore config
        CONFIG.ECOSYSTEM.BERRIES.NEIGHBOR_RADIUS = originalRadius;
        CONFIG.ECOSYSTEM.BERRIES.MAX_NEIGHBORS = originalMaxNeighbors;
        CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE = originalChance;
    });
});
