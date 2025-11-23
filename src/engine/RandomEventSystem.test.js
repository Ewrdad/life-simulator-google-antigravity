import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';
import { Human } from '../entities/Human';

describe('RandomEventSystem', () => {
    let world;
    let eventSystem;

    beforeEach(() => {
        world = new World(100, 100);
        eventSystem = new RandomEventSystem(world);
        // Mock ThoughtSystem
        world.thoughtSystem = {
            addThought: vi.fn()
        };
        // Add a human so thoughts can be triggered
        world.addEntity(new Human(50, 50));
    });

    it('should trigger thoughts for earthquake', () => {
        const human = new Human(50, 50);
        world.addEntity(human);

        eventSystem.triggerEventThoughts('earthquake');
        expect(world.thoughtSystem.addThought).toHaveBeenCalled();
    });

    it('should trigger thoughts for meteorite', () => {
        const human = new Human(50, 50);
        world.addEntity(human);

        eventSystem.triggerEventThoughts('meteorite');
        expect(world.thoughtSystem.addThought).toHaveBeenCalled();
    });

    it('should handle population boon', () => {
        const msg = eventSystem.handlePopulationBoon();
        expect(msg).toContain('Population Boon');
        expect(world.thoughtSystem.addThought).toHaveBeenCalled();
    });

    it('should handle resource boom', () => {
        const msg = eventSystem.handleResourceBoom();
        expect(msg).toContain('Resource Boom');
        expect(world.thoughtSystem.addThought).toHaveBeenCalled();
    });
});
