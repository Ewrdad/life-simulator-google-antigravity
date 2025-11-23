import { World } from './World';
import { Human } from '../entities/Human';
import { Totem } from '../entities/Totem';
import { CONFIG } from './Config';
import { describe, test, expect } from 'vitest';

describe('Totem Mechanics', () => {
    test('Human should build Totem when has wood and space', () => {
        const world = new World(100, 100);
        const human = new Human(50, 50);
        human.wood = 20; // Enough for Totem (10)
        human.faction = 'RED';
        world.addEntity(human);

        // Add animals to prevent ecosystem panic
        for (let i = 0; i < 50; i++) {
            world.addEntity({ type: 'cow', x: 0, y: 0, tick: () => { }, draw: () => { } });
            world.addEntity({ type: 'wolf', x: 0, y: 0, tick: () => { }, draw: () => { } });
            world.addEntity({ type: 'tree', x: 0, y: 0, tick: () => { }, draw: () => { } });
            world.addEntity({ type: 'tree', x: 0, y: 0, tick: () => { }, draw: () => { } });
            world.addEntity({ type: 'tree', x: 0, y: 0, tick: () => { }, draw: () => { } });
        }
        // Mock entityCounts update (usually happens in world.tick)
        world.entityCounts.cow = 100; // > 80
        world.entityCounts.wolf = 50; // > 40
        world.entityCounts.tree = 150; // > 125

        // Ensure no nearby totem
        expect(world.entities.filter(e => e.type === 'totem').length).toBe(0);

        // Tick until built
        // Human logic: tryWork -> build Totem
        // We need to force tryWork or just tick enough
        // tryWork is priority 3/4. 
        // Thirst/Hunger are 0.
        // Reproduction cooldown is 0, but no mate.
        // So tryWork should run.

        // Force action for test reliability?
        // Or just tick.
        for (let i = 0; i < 10; i++) {
            world.tick();
            console.log(`Tick ${i}: Action=${human.action}, Wood=${human.wood}, Totems=${world.entities.filter(e => e.type === 'totem').length}`);
            if (world.entities.some(e => e.type === 'totem')) break;
        }

        const totems = world.entities.filter(e => e.type === 'totem');
        expect(totems.length).toBe(1);
        expect(totems[0].faction).toBe('RED');
        expect(human.wood).toBeLessThan(20);
    });

    test('Human should attack enemy Totem', () => {
        const world = new World(100, 100);
        const human = new Human(50, 50);
        human.faction = 'RED';
        world.addEntity(human);

        const totem = new Totem(51, 50, 'BLUE', '#0000ff'); // Adjacent enemy totem
        world.addEntity(totem);

        // Tick
        world.tick();

        // Human should attack totem
        // Logic: nearbyTotem check in tick() overrides action if enemy
        expect(human.action).toBe('ATTACKING_TOTEM');
        expect(totem.markedForDeletion).toBe(true);
    });

    test('Friendly Totem should heal Human', () => {
        const world = new World(100, 100);
        const human = new Human(50, 50);
        human.faction = 'RED';
        human.hunger = 50;
        world.addEntity(human);

        const totem = new Totem(51, 50, 'RED', '#ff0000'); // Adjacent friendly totem
        world.addEntity(totem);

        // Tick multiple times to trigger random heal chance (10%)
        let healed = false;
        for (let i = 0; i < 50; i++) {
            const prevHunger = human.hunger;
            world.tick();
            if (human.hunger < prevHunger) {
                healed = true;
                break;
            }
            // Prevent starvation for test
            human.hunger = 50;
        }

        expect(healed).toBe(true);
    });
});
