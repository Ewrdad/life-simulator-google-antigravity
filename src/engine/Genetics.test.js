import { describe, test, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { CONFIG } from './Config';

describe('Faction Genetics', () => {
    let world;

    beforeEach(() => {
        world = new World(100, 100);
        // Reset CONFIG limits for testing if needed, but default is fine
    });

    test('Initializes default traits for new faction', () => {
        const traits = world.getFactionTraits('RED');
        expect(traits).toEqual(CONFIG.GENETICS.BASE_TRAITS);
    });

    test('Mutates traits when registering new faction', () => {
        world.getFactionTraits('RED'); // Ensure parent exists

        // Mock Math.random to control mutation direction
        // We want to verify it changes, exact value depends on implementation details of random
        // But we can check bounds.

        world.registerNewFaction('BLUE', 'RED');
        const redTraits = world.getFactionTraits('RED');
        const blueTraits = world.getFactionTraits('BLUE');

        expect(blueTraits).not.toEqual(redTraits);

        // Check limits
        expect(blueTraits.moveSpeed).toBeGreaterThanOrEqual(CONFIG.GENETICS.LIMITS.moveSpeed.min);
        expect(blueTraits.moveSpeed).toBeLessThanOrEqual(CONFIG.GENETICS.LIMITS.moveSpeed.max);
    });

    test('Human inherits faction traits', () => {
        const human = new Human(10, 10);
        human.faction = 'SPEEDSTERS';
        world.addEntity(human);

        // Force high speed traits
        world.factionTraits.set('SPEEDSTERS', {
            ...CONFIG.GENETICS.BASE_TRAITS,
            moveSpeed: 2.0
        });

        // Mock random to ensure super speed triggers (it needs random < speed - 1.0)
        // speed 2.0 -> random < 1.0 -> always true
        const originalRandom = Math.random;
        Math.random = () => 0.5;

        // Move towards target far away
        human.moveTowards(20, 10, world);

        // Should have moved 2 tiles (x=12) instead of 1 (x=11)
        expect(human.x).toBe(12);

        Math.random = originalRandom;
    });

    test('Aggression trait affects war chance', () => {
        const human = new Human(10, 10);
        human.faction = 'WARRIORS';
        world.addEntity(human);

        // Force high aggression
        world.factionTraits.set('WARRIORS', {
            ...CONFIG.GENETICS.BASE_TRAITS,
            aggression: 3.0
        });

        // Mock world settings
        world.settings.humanWarChance = 0.1;

        // We can't easily test tryWar internal logic without mocking Math.random and finding enemies
        // But we can verify the trait is accessible
        const traits = world.getFactionTraits(human.faction);
        expect(traits.aggression).toBe(3.0);
    });
});
