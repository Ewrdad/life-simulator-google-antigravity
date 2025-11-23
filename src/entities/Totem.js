import { Entity } from './Entity';
import { CONFIG } from '../engine/Config';

export class Totem extends Entity {
    constructor(x, y, faction, color) {
        super(x, y, 'totem', color);
        this.faction = faction;
        this.lifespan = CONFIG.ENTITIES.TOTEM.LIFESPAN;
    }

    draw(ctx, cellSize) {
        // Draw a distinct shape (e.g., a diamond or a smaller rect with a border)
        this.displayX += (this.x - this.displayX) * 0.2;
        this.displayY += (this.y - this.displayY) * 0.2;

        const size = cellSize * 0.6;
        // const offset = (cellSize - size) / 2;

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Diamond shape
        ctx.beginPath();
        const cx = this.displayX * cellSize + cellSize / 2;
        const cy = this.displayY * cellSize + cellSize / 2;

        ctx.moveTo(cx, cy - size); // Top
        ctx.lineTo(cx + size, cy); // Right
        ctx.lineTo(cx, cy + size); // Bottom
        ctx.lineTo(cx - size, cy); // Left
        ctx.closePath();

        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}
