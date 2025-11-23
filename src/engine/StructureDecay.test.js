import { describe, test, expect, beforeEach } from 'vitest';
import { World } from './World';
import { House } from '../entities/Resources';
import { NatureReserve } from '../entities/NatureReserve';
import { CONFIG } from './Config';

describe('Structure Decay', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
        // Mock CONFIG to ensure consistent test values if needed, 
        // but we want to test the actual config values we just set.
    });

    test('House should decay after configured lifespan', () => {
        const house = new House(10, 10);
        world.addEntity(house);

        expect(house.lifespan).toBe(CONFIG.ENTITIES.HOUSE.LIFESPAN);
        expect(house.lifespan).toBe(300); // Explicit check for the new value

        // Fast forward to near death
        house.age = house.lifespan - 1;
        house.tick(world); // age becomes lifespan (300), should survive

        // Check if marked for deletion (Entity.tick calls die() which sets markedForDeletion)
        // Wait, Entity.tick checks if (this.age > this.lifespan). 
        // If age == lifespan, it survives. Next tick it dies.

        expect(house.markedForDeletion).toBe(false);

        house.tick(world); // age becomes lifespan + 1 (301), should die
        expect(house.markedForDeletion).toBe(true);
    });

    test('NatureReserve should decay after configured lifespan', () => {
        const reserve = new NatureReserve(5, 5);
        world.addEntity(reserve);

        expect(reserve.lifespan).toBe(CONFIG.ENTITIES.NATURE_RESERVE.LIFESPAN);
        expect(reserve.lifespan).toBe(300); // Explicit check for the new value

        // NatureReserve overrides tick and decrements lifespan manually
        // tick() { this.lifespan--; if (this.lifespan <= 0) die... }

        // Fast forward
        reserve.lifespan = 1;
        reserve.tick(world); // lifespan becomes 0, calls die()

        expect(reserve.markedForDeletion).toBe(true);
    });
});
