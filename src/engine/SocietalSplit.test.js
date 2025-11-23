import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { CONFIG } from './Config';

describe('Societal Split', () => {
    let world;

    beforeEach(() => {
        world = new World(20, 20);
        // Force split chance to 100% for testing
        CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.CHANCE = 1.0;
        CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.THRESHOLD = 6;
    });

    it('should split into new faction when overcrowded', () => {
        const center = new Human(10, 10);
        center.faction = 'RED';
        center.color = '#ef4444';
        world.addEntity(center);

        // Add 7 neighbors (threshold is 6)
        const neighbors = [];
        for (let i = 0; i < 7; i++) {
            // Place around center
            const nx = 10 + (i % 3) - 1;
            const ny = 10 + Math.floor(i / 3) - 1;
            if (nx === 10 && ny === 10) continue; // Skip center

            const neighbor = new Human(nx, ny);
            neighbor.faction = 'RED';
            neighbor.color = '#ef4444';
            world.addEntity(neighbor);
            neighbors.push(neighbor);
        }

        // Tick center
        center.trySocietalSplit(world);

        // Check if faction changed
        expect(center.faction).not.toBe('RED');
        expect(center.color).not.toBe('#ef4444');

        // Check if neighbors converted
        neighbors.forEach(n => {
            expect(n.faction).toBe(center.faction);
            expect(n.color).toBe(center.color);
        });
    });

    it('should NOT split if not overcrowded', () => {
        const center = new Human(10, 10);
        center.faction = 'RED';
        world.addEntity(center);

        // Add only 2 neighbors
        const n1 = new Human(11, 10); n1.faction = 'RED'; world.addEntity(n1);
        const n2 = new Human(9, 10); n2.faction = 'RED'; world.addEntity(n2);

        center.trySocietalSplit(world);

        expect(center.faction).toBe('RED');
    });
});
