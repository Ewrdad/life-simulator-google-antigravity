import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';
import { Human } from '../entities/Human';
import { describe, test, expect } from 'vitest';

describe('Weather Events', () => {
    test('Heat Wave should kill low tolerance entities', () => {
        const world = new World(100, 100);
        const eventSystem = new RandomEventSystem(world);
        eventSystem.eventChance = 0;

        // Add humans with different tolerances
        const weakHuman = new Human(0, 0);
        weakHuman.traits = { heatTolerance: 0.1 }; // Very weak
        world.addEntity(weakHuman);

        const strongHuman = new Human(1, 0);
        strongHuman.traits = { heatTolerance: 2.0 }; // Very strong
        world.addEntity(strongHuman);

        // Mock random to ensure weak dies (random > 0.06) and strong lives (random < 1.2)
        // We can't easily mock Math.random here without a library or dependency injection.
        // Instead, let's run it multiple times or rely on the probability gap.
        // 0.1 tolerance -> 0.06 survival chance. 94% death rate.
        // 2.0 tolerance -> 1.2 survival chance. 0% death rate.

        let weakDied = false;
        let strongDied = false;

        // Run event multiple times to be sure
        for (let i = 0; i < 10; i++) {
            if (!weakHuman.markedForDeletion) {
                eventSystem.handleHeatWave();
                if (weakHuman.markedForDeletion) weakDied = true;
            }
            // Resurrect strong human if it accidentally died (shouldn't happen)
            if (strongHuman.markedForDeletion) strongDied = true;
        }

        expect(weakDied).toBe(true);
        expect(strongDied).toBe(false);
    });

    test('Monsoon should spawn water', () => {
        const world = new World(100, 100);
        const eventSystem = new RandomEventSystem(world);

        const initialWater = world.entities.filter(e => e.type === 'water').length;
        eventSystem.handleMonsoon();
        const finalWater = world.entities.filter(e => e.type === 'water').length;

        expect(finalWater).toBeGreaterThan(initialWater);
    });
});
