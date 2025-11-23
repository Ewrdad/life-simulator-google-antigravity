import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { Tree, BerryBush, Water } from '../entities/Resources';

describe('Long Run Stability', () => {
    it('should run for 1000 ticks without crashing or exploding', () => {
        const world = new World(50, 50);
        // Initial population
        for (let i = 0; i < 50; i++) world.addEntity(new Human(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 50; i++) world.addEntity(new Wolf(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 50; i++) world.addEntity(new Cow(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        // Add some resources too, otherwise everything will die quickly
        for (let i = 0; i < 50; i++) world.addEntity(new Tree(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        for (let i = 0; i < 20; i++) world.addEntity(new BerryBush(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));
        // Add Water for thirst
        for (let i = 0; i < 10; i++) world.addEntity(new Water(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)));


        for (let i = 0; i < 1000; i++) {
            world.tick();

            // Check for explosion
            if (world.entities.length > 1500) {
                throw new Error(`Population explosion detected: ${world.entities.length} entities at tick ${i}`);
            }

            // Check for total extinction (optional, but good for stability)
            if (world.entities.length === 0) {
                console.warn(`Total extinction at tick ${i}`);
                // Not necessarily a fail, but worth noting
            }
        }

        // Removed 'start' variable as it was not defined and caused an error.
        // console.log(`5000 ticks took ${end - start}ms`); 
        console.log(`Final population: ${world.entities.length}`);

        expect(world.entities.length).toBeLessThan(5000);
    }, 60000); // 60s timeout
});
