import { describe, test, expect, vi } from 'vitest';
import { World } from '../engine/World';
import { RandomEventSystem } from '../engine/RandomEventSystem';

// Mock FileReader
global.FileReader = class {
    readAsText(file) {
        this.onload({ target: { result: file } });
    }
};

// Mock window if it doesn't exist (Node environment)
if (typeof window === 'undefined') {
    global.window = {
        confirm: () => true,
        alert: () => { },
    };
} else {
    // If window exists (jsdom), spy on it
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => { });
}

describe('Settings Management', () => {
    test('should export and import settings correctly', () => {
        const world = new World(10, 10);
        const eventSystem = new RandomEventSystem(world);

        // Modify settings
        world.settings.humanHungerRate = 0.99;
        eventSystem.setEventChance(0.02);
        eventSystem.toggleEvent('volcano'); // Disable volcano

        // Simulate Export (create the data structure manually as we can't click the button)
        const exportData = {
            ...world.settings,
            eventSettings: {
                chance: eventSystem.eventChance,
                enabled: Array.from(eventSystem.enabledEvents)
            }
        };

        const jsonString = JSON.stringify(exportData);

        // Create fresh instances
        const newWorld = new World(10, 10);
        const newEventSystem = new RandomEventSystem(newWorld);

        // Verify defaults
        expect(newWorld.settings.humanHungerRate).not.toBe(0.99);
        expect(newEventSystem.eventChance).toBe(0.005);
        expect(newEventSystem.enabledEvents.has('volcano')).toBe(true);

        // Simulate Import Logic (extracted from BottomPanel)
        const settings = JSON.parse(jsonString);

        if (settings.eventSettings) {
            newEventSystem.setEventChance(settings.eventSettings.chance);
            newEventSystem.enabledEvents = new Set(settings.eventSettings.enabled);
            delete settings.eventSettings;
        }
        Object.assign(newWorld.settings, settings);

        // Verify imported values
        expect(newWorld.settings.humanHungerRate).toBe(0.99);
        expect(newEventSystem.eventChance).toBe(0.02);
        expect(newEventSystem.enabledEvents.has('volcano')).toBe(false);
    });
});
