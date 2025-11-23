import { describe, test, expect, beforeEach } from 'vitest';
import { World } from '../engine/World';
import { Cow } from './Cow';
import { Wolf } from './Wolf';
import { CONFIG } from '../engine/Config';

describe('Animal Genetics Integration', () => {
    let world;

    beforeEach(() => {
        world = new World(100, 100);
    });

    test('Cow initializes with default traits', () => {
        const cow = new Cow(10, 10);
        expect(cow.traits).toBeDefined();
        expect(cow.traits.moveSpeed).toBe(CONFIG.GENETICS.BASE_TRAITS.moveSpeed);
    });

    test('Wolf initializes with default traits', () => {
        const wolf = new Wolf(10, 10);
        expect(wolf.traits).toBeDefined();
        expect(wolf.traits.visionRadius).toBe(CONFIG.GENETICS.BASE_TRAITS.visionRadius);
    });

    test('Cow inherits and mutates traits on reproduction', () => {
        const parent = new Cow(10, 10);
        // Force a specific trait to verify inheritance base
        parent.traits.moveSpeed = 1.5;

        // Mock reproduction logic (manual spawn as we can't easily trigger full reproduction cycle in unit test without complex setup)
        const baby = new Cow(11, 11, parent.traits);

        expect(baby.traits).toBeDefined();
        // Should be close to 1.5, not default 1.0
        expect(baby.traits.moveSpeed).toBeGreaterThan(1.1);
        expect(baby.traits.moveSpeed).toBeLessThan(1.9);
    });

    test('Wolf hunger rate is affected by traits', () => {
        const wolf = new Wolf(10, 10);
        wolf.traits.hungerRate = 2.0; // Double hunger

        const initialHunger = wolf.hunger;
        wolf.tick(world);

        // Expected hunger increase: base * trait
        const expectedIncrease = world.settings.wolfHungerRate * 2.0;
        expect(wolf.hunger).toBeCloseTo(initialHunger + expectedIncrease, 5);
    });

    test('Wolf vision radius affects hunting range', () => {
        const wolf = new Wolf(10, 10);
        wolf.traits.visionRadius = 2.0; // Double vision

        // Mock world.findNearest to spy on radius
        let searchedRadius = 0;
        world.findNearest = (x, y, type, radius) => {
            if (type === 'cow') searchedRadius = radius;
            return null;
        };

        wolf.hunt(world);

        // Default is 20, so we expect 40
        expect(searchedRadius).toBe(40);
    });
});
