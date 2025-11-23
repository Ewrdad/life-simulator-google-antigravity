import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Cow } from '../entities/Cow';
import { Tree } from '../entities/Resources';
import { NatureReserve } from '../entities/NatureReserve';
import { CONFIG } from './Config';

describe('Ecosystem Behaviors', () => {
    it('Human should plant tree when trees are low', () => {
        const world = new World(20, 20);
        const human = new Human(10, 10);
        world.addEntity(human);

        // Add some wolves to ensure human has other tasks
        // MIN_THRESHOLD is 40, so we need > 40 to avoid conservation blocking planting
        // Place them far away (0,0) to avoid triggering "DEFENDING" behavior
        for (let i = 0; i < 45; i++) {
            world.addEntity(new Wolf(0, 0));
        }
        // Add cows to prevent cow conservation
        // MIN_THRESHOLD is 80
        for (let i = 0; i < 85; i++) {
            world.addEntity(new Cow(0, 0));
        }

        // Ensure trees are 0 (below threshold)
        expect(world.entityCounts.tree).toBe(0);
        expect(CONFIG.ECOSYSTEM.TREES.MIN_THRESHOLD).toBeGreaterThan(0);

        // Tick
        world.tick();

        // Human should have planted a tree
        // Note: Planting might take a move + action, so give it a few ticks
        for (let i = 0; i < 50; i++) world.tick();

        expect(world.entityCounts.tree).toBeGreaterThan(0);
        const tree = world.entities.find(e => e.type === 'tree');
        expect(tree).toBeDefined();
    });

    it('Human should cull wolves when too many', () => {
        const world = new World(20, 20);
        const human = new Human(10, 10);
        world.addEntity(human);

        // Add many wolves
        const wolfCount = CONFIG.ECOSYSTEM.WOLVES.MAX_THRESHOLD + 5;
        for (let i = 0; i < wolfCount; i++) {
            world.addEntity(new Wolf(i % 20, Math.floor(i / 20)));
        }

        expect(world.entityCounts.wolf).toBe(wolfCount);

        // Tick
        for (let i = 0; i < 30; i++) world.tick();

        // Should have killed at least one
        expect(world.entityCounts.wolf).toBeLessThan(wolfCount);
    });

    it('Human should build NatureReserve when wolves are low', () => {
        const world = new World(20, 20);
        const human = new Human(10, 10);
        world.addEntity(human);

        // Surround human with "houses" (or obstacles) to force travel
        // But keep a spot open further away
        // Actually, let's just rely on the fact that findConservationSpot looks for distance > 8
        // If we place a house at 12,12 (dist 2.8), adjacent spots might be invalid?
        // No, findConservationSpot checks for houses within 8 tiles.
        // So if we place a house at 10, 12, spots near 10,10 might be too close.

        // Let's just trust the logic for now and ensure it builds EVENTUALLY.
        // The previous test relied on adjacent. Now it might take time.

        // Ensure wolves are 0
        expect(world.entityCounts.wolf).toBe(0);

        // Tick
        for (let i = 0; i < 50; i++) world.tick(); // Give time to travel

        const reserve = world.entities.find(e => e.type === 'naturereserve');
        expect(reserve).toBeDefined();
    });

    it('NatureReserve should spawn wolves', () => {
        const world = new World(20, 20);
        const reserve = new NatureReserve(10, 10);
        world.addEntity(reserve);

        // Force spawn
        // We can't easily force Math.random, but we can check if it eventually spawns
        // Or we can mock Math.random? 
        // Let's just run enough ticks.

        // Increase spawn rate for test or just wait
        const originalRate = CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE;
        CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE = 1.0; // Always spawn

        // Run a few ticks to ensure spawn (random placement might fail)
        for (let i = 0; i < 10; i++) world.tick();

        expect(world.entityCounts.wolf).toBeGreaterThan(0);

        // Restore config
        CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE = originalRate;
    });
    it('Human should build NatureReserve for Cows when cows are low', () => {
        const world = new World(20, 20);
        const human = new Human(10, 10);
        world.addEntity(human);

        // Add wolves to prevent wolf conservation (priority)
        // Add wolves to prevent wolf conservation (priority)
        // MIN_THRESHOLD is 40
        for (let i = 0; i < 45; i++) {
            world.addEntity(new Wolf(i % 20, Math.floor(i / 20)));
        }

        // Ensure cows are 0
        expect(world.entityCounts.cow).toBe(0);

        // Tick
        for (let i = 0; i < 50; i++) world.tick();

        const reserve = world.entities.find(e => e.type === 'naturereserve');
        expect(reserve).toBeDefined();
        expect(reserve.spawnType).toBe('cow');
    });

    it('NatureReserve should spawn cows', () => {
        const world = new World(20, 20);
        const reserve = new NatureReserve(10, 10, 'COW');
        world.addEntity(reserve);

        const originalRate = CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE;
        CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE = 1.0; // Always spawn

        for (let i = 0; i < 10; i++) world.tick();

        expect(world.entityCounts.cow).toBeGreaterThan(0);

        CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE = originalRate;
    });
});
