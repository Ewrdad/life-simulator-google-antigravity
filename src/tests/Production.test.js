import { describe, test, expect, beforeEach, vi } from 'vitest';
import { World } from '../engine/World';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { BerryBush } from '../entities/Resources';
import { CONFIG } from '../engine/Config';

describe('Production Stability Test', () => {
    let world;

    beforeEach(() => {
        world = new World(50, 50);
        // Reduce log noise
        console.log = vi.fn();
    });

    test('Simulation runs for 1000 ticks without crashing', () => {
        // Setup initial population
        for (let i = 0; i < 20; i++) world.addEntity(new Human(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 20; i++) world.addEntity(new Cow(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 10; i++) world.addEntity(new Wolf(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 50; i++) world.addEntity(new BerryBush(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));

        const initialEntityCount = world.entities.length;
        expect(initialEntityCount).toBeGreaterThan(0);

        // Run 1000 ticks
        for (let i = 0; i < 1000; i++) {
            try {
                world.tick();
            } catch (e) {
                console.error(`Crash at tick ${i}:`, e);
                throw e;
            }
        }

        // Assertions
        const finalEntityCount = world.entities.length;
        console.info(`Simulation finished. Entities: ${initialEntityCount} -> ${finalEntityCount}`);

        // It's okay if population drops or grows, but it shouldn't be 0 (unless extinction is intended, but 1000 ticks is short)
        // Actually, with small map and random spawn, extinction is possible. 
        // Just checking for no crash is the main goal here.
        expect(world.tickCount).toBe(1000);
    }, 15000);

    test('Entity counts are consistent after long run', () => {
        // Setup
        for (let i = 0; i < 10; i++) world.addEntity(new Human(i, i));

        // Run 100 ticks
        for (let i = 0; i < 100; i++) {
            world.tick();
        }

        // Force recalculate
        world.recalculateStats();

        // Verify counts match actual entities
        const actualHumanCount = world.entities.filter(e => e.type === 'human' && !e.markedForDeletion).length;
        const trackedHumanCount = world.entityCounts.human;

        expect(trackedHumanCount).toBe(actualHumanCount);
    });
});
