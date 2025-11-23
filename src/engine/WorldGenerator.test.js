import { describe, it, expect, beforeEach } from 'vitest';
import { World } from './World';
import { WorldGenerator } from './WorldGenerator';
import { CONFIG } from './Config';

describe('WorldGenerator', () => {
    let world;
    let generator;

    beforeEach(() => {
        world = new World(100, 100);
        generator = new WorldGenerator(world);
    });

    it('should generate terrain with forests and lakes', () => {
        generator.generateTerrain();

        let trees = 0;
        let water = 0;

        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const ent = world.getAt(x, y);
                if (ent) {
                    if (ent.type === 'tree') trees++;
                    if (ent.type === 'water') water++;
                }
            }
        }

        expect(trees).toBeGreaterThan(0);
        expect(water).toBeGreaterThan(0);
    });

    it('should generate rivers', () => {
        // Force some rivers
        CONFIG.WORLD_GEN.RIVER_COUNT = 5;
        generator.generateRivers();

        let water = 0;
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const ent = world.getAt(x, y);
                if (ent && ent.type === 'water') water++;
            }
        }

        expect(water).toBeGreaterThan(0);
    });

    it('should ensure connectivity', () => {
        // Create a scenario with disconnected islands (hard to force with noise, but we can try)
        // Just run the function and ensure it doesn't crash and maybe logs something
        generator.generate();

        // Check if we can reach most land cells from a random land cell
        const landCells = [];
        for (let y = 0; y < world.height; y++) {
            for (let x = 0; x < world.width; x++) {
                const ent = world.getAt(x, y);
                if (!ent || ent.type !== 'water') {
                    landCells.push(`${x},${y}`);
                }
            }
        }

        if (landCells.length === 0) return; // All water? Unlikely.

        if (landCells.length === 0) return;

        const visitedGlobal = new Set();
        let maxComponentSize = 0;

        for (const cell of landCells) {
            if (visitedGlobal.has(cell)) continue;

            const start = cell.split(',').map(Number);
            const queue = [start];
            const componentVisited = new Set();
            componentVisited.add(cell);
            visitedGlobal.add(cell);

            let size = 0;

            while (queue.length > 0) {
                const [cx, cy] = queue.pop();
                size++;

                const neighbors = [
                    [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
                        const key = `${nx},${ny}`;
                        if (!componentVisited.has(key)) {
                            const ent = world.getAt(nx, ny);
                            if (!ent || ent.type !== 'water') {
                                componentVisited.add(key);
                                visitedGlobal.add(key);
                                queue.push([nx, ny]);
                            }
                        }
                    }
                }
            }
            if (size > maxComponentSize) maxComponentSize = size;
        }

        const connectivity = maxComponentSize / landCells.length;
        console.log(`Connectivity: ${connectivity * 100}%`);
        expect(connectivity).toBeGreaterThan(0.8);
    });
});
