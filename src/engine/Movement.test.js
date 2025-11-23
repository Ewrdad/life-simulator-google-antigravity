import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Entity } from '../entities/Entity';

describe('Movement Behaviors', () => {
    it('Entity should move normally into empty space', () => {
        const world = new World(10, 10);
        const entity = new Entity(5, 5, 'test', '#fff');
        world.addEntity(entity);

        entity.move(1, 0, world);

        expect(entity.x).toBe(6);
        expect(entity.y).toBe(5);
    });

    it('Entity should jump over an obstacle', () => {
        const world = new World(10, 10);
        const entity = new Entity(5, 5, 'jumper', '#fff');
        const obstacle = new Entity(6, 5, 'rock', '#000');
        world.addEntity(entity);
        world.addEntity(obstacle);

        // Try to move right (blocked by obstacle)
        entity.move(1, 0, world);

        // Should have jumped to (7, 5)
        expect(entity.x).toBe(7);
        expect(entity.y).toBe(5);
    });

    it('Entity should NOT jump if landing spot is blocked', () => {
        const world = new World(10, 10);
        const entity = new Entity(5, 5, 'jumper', '#fff');
        const obstacle1 = new Entity(6, 5, 'rock1', '#000');
        const obstacle2 = new Entity(7, 5, 'rock2', '#000');
        world.addEntity(entity);
        world.addEntity(obstacle1);
        world.addEntity(obstacle2);

        // Try to move right (blocked by obstacle1, jump blocked by obstacle2)
        entity.move(1, 0, world);

        // Should stay put
        expect(entity.x).toBe(5);
        expect(entity.y).toBe(5);
    });
});
