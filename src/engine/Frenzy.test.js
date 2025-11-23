import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { BerryBush } from '../entities/Resources';
import { CONFIG } from './Config';

describe('Frenzy Mechanics', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
        // Reset counts
        world.entityCounts = {
            human: 0,
            wolf: 0,
            cow: 0,
            tree: 0,
            berry: 0,
            house: 0,
            farm: 0,
            naturereserve: 0,
            water: 0
        };
    });

    it('Cow should enter frenzy when berries are high', () => {
        // Set berry count to trigger frenzy
        world.entityCounts.berry = CONFIG.ECOSYSTEM.BERRIES.FRENZY_THRESHOLD + 1;

        const c1 = new Cow(10, 10);
        const c2 = new Cow(11, 10); // Mate
        world.addEntity(c1);
        world.addEntity(c2);

        // Reset cooldowns
        c1.reproductionCooldown = 0;
        c2.reproductionCooldown = 0;

        // Tick to trigger reproduction
        c1.tick(world);

        // Check if reproduction happened (cooldown should be set)
        // And cooldown should be short (frenzy modifier)
        const expectedCooldown = Math.floor(200 * CONFIG.ECOSYSTEM.FRENZY.REPRODUCTION_COOLDOWN_MODIFIER);
        expect(c1.reproductionCooldown).toBe(expectedCooldown);
    });

    it('Cow should NOT enter frenzy when berries are low', () => {
        // Set berry count below threshold
        world.entityCounts.berry = CONFIG.ECOSYSTEM.BERRIES.FRENZY_THRESHOLD - 1;
        // Ensure not endangered
        world.entityCounts.cow = CONFIG.ECOSYSTEM.COWS.MIN_THRESHOLD + 10;

        const c1 = new Cow(10, 10);
        const c2 = new Cow(11, 10);
        world.addEntity(c1);
        world.addEntity(c2);

        c1.reproductionCooldown = 0;

        c1.tick(world);

        // Normal cooldown is 200 (from code logic, though Config says 20? let's check code)
        // In Cow.js: let cooldown = 200;
        expect(c1.reproductionCooldown).toBe(200);
    });

    it('Wolf should enter frenzy when cows are high', () => {
        // Set cow count to trigger frenzy
        world.entityCounts.cow = CONFIG.ECOSYSTEM.WOLVES.FRENZY_THRESHOLD + 1;

        const w1 = new Wolf(10, 10);
        const w2 = new Wolf(11, 10); // Mate
        world.addEntity(w1);
        world.addEntity(w2);

        w1.reproductionCooldown = 0;
        w1.hunger = 0; // Needs low hunger to reproduce normally, but frenzy allows higher

        w1.tick(world);

        // Check cooldown
        const expectedCooldown = Math.floor(CONFIG.ENTITIES.WOLF.REPRODUCTION_COOLDOWN * CONFIG.ECOSYSTEM.FRENZY.REPRODUCTION_COOLDOWN_MODIFIER);
        expect(w1.reproductionCooldown).toBe(expectedCooldown);
    });
});
