import { Entity } from './Entity';

export class Lava extends Entity {
    constructor(x, y) {
        super(x, y, 'lava', '#ef4444'); // Bright red/orange
        this.lifespan = 50 + Math.random() * 50; // Short lifespan (50-100 ticks)
    }

    tick(world) {
        super.tick(world);

        // Lava doesn't move, but it kills things that touch it (handled on spawn mostly)
        // We can also make it kill things that try to move into it in Entity.js if needed,
        // but for now, the event system handles the initial destruction.

        // Visual decay - darken as it cools?
        if (this.age > this.lifespan * 0.8) {
            this.color = '#7f1d1d'; // Dark red/brown (cooling)
        } else if (this.age > this.lifespan * 0.5) {
            this.color = '#b91c1c'; // Red
        }
    }
}
