import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Entity } from '../entities/Entity';

describe('Terrain Decay', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
    });

    it('should increase terrain wear ONLY when human moves', () => {
        const human = new Entity(5, 5, 'human', '#fff');
        world.addEntity(human);
        human.move(1, 0, world);
        expect(world.getTerrain(5, 5)).toBeGreaterThan(0);

        const cow = new Entity(10, 10, 'cow', '#fff');
        world.addEntity(cow);
        cow.move(1, 0, world);
        expect(world.getTerrain(10, 10)).toBe(0);
    });

    it('should decay terrain wear over time', () => {
        // Manually set terrain wear
        world.updateTerrain(5, 5, 0.5);
        expect(world.getTerrain(5, 5)).toBe(0.5);

        // Tick 10 times (decay happens every 10 ticks)
        for (let i = 0; i < 10; i++) {
            world.tick();
        }

        // Should be less than 0.5
        expect(world.getTerrain(5, 5)).toBeLessThan(0.5);
        // Should be exactly 0.5 - 0.02 = 0.48
        expect(world.getTerrain(5, 5)).toBeCloseTo(0.48);
    });

    it('should not decay below 0', () => {
        world.updateTerrain(5, 5, 0.01);

        // Tick enough to decay fully
        for (let i = 0; i < 20; i++) {
            world.tick();
        }

        expect(world.getTerrain(5, 5)).toBe(0);
    });
});
