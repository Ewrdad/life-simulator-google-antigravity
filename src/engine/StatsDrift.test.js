import { describe, test, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { House } from '../entities/Resources';
import { CONFIG } from './Config';

describe('Stats Drift', () => {
    let world;

    beforeEach(() => {
        world = new World(10, 10);
        // Reset config to defaults if needed, or mock
    });

    test('Human count should decrease when House containing Human is destroyed', () => {
        const human = new Human(0, 0);
        const house = new House(0, 1);

        world.addEntity(human);
        world.addEntity(house);

        expect(world.entityCounts.human).toBe(1);
        expect(world.entityCounts.house).toBe(1);

        // Force human into house
        house.addOccupant(human);
        human.isStored = true;
        human.markedForDeletion = true;
        world.removeEntity(human);

        // Verify human is "gone" from grid but count remains
        expect(world.getAt(0, 0)).toBeNull();
        expect(world.entityCounts.human).toBe(1);

        // Destroy house
        house.die(world);
        world.tick(); // Process removal

        // Verify house is gone
        expect(world.entityCounts.house).toBe(0);

        // In our implementation, we try to eject the occupant.
        // Since (0,0) is empty, the human should be ejected there.
        // So count should be 1, and human should be on grid.
        expect(world.entityCounts.human).toBe(1);
        expect(world.getAt(human.x, human.y)).not.toBeNull();
        expect(world.getAt(human.x, human.y).type).toBe('human');
    });

    test('Human count should decrease if House is destroyed and occupant cannot be ejected', () => {
        const human = new Human(5, 5);
        const house = new House(5, 5); // Wait, house at 5,5? Human at 5,5?
        // Let's put house at 5,5

        world.addEntity(human);
        world.addEntity(house);

        house.addOccupant(human);
        human.isStored = true;
        human.markedForDeletion = true;
        world.removeEntity(human);

        // Surround the house with rocks/water/etc so no ejection possible
        // House is at 5,5. Neighbors are 4,4 to 6,6.
        for (let y = 4; y <= 6; y++) {
            for (let x = 4; x <= 6; x++) {
                if (x === 5 && y === 5) continue;
                const rock = new House(x, y); // Just use houses as blockers
                world.addEntity(rock);
            }
        }

        // Destroy house
        house.die(world);

        // Human should be crushed (count decremented)
        expect(world.entityCounts.human).toBe(0);
    });

    test('Recalculate stats should correct any drift', () => {
        world.entityCounts.human = 100; // Artificially drift
        world.recalculateStats();
        expect(world.entityCounts.human).toBe(0); // Should be 0 as no entities added
    });
});
