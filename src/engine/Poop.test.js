import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { CONFIG } from './Config';

describe('Seed Pooping', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
        // Force poop chance to 100% for testing
        CONFIG.ENTITIES.HUMAN.POOP_CHANCE = 1.0;
        CONFIG.ENTITIES.COW.POOP_CHANCE = 1.0;
        CONFIG.ENTITIES.WOLF.POOP_CHANCE = 1.0;
    });

    it('Human should poop a plant', () => {
        const human = new Human(10, 10);
        human.wander = () => { }; // Prevent moving
        world.addEntity(human);

        // Tick should trigger tryPoop
        human.tick(world);

        // Check if a plant spawned nearby
        let plantFound = false;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const entity = world.getAt(10 + dx, 10 + dy);
                if (entity && (entity.type === 'berry' || entity.type === 'tree')) {
                    plantFound = true;
                    break;
                }
            }
        }
        expect(plantFound).toBe(true);
    });

    it('Cow should poop a plant', () => {
        const cow = new Cow(5, 5);
        cow.wander = () => { }; // Prevent moving and eating the plant
        world.addEntity(cow);
        cow.tick(world);

        let plantFound = false;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const entity = world.getAt(5 + dx, 5 + dy);
                if (entity && (entity.type === 'berry' || entity.type === 'tree')) {
                    plantFound = true;
                    break;
                }
            }
        }
        expect(plantFound).toBe(true);
    });

    it('Wolf should poop a plant', () => {
        const wolf = new Wolf(15, 15);
        wolf.wander = () => { }; // Prevent moving
        world.addEntity(wolf);
        wolf.tick(world);

        let plantFound = false;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const entity = world.getAt(15 + dx, 15 + dy);
                if (entity && (entity.type === 'berry' || entity.type === 'tree')) {
                    plantFound = true;
                    break;
                }
            }
        }
        expect(plantFound).toBe(true);
    });
});
