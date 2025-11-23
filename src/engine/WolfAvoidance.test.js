import { describe, it, expect } from 'vitest';
import { World } from './World';
import { Wolf } from '../entities/Wolf';
import { House } from '../entities/Resources';
import { Cow } from '../entities/Cow';

describe('Wolf Avoidance', () => {
    it('should run away from houses', () => {
        const world = new World(20, 20);

        // Place a house at (10, 10)
        const house = new House(10, 10);
        world.addEntity(house);

        // Place a wolf at (11, 10) - right next to it
        const wolf = new Wolf(11, 10);
        world.addEntity(wolf);

        // Tick the wolf
        wolf.tick(world);

        // Wolf should move away from (10, 10)
        // Since it was at (11, 10), it should move to (12, 10) or similar, 
        // definitely NOT (10, 10) or (9, 10)

        expect(wolf.x).not.toBe(10); // Shouldn't be on the house
        expect(wolf.x).toBeGreaterThan(10); // Should be further right

        // Let's check distance increased or stayed same (if blocked, but here it's open)
        const distBefore = Math.abs(11 - 10) + Math.abs(10 - 10);
        const distAfter = Math.abs(wolf.x - 10) + Math.abs(wolf.y - 10);

        expect(distAfter).toBeGreaterThanOrEqual(distBefore);
    });

    it('should detect houses within range', () => {
        const world = new World(20, 20);
        const house = new House(10, 10);
        world.addEntity(house);

        const wolf = new Wolf(15, 15); // Distance 5 diag
        world.addEntity(wolf);

        // Force hunger low so it doesn't hunt
        wolf.hunger = 0;

        // It should detect house (range 8) and try to move away
        // Vector from house to wolf is (5, 5)
        // Should move +1, +1 roughly

        const oldX = wolf.x;
        const oldY = wolf.y;

        wolf.tick(world);

        // Should move further away
        expect(wolf.x).toBeGreaterThanOrEqual(oldX);
        expect(wolf.y).toBeGreaterThanOrEqual(oldY);
    });

    it('should ignore houses if starving', () => {
        const world = new World(20, 20);
        const house = new House(10, 10);
        world.addEntity(house);

        // Wolf right next to house
        const wolf = new Wolf(11, 10);
        wolf.hunger = 80; // Starving!
        world.addEntity(wolf);

        // It should NOT flee. 
        // Since there is no prey, it will wander.
        // Wander is random, but avoidBuildings is deterministic (moves away).
        // If it avoids, it moves to 12, 10.
        // If it wanders, it moves to 10,10 or 11,11 or 11,9 or 12,10 etc.
        // But crucially, avoidBuildings returns TRUE if it acts.
        // We can spy on avoidBuildings or check position.

        // Let's place a prey on the OTHER side of the house to force it to cross?
        // Or simpler: Place prey AT the house location (e.g. human inside/near).
        // If it avoids, it runs away. If it hunts, it moves closer.

        // const human = new House(9, 10); // Wait, House isn't prey.
        // Let's just check it doesn't call avoidBuildings logic.
        // We can't easily spy without mocks.

        // Let's rely on movement.
        // If we place prey at (10, 10) (same as house), and wolf at (12, 10).
        // Avoidance pushes to (13, 10).
        // Hunting pushes to (11, 10).

        // Remove the house we added first to avoid collision logic issues
        world.removeEntity(house);
        const house2 = new House(10, 10);
        world.addEntity(house2);

        // Add prey at same spot (allowed? maybe not, let's put it at 9, 10)
        // Wolf at 11, 10.
        // House at 10, 10.
        // Prey at 9, 10.

        // Wolf (11, 10) -> House (10, 10) -> Prey (9, 10)
        // If avoiding: Move away from House -> (12, 10)
        // If hunting: Move towards Prey -> (10, 10) (blocked by house?) or (11, 9)/(11, 11) to go around

        // Actually, let's just check the method result if possible? No.

        // Let's use the behavior:
        // If starving, it calls hunt(). hunt() finds prey.
        // If we put prey nearby, it should move towards it, even if a house is there.

        // Wolf at (15, 15). House at (14, 15). Prey at (13, 15).
        // Avoidance: (16, 15).
        // Hunting: (14, 15) (blocked) or (15, 14)/(15, 16).

        // Let's try a simpler check.
        // Wolf at (10, 10). House at (12, 10).
        // Avoidance: Move to (9, 10).
        // Starving + No Prey: Wander.
        // Wander might go to (11, 10) (towards house).
        // If avoidance was active, it would NEVER go to (11, 10).

        // But wander is random.

        // Let's use the prey attraction.
        // Wolf (10, 10). House (11, 10). Prey (12, 10).
        // Avoidance: Move to (9, 10).
        // Hunting: Move to (11, 10) (blocked) -> stay or move sideways.
        // If it moves to (11, 11) or (11, 9) it's getting closer to house.

        // Let's just trust the logic change:
        // if (hunger > 70) hunt()
        // hunt() moves towards prey.

        // Test:
        // Wolf at 10, 10.
        // Prey at 12, 10.
        // House at 11, 10.
        // Wolf should move to 11, 11 or 11, 9 to get around house to prey, 
        // OR just try to move to 11, 10 and get blocked.
        // Crucially, it should NOT move to 9, 10.

        // Let's set up:
        // Wolf (10, 10)
        // House (9, 10) - Left of wolf
        // Prey (8, 10) - Left of house

        // If avoiding: Wolf moves Right (11, 10).
        // If hunting: Wolf moves Left (9, 10) -> Blocked by house?
        // If blocked, it might stay or move Y.

        // Let's make it clear.
        // Wolf (10, 10)
        // House (10, 12) - Below
        // Prey (10, 13) - Below House

        // Avoidance: Move Up (10, 9)
        // Hunting: Move Down (10, 11)

        const wolf2 = new Wolf(10, 10);
        wolf2.hunger = 80;
        world.addEntity(wolf2);

        const house3 = new House(10, 12);
        world.addEntity(house3);

        // We need a prey that doesn't move for the test to be stable?
        // Cow moves. But we can force it.
        // Or just use a "cow" mock if we could.
        // Let's just add a Cow.
        const cow = new Cow(10, 13);
        world.addEntity(cow);

        wolf2.tick(world);

        // If it moved DOWN (y increased), it hunted.
        // If it moved UP (y decreased), it avoided.

        expect(wolf2.y).toBeGreaterThan(10);
    });
});
