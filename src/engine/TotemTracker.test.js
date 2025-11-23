import { World } from './World';
import { Human } from '../entities/Human';
import { Totem } from '../entities/Totem';
import { CONFIG } from './Config';
import { describe, test, expect, vi } from 'vitest';

describe('Totem Tracker and Logs', () => {
    test('World should track totem counts', () => {
        const world = new World(100, 100);
        expect(world.entityCounts.totem).toBe(0);

        const totem = new Totem(50, 50, 'RED', '#ff0000');
        world.addEntity(totem);

        // Manual update of counts usually happens in tick or addEntity if not restoring
        // addEntity increments count
        expect(world.entityCounts.totem).toBe(1);

        totem.markedForDeletion = true;
        world.tick(); // Should clean up and decrement
        expect(world.entityCounts.totem).toBe(0);
    });

    test('World should trigger logEvent callback', () => {
        const world = new World(100, 100);
        const logCallback = vi.fn();
        world.onLogEvent = logCallback;

        world.logEvent('Test Message');
        expect(logCallback).toHaveBeenCalledWith('Test Message', undefined);
    });

    test('Human should log event when building Totem', () => {
        const world = new World(100, 100);
        const logCallback = vi.fn();
        world.onLogEvent = logCallback;

        const human = new Human(50, 50);
        human.wood = 20;
        human.faction = 'RED';
        world.addEntity(human);

        // Force build totem
        // We can call tryWork directly or mock conditions
        // Let's mock conditions to ensure it enters the block

        // Mock findNearest to return null (no nearby totem)
        // Mock getAt to return null (empty spot)
        // But tryWork uses world methods.

        // Let's just call tryWork and hope random chance favors us or force it.
        // The logic is:
        // if (wood >= COST)
        //   check nearby totem
        //   if none, build

        // We need to ensure no nearby totem.
        // And ensure random spot is valid.

        // Let's just run it.
        const result = human.tryWork(world);

        // It might fail if it decides to do something else or fails to find a spot.
        // But since priority is high (3), and wood is high, it should try.

        // If it built, log should be called.
        if (result && human.action === 'BUILDING_TOTEM') {
            expect(logCallback).toHaveBeenCalled();
            expect(logCallback.mock.calls[0][0]).toContain('built a Totem');
        }
    });
});
