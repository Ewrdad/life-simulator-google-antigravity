import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Tree, House, Water, BerryBush } from '../entities/Resources';
import { Totem } from '../entities/Totem';
import { CONFIG } from './Config';

describe('Civilization Behaviors', () => {
    // Disable ecosystem maintenance for these tests
    CONFIG.ECOSYSTEM.TREES.MIN_THRESHOLD = 0;
    CONFIG.ECOSYSTEM.WOLVES.MIN_THRESHOLD = 0;
    CONFIG.ECOSYSTEM.COWS.MIN_THRESHOLD = 0;

    it('Human should gather wood from Tree', () => {
        const world = new World(20, 20);
        const human = new Human(5, 5);
        const tree = new Tree(6, 5); // Adjacent
        world.addEntity(human);
        world.addEntity(tree);

        // Human needs wood (wood < 5)
        expect(human.wood).toBe(0);

        // Tick 1: Human should chop tree
        world.tick();

        expect(world.entities).not.toContain(tree); // Tree should be gone
        expect(human.wood).toBe(5); // Human should have wood
    });

    it('Human should build House when having enough wood', () => {
        const world = new World(20, 20);
        const human = new Human(5, 5);
        human.wood = 5; // Give wood
        world.addEntity(human);
        world.addEntity(new Water(10, 10));
        world.addEntity(new Water(10, 10));
        world.addEntity(new BerryBush(8, 8));
        // Add Totem so human doesn't save wood for it
        world.addEntity(new Totem(2, 2, human.faction, human.color));

        // Tick 1: Human should build house OR move to build site
        // With new AI, they might move first. Give them a few ticks.
        for (let i = 0; i < 100; i++) {
            world.tick();
            if (human.wood === 0) break; // Built!
        }

        // Check for house
        const house = world.entities.find(e => e.type === 'house');
        expect(house).toBeDefined();
        expect(human.wood).toBe(0); // Wood used
    });

    it('Human should seek shelter in House when threatened', () => {
        const world = new World(20, 20);
        const human = new Human(6, 5);  // Next to house
        const house = new House(7, 5);   // Adjacent to human
        const wolf = new Wolf(5, 7);     // Nearby threat

        world.addEntity(human);
        world.addEntity(house);
        world.addEntity(wolf);

        // Force fleeing behavior
        world.settings.humanDefenseChance = 0;

        // Human should enter house
        world.tick();

        expect(world.entities).not.toContain(human);
        expect(house.occupants).toContain(human);
    });
});
