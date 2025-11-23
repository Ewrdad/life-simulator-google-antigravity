import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { Farm, BerryBush } from '../entities/Resources';

describe('World Simulation', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
    });

    it('should spawn entities correctly', () => {
        const human = new Human(5, 5);
        world.addEntity(human);
        expect(world.entities).toContain(human);
        expect(world.getAt(5, 5)).toBe(human);
    });

    it('Human should eat food (Cow)', () => {
        const human = new Human(5, 5);
        human.hunger = 60;
        const cow = new Cow(6, 5); // Adjacent
        world.addEntity(human);
        world.addEntity(cow);

        // Force high cow count to bypass conservation
        world.entityCounts.cow = 100;

        // Tick world
        world.tick();

        // Human should have eaten cow
        expect(human.hunger).toBeLessThan(80);
        expect(world.entities).not.toContain(cow);
    });

    it('Cow should reproduce when well fed', () => {
        const cow1 = new Cow(5, 5);
        const cow2 = new Cow(6, 5);
        cow1.hunger = 0;
        cow2.hunger = 0;
        world.addEntity(cow1);
        world.addEntity(cow2);

        // Tick world multiple times to trigger reproduction logic
        // Cow reproduction cooldown is 0 initially? No, constructor sets it to 0.
        // But they need to be near each other.
        // And hunger < 20.

        world.tick();

        // Should have a baby (or two)
        const cows = world.entities.filter(e => e.type === 'cow');
        expect(cows.length).toBeGreaterThan(2);
    });

    it('Cow should seek Farm', () => {
        const cow = new Cow(5, 5);
        cow.hunger = 50; // Hungry enough to seek food
        const farm = new Farm(10, 5);
        farm.growth = 100; // Ready to eat
        world.addEntity(cow);
        world.addEntity(farm);

        world.tick();

        // Cow should move towards farm (x increases)
        expect(cow.x).toBeGreaterThan(5);
    });

    it('Wolf should hunt Cow', () => {
        const wolf = new Wolf(5, 5);
        const cow = new Cow(5, 6); // Adjacent
        wolf.hunger = 50; // Hungry enough to hunt
        world.addEntity(wolf);
        world.addEntity(cow);

        // Tick multiple times to allow movement/attack
        for (let i = 0; i < 5; i++) {
            world.tick();
            if (cow.markedForDeletion) break;
        }

        expect(cow.markedForDeletion).toBe(true);
        expect(wolf.hunger).toBe(0); // Reset hunger
    });

    it('Human should defend against Wolf', () => {
        const human = new Human(5, 5);
        const wolf = new Wolf(5, 6);
        world.addEntity(human);
        world.addEntity(wolf);

        // Force defense
        world.settings.humanDefenseChance = 1.0;

        // Tick multiple times to allow combat resolution
        for (let i = 0; i < 10; i++) {
            world.tick();
            if (wolf.markedForDeletion) break;
        }

        expect(wolf.markedForDeletion).toBe(true);
        // Human hunger < 50 (0 initially), so should defend
        // Wolf hunger 0, so it won't attack Human, but Human should hunt Wolf
        expect(world.entities).not.toContain(wolf);
        expect(human.hunger).toBeGreaterThan(0); // Fighting is tiring
    });

    it('World should reseed extinct species', () => {
        // Mock onExtinction
        let reseeded = false;
        world.onExtinction = (type) => {
            if (type === 'human') reseeded = true;
        };

        // No humans in world
        world.tickCount = 99; // Trigger on next tick (100)
        world.tick();

        expect(reseeded).toBe(true);
    });
});
