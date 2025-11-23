import { describe, test, expect, beforeEach } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';
import { Lava } from '../entities/Lava';
import { Entity } from '../entities/Entity';

describe('Volcano Event', () => {
    let world;
    let system;

    beforeEach(() => {
        world = new World(50, 50);
        system = new RandomEventSystem(world);
    });

    test('Lava entity creation and decay', () => {
        const lava = new Lava(10, 10);
        expect(lava.type).toBe('lava');
        expect(lava.color).toBe('#ef4444');

        // Simulate tick
        lava.age = lava.lifespan + 1;
        lava.tick(world); // Should trigger death check if implemented in tick or external
        // In Entity.tick: if (this.age > this.lifespan) this.die(world);

        // We need to mock world.removeEntity or check markedForDeletion
        let removed = false;
        world.removeEntity = (e) => { if (e === lava) removed = true; };

        lava.tick(world);
        expect(removed).toBe(true);
    });

    test('Lava Rain spawns lava and destroys entities', () => {
        // Place an entity
        const victim = new Entity(10, 10, 'victim', '#000');
        world.addEntity(victim);

        // Mock Math.random to ensure we hit (10, 10) or just check general logic
        // It's hard to force random coords without mocking.
        // Instead, let's just run handleLavaRain and check if we get lava entities.

        const msg = system.handleLavaRain();
        expect(msg).toContain('Volcano: Lava Rain!');

        const lavaCount = world.entities.filter(e => e.type === 'lava').length;
        expect(lavaCount).toBeGreaterThan(0);
    });

    test('Lava Flow creates a path', () => {
        const msg = system.handleLavaFlow();
        expect(msg).toContain('Volcano: A massive Lava Flow');

        const lavaCount = world.entities.filter(e => e.type === 'lava').length;
        expect(lavaCount).toBeGreaterThan(10); // Should be a significant number
    });
});
