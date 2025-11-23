import { describe, it, expect, beforeEach } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';
import { Human } from '../entities/Human';

describe('Earthquake Event', () => {
    let world;
    let eventSystem;

    beforeEach(() => {
        world = new World(50, 50);
        eventSystem = new RandomEventSystem(world);
    });

    it('should handle block swap earthquake', () => {
        // Setup specific entities to track
        const h1 = new Human(10, 10);
        const h2 = new Human(30, 30);
        world.addEntity(h1);
        world.addEntity(h2);

        // Mock random to force block swap and specific coordinates
        // We need to mock Math.random to control the type and coordinates
        // This is tricky without a proper mock, so we'll just test the method directly if possible
        // or rely on the fact that it returns a string.

        // Let's test the logic by calling the specific handler directly if we can access it,
        // but they are methods on the instance.

        const msg = eventSystem.handleEarthquakeBlockSwap();
        expect(msg).toContain('Earthquake (Block Swap)');
        // We can't easily assert exact positions without mocking random, 
        // but we can check if entities moved or if the grid is still valid.

        // Check grid consistency
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const entity = world.getAt(x, y);
                if (entity) {
                    expect(entity.x).toBe(x);
                    expect(entity.y).toBe(y);
                }
            }
        }
    });

    it('should handle fault line earthquake', () => {
        const h1 = new Human(10, 10);
        world.addEntity(h1);

        const msg = eventSystem.handleEarthquakeFaultLine();
        expect(msg).toContain('Earthquake (Fault Line)');

        // Check grid consistency
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const entity = world.getAt(x, y);
                if (entity) {
                    expect(entity.x).toBe(x);
                    expect(entity.y).toBe(y);
                }
            }
        }
    });

    it('should handle scramble earthquake', () => {
        const h1 = new Human(25, 25);
        world.addEntity(h1);

        const msg = eventSystem.handleEarthquakeScramble();
        expect(msg).toContain('Earthquake (Scramble)');

        // Check grid consistency
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const entity = world.getAt(x, y);
                if (entity) {
                    expect(entity.x).toBe(x);
                    expect(entity.y).toBe(y);
                }
            }
        }
    });
});
