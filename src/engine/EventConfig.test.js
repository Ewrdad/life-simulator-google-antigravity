import { describe, test, expect, beforeEach } from 'vitest';
import { RandomEventSystem } from './RandomEventSystem';
import { World } from './World';

describe('RandomEventSystem Configuration', () => {
    let world;
    let system;

    beforeEach(() => {
        world = new World(50, 50);
        system = new RandomEventSystem(world);
    });

    test('should initialize with all events enabled', () => {
        expect(system.enabledEvents.size).toBe(system.allEventTypes.length);
        expect(system.enabledEvents.has('volcano')).toBe(true);
    });

    test('should toggle events', () => {
        system.toggleEvent('volcano');
        expect(system.enabledEvents.has('volcano')).toBe(false);

        system.toggleEvent('volcano');
        expect(system.enabledEvents.has('volcano')).toBe(true);
    });

    test('should set event chance', () => {
        system.setEventChance(0.05);
        expect(system.eventChance).toBe(0.05);

        system.setEventChance(2.0); // Should clamp
        expect(system.eventChance).toBe(1);

        system.setEventChance(-1); // Should clamp
        expect(system.eventChance).toBe(0);
    });

    test('should not trigger disabled events', () => {
        // Disable all except volcano
        system.allEventTypes.forEach(type => {
            if (type !== 'volcano') system.toggleEvent(type);
        });

        expect(system.enabledEvents.size).toBe(1);
        expect(system.enabledEvents.has('volcano')).toBe(true);

        // Mock triggerEvent to verify what gets called
        let triggeredType = null;
        system.triggerEvent = (type) => { triggeredType = type; };

        // Force trigger
        system.triggerRandomEvent();

        expect(triggeredType).toBe('volcano');
    });

    test('should not trigger anything if all disabled', () => {
        system.allEventTypes.forEach(type => system.toggleEvent(type));
        expect(system.enabledEvents.size).toBe(0);

        let triggered = false;
        system.triggerEvent = () => { triggered = true; };

        system.triggerRandomEvent();
        expect(triggered).toBe(false);
    });

    test('should reset to defaults', () => {
        system.setEventChance(0.05);
        system.toggleEvent('volcano');
        expect(system.eventChance).toBe(0.05);
        expect(system.enabledEvents.has('volcano')).toBe(false);

        system.reset();

        expect(system.eventChance).toBe(0.005);
        expect(system.enabledEvents.has('volcano')).toBe(true);
        expect(system.enabledEvents.size).toBe(system.allEventTypes.length);
    });
});
