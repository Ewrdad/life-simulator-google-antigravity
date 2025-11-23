import { Entity } from './Entity';
import { Wolf } from './Wolf';
import { Cow } from './Cow';
import { CONFIG } from '../engine/Config';

export class NatureReserve extends Entity {
    constructor(x, y, type = 'WOLF') {
        const config = CONFIG.ENTITIES.NATURE_RESERVE.TYPES[type] || CONFIG.ENTITIES.NATURE_RESERVE.TYPES.WOLF;
        super(x, y, 'naturereserve', config.COLOR);
        this.lifespan = CONFIG.ENTITIES.NATURE_RESERVE.LIFESPAN;
        this.spawnedAnimals = 0;
        this.spawnType = config.SPAWN;
        this.maxAnimals = CONFIG.ENTITIES.NATURE_RESERVE.MAX_ANIMALS;
    }

    tick(world) {
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.die(world);
            return;
        }

        // Spawn animals periodically
        if (this.spawnedAnimals < this.maxAnimals && Math.random() < CONFIG.ENTITIES.NATURE_RESERVE.SPAWN_RATE) {
            this.spawnAnimal(world);
        }
    }

    spawnAnimal(world) {
        // Find empty spot nearby
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        const nx = this.x + dx;
        const ny = this.y + dy;

        if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height && !world.getAt(nx, ny)) {
            if (this.spawnType === 'wolf') {
                const wolf = new Wolf(nx, ny);
                wolf.hunger = 0;
                wolf.thirst = 0;
                world.addEntity(wolf);
            } else if (this.spawnType === 'cow') {
                const cow = new Cow(nx, ny);
                cow.hunger = 0;
                cow.thirst = 0;
                world.addEntity(cow);
            }
            this.spawnedAnimals++;
        }
    }
}
