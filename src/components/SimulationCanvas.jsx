import React, { useEffect, useRef } from 'react';

const SimulationCanvas = ({ world, width, height, cellSize, onClick, showThoughts, highlightEvents, eventSystem }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const renderLoop = () => {
            // Clear canvas with fade effect for trails
            ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Terrain (Optimized with Offscreen Canvas)
            if (world.terrain) {
                // Initialize offscreen canvas if needed
                if (!canvasRef.current.terrainCanvas ||
                    canvasRef.current.terrainCanvas.width !== width * cellSize ||
                    canvasRef.current.terrainCanvas.height !== height * cellSize) {

                    const offscreen = document.createElement('canvas');
                    offscreen.width = width * cellSize;
                    offscreen.height = height * cellSize;
                    canvasRef.current.terrainCanvas = offscreen;
                    canvasRef.current.terrainCtx = offscreen.getContext('2d');
                    canvasRef.current.lastTerrainUpdate = -1;
                }

                // Update offscreen canvas only if terrain changed (or periodically)
                // We can check world.tickCount, assuming terrain decays/updates on specific ticks
                // Or just update every 10 frames to save perf
                const shouldUpdate = world.tickCount % 10 === 0 && world.tickCount !== canvasRef.current.lastTerrainUpdate;

                if (shouldUpdate || canvasRef.current.lastTerrainUpdate === -1) {
                    const tCtx = canvasRef.current.terrainCtx;
                    tCtx.clearRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
                    tCtx.fillStyle = '#78350f'; // Dirt color (amber-900)

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const wear = world.terrain[y][x];
                            if (wear > 0.1) {
                                tCtx.globalAlpha = Math.min(0.8, wear);
                                tCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                            }
                        }
                    }
                    tCtx.globalAlpha = 1.0;
                    canvasRef.current.lastTerrainUpdate = world.tickCount;
                }

                // Draw the offscreen canvas
                ctx.drawImage(canvasRef.current.terrainCanvas, 0, 0);
            }

            // Draw Grid Lines (Subtle)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= width; x++) {
                ctx.moveTo(x * cellSize, 0);
                ctx.lineTo(x * cellSize, height * cellSize);
            }
            for (let y = 0; y <= height; y++) {
                ctx.moveTo(0, y * cellSize);
                ctx.lineTo(width * cellSize, y * cellSize);
            }
            ctx.stroke();

            // Draw Entities
            world.entities.forEach(entity => {
                entity.draw(ctx, cellSize);

                // Highlight Effect
                if (highlightEvents && eventSystem && eventSystem.recentEffects.has(entity.id)) {
                    const effect = eventSystem.recentEffects.get(entity.id);
                    // Fade out: starts at 0.8, goes to 0
                    const opacity = (effect.life / effect.maxLife) * 0.8;
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.fillRect(entity.x * cellSize, entity.y * cellSize, cellSize, cellSize);
                }
            });

            // Draw Thought Bubbles
            if (showThoughts) {
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                // Iterate active thoughts from ThoughtSystem
                if (world.thoughtSystem && world.thoughtSystem.activeThoughts) {
                    world.thoughtSystem.activeThoughts.forEach(thought => {
                        const x = thought.x * cellSize + cellSize / 2;
                        const y = thought.y * cellSize - 5; // Above position

                        const text = thought.text;
                        const padding = 6;
                        const textWidth = ctx.measureText(text).width;
                        const boxWidth = textWidth + padding * 2;
                        const boxHeight = 20;

                        // Calculate opacity based on life
                        // Fade out in last 20 ticks (2 seconds)
                        let opacity = 1;
                        if (thought.life < 20) {
                            opacity = thought.life / 20;
                        }

                        ctx.globalAlpha = opacity;

                        // Draw Bubble Background
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 1;

                        // Rounded rect
                        ctx.beginPath();
                        ctx.roundRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight, 5);
                        ctx.fill();
                        ctx.stroke();

                        // Little triangle pointer
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x - 4, y - 4);
                        ctx.lineTo(x + 4, y - 4);
                        ctx.fill();
                        ctx.stroke();

                        // Draw Text
                        ctx.fillStyle = '#000';
                        ctx.fillText(text, x, y - 4);

                        ctx.globalAlpha = 1.0; // Reset opacity
                    });
                }
            }

            animationId = requestAnimationFrame(renderLoop);
        };

        animationId = requestAnimationFrame(renderLoop);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [world, width, height, cellSize, showThoughts, highlightEvents, eventSystem]);

    const handleClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        onClick(x, y);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width * cellSize}
            height={height * cellSize}
            onClick={handleClick}
            style={{
                display: 'block',
                cursor: 'crosshair'
            }}
        />
    );
};

export default SimulationCanvas;
