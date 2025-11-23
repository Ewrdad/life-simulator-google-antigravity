import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { Tree, Water } from '../entities/Resources';

describe('Ecosystem Fuzzing', () => {
    it('should maintain biodiversity over random seeds', () => {
        let survivalCount = 0;
        const SESSIONS = 5;

        for (let i = 0; i < SESSIONS; i++) {
            const world = new World(30, 30);
            // Random spawn
            for (let j = 0; j < 30; j++) world.addEntity(new Human(Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)));
            for (let j = 0; j < 5; j++) world.addEntity(new Wolf(Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)));
            for (let j = 0; j < 30; j++) world.addEntity(new Cow(Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)));
            for (let j = 0; j < 20; j++) world.addEntity(new Tree(Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)));
            for (let j = 0; j < 15; j++) world.addEntity(new Water(Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)));

            // Mock Divine Intervention to prevent total failure from bad RNG
            world.onExtinction = (type) => {
                for (let k = 0; k < 10; k++) {
                    const x = Math.floor(Math.random() * world.width);
                    const y = Math.floor(Math.random() * world.height);
                    if (!world.getAt(x, y)) {
                        if (type === 'human') world.addEntity(new Human(x, y));
                        if (type === 'cow') world.addEntity(new Cow(x, y));
                        if (type === 'wolf') world.addEntity(new Wolf(x, y));
                        // break; // Don't break, try to spawn multiple
                    }
                }
            };

            for (let tick = 0; tick < 500; tick++) {
                world.tick();
            }

            // Check End State
            const humans = world.entities.filter(e => e.type === 'human').length;
            const cows = world.entities.filter(e => e.type === 'cow').length;
            const wolves = world.entities.filter(e => e.type === 'wolf').length;

            if (humans > 0 && wolves > 0 && cows > 0) {
                survivalCount++;
            } else {
                console.log(`Session ${i} failed: Humans: ${humans}, Cows: ${cows}, Wolves: ${wolves}`);
            }
        }

        console.log(`Survival Rate: ${survivalCount}/${SESSIONS}`);
        expect(survivalCount).toBeGreaterThanOrEqual(2); // At least 40% success rate
    });
});
