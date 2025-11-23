export class GameLoop {
    constructor(onTick) {
        this.onTick = onTick;
        this.lastTime = 0;
        this.running = false;
        this.tickRate = 10; // Ticks per second
        this.accumulatedTime = 0;
        this.animationFrameId = null;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    setTickRate(rate) {
        this.tickRate = rate;
    }

    loop = (currentTime = performance.now()) => {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.accumulatedTime += deltaTime;

        const tickInterval = 1 / this.tickRate;
        let numUpdateSteps = 0;
        while (this.accumulatedTime >= tickInterval) {
            this.onTick();
            this.accumulatedTime -= tickInterval;

            // Safety: Prevent spiral of death
            if (++numUpdateSteps >= 10) {
                console.warn('Game loop falling behind, skipping ticks');
                this.accumulatedTime = 0; // Discard backlog
                break;
            }
        }

        this.animationFrameId = requestAnimationFrame(this.loop);

        // FPS Calculation
        this.frameCount++;
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    };
}
