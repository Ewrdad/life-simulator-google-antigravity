import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { CONFIG } from './Config';

describe('Population Control (War)', () => {
    it('Should calculate high overRatio and war chance when overpopulated', () => {
        const world = new World(20, 20);
        // Mock entity counts
        world.entityCounts.human = 1000; // Way over 250

        const human = new Human(10, 10);
        const rates = human.getDynamicRates(world);

        expect(rates.overRatio).toBeGreaterThan(1.0);
        expect(rates.warChance).toBe(1.0); // Maxed out
        expect(rates.splitChance).toBeGreaterThan(0.01);
    });

    it('Should hunt enemies from far away when overpopulated', () => {
        const world = new World(50, 50);
        world.entityCounts.human = 1000; // Overpopulated

        const h1 = new Human(10, 10);
        h1.faction = 'RED';
        h1.hunger = 0; // Healthy
        world.addEntity(h1);

        const h2 = new Human(30, 30); // Far away (dist ~28)
        h2.faction = 'BLUE';
        world.addEntity(h2);

        // Normal radius is 8. With overRatio ~3, radius should be 8 + 30 = 38.
        // So h1 should find h2.

        // Force war chance
        const rates = h1.getDynamicRates(world);
        h1.tryWar(world, 1.0, rates.overRatio);

        expect(h1.action).toBe('FIGHTING');
    });

    it('Should split easily when overpopulated', () => {
        const world = new World(20, 20);
        world.entityCounts.human = 1000; // Overpopulated

        const h1 = new Human(10, 10);
        h1.faction = 'RED';
        world.addEntity(h1);

        // Add just 2 neighbors (threshold normally 6)
        const n1 = new Human(10, 11); n1.faction = 'RED'; world.addEntity(n1);
        const n2 = new Human(11, 10); n2.faction = 'RED'; world.addEntity(n2);

        // Force split chance
        const rates = h1.getDynamicRates(world);
        const split = h1.trySocietalSplit(world, 1.0, rates.overRatio);

        // Should split because threshold drops to 2
        expect(split).toBe(true);
        expect(h1.faction).not.toBe('RED');
    });
});
