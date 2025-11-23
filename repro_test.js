import { World } from './src/engine/World.js';
import { Human } from './src/entities/Human.js';
import { Cow } from './src/entities/Cow.js';
import { CONFIG } from './src/engine/Config.js';

const world = new World(20, 20);
const human = new Human(5, 5);
human.hunger = 50;
const cow = new Cow(6, 5); // Adjacent
world.addEntity(human);
world.addEntity(cow);

// Force high cow count to bypass conservation
world.entityCounts.cow = 100;

console.log('Initial Human Hunger:', human.hunger);
console.log('Cow at:', cow.x, cow.y);
console.log('Human at:', human.x, human.y);
console.log('Can Hunt Cow?', world.entityCounts.cow >= CONFIG.ECOSYSTEM.COWS.MIN_THRESHOLD);

// Tick world
world.tick();

console.log('Final Human Hunger:', human.hunger);
console.log('Cow marked for deletion:', cow.markedForDeletion);

if (human.hunger === 0 && cow.markedForDeletion) {
    console.log('SUCCESS');
} else {
    console.log('FAILURE');
}
