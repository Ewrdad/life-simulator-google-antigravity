export class Entity {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.id = Math.random().toString(36).substr(2, 9);
        this.age = 0;
        this.lifespan = 1000 + Math.random() * 500; // Random lifespan
        this.markedForDeletion = false;
        this.displayX = x;
        this.displayY = y;
    }

    tick(world) {
        this.age++;
        if (this.age > this.lifespan) {
            this.die(world);
        }
    }

    die(world) {
        this.markedForDeletion = true;
        world.removeEntity(this);
    }

    draw(ctx, cellSize) {
        // Lerp display coordinates
        this.displayX += (this.x - this.displayX) * 0.2;
        this.displayY += (this.y - this.displayY) * 0.2;

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Draw circle instead of rect for smoother look? Or rounded rect.
        // Let's stick to rect but maybe slightly smaller than cell for grid effect
        const size = cellSize * 0.8;
        const offset = (cellSize - size) / 2;

        ctx.fillRect(
            this.displayX * cellSize + offset,
            this.displayY * cellSize + offset,
            size,
            size
        );

        ctx.shadowBlur = 0; // Reset
    }

    moveTowards(targetX, targetY, world) {
        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);
        this.move(dx, dy, world);
    }

    move(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (newX >= 0 && newX < world.width && newY >= 0 && newY < world.height) {
            // Check collision
            const target = world.getAt(newX, newY);
            if (!target) {
                // Leave a trail on the OLD position
                if (world.updateTerrain && this.type === 'human') {
                    world.updateTerrain(this.x, this.y, 0.02);
                }

                // Empty spot, move normally
                this.updateGridPosition(newX, newY, world);
            } else {
                // Blocked! Try to jump over.
                const jumpX = this.x + dx * 2;
                const jumpY = this.y + dy * 2;

                if (jumpX >= 0 && jumpX < world.width && jumpY >= 0 && jumpY < world.height) {
                    const jumpTarget = world.getAt(jumpX, jumpY);
                    if (!jumpTarget) {
                        // Leave a trail on the OLD position
                        if (world.updateTerrain && this.type === 'human') {
                            world.updateTerrain(this.x, this.y, 0.02);
                        }

                        // Jump!
                        this.updateGridPosition(jumpX, jumpY, world);
                    }
                }
            }
        }
    }

    updateGridPosition(newX, newY, world) {
        if (world.grid[this.y][this.x] === this) {
            world.grid[this.y][this.x] = null;
        }
        this.x = newX;
        this.y = newY;
        world.grid[this.y][this.x] = this;
    }
}
