import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { House } from '../entities/Resources';
import { CONFIG } from './Config';

describe('Conservation Reliability', () => {
    it('Divine Intervention should spawn reserve when extinct', () => {
        const world = new World(20, 20);
        // No wolves, no reserves

        // Force tick count to trigger reseed
        world.tickCount = CONFIG.WORLD.RESEED_INTERVAL - 1;

        world.tick();

        const reserve = world.entities.find(e => e.type === 'naturereserve');
        expect(reserve).toBeDefined();
        expect(reserve.spawnType).toBe('wolf'); // Should default to wolf if both missing? Or random?
        // Code checks wolves < 2 first.
    });

    it('Human should find conservation spot in crowded world', () => {
        const world = new World(50, 50);
        const human = new Human(25, 25);
        world.addEntity(human);

        // Surround with houses to block strict spacing (radius 8)
        // Place houses in a grid around human
        for (let y = 15; y < 35; y += 3) {
            for (let x = 15; x < 35; x += 3) {
                if (x === 25 && y === 25) continue;
                world.addEntity(new House(x, y));
            }
        }

        // Ensure wolves are 0 to trigger conservation
        expect(world.entityCounts.wolf).toBe(0);

        // Tick enough times for travel and relaxed search
        for (let i = 0; i < 100; i++) world.tick();

        const reserve = world.entities.find(e => e.type === 'naturereserve');
        expect(reserve).toBeDefined();
    });
});
