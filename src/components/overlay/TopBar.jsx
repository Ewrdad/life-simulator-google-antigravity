import React, { useState, useEffect } from 'react';

const TopBar = ({ world, gameLoop, onReset, panelState, togglePanel, showThoughts, setShowThoughts, highlightEvents, setHighlightEvents }) => {
    const [fps, setFps] = useState(0);
    const [tickCount, setTickCount] = useState(0);
    const [totalEntities, setTotalEntities] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setFps(Math.round(gameLoop.fps));
            setTickCount(world.tickCount);
            setTotalEntities(world.entities.length);
            setIsPlaying(gameLoop.running);
            // 1x = 10 TPS, 2x = 20 TPS, 5x = 50 TPS
            const currentRate = gameLoop.tickRate;
            if (currentRate >= 50) setSpeed(5);
            else if (currentRate >= 20) setSpeed(2);
            else setSpeed(1);
        }, 100);
        return () => clearInterval(interval);
    }, [world, gameLoop]);

    const handleSpeedChange = (newSpeed) => {
        let rate = 10; // 10 TPS
        if (newSpeed === 2) rate = 20;
        if (newSpeed === 5) rate = 50;
        gameLoop.setTickRate(rate);
        setSpeed(newSpeed);
    };

    const togglePlay = () => {
        if (isPlaying) {
            gameLoop.stop();
        } else {
            gameLoop.start();
        }
        setIsPlaying(!isPlaying);
    };

    const btnStyle = (active) => ({
        background: active ? '#38bdf8' : 'rgba(30, 41, 59, 0.8)',
        color: active ? '#0f172a' : '#e2e8f0',
        border: '1px solid #475569',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        transition: 'all 0.2s'
    });

    const toggleBtnStyle = (active) => ({
        ...btnStyle(active),
        minWidth: '30px',
        textAlign: 'center'
    });

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #334155',
            color: '#e2e8f0',
            height: '50px',
            boxSizing: 'border-box',
            pointerEvents: 'auto'
        }}>
            {/* Left: Title & Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>Life Sim</h1>

                {/* Panel Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderRight: '1px solid #475569', paddingRight: '15px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginRight: '5px', textTransform: 'uppercase' }}>Panels</span>
                    <button style={toggleBtnStyle(panelState.left)} onClick={() => togglePanel('left')} title="Toggle Left Panel">L</button>
                    <button style={toggleBtnStyle(panelState.right)} onClick={() => togglePanel('right')} title="Toggle Right Panel">R</button>
                    <button style={toggleBtnStyle(panelState.bottom)} onClick={() => togglePanel('bottom')} title="Toggle Bottom Panel">B</button>
                </div>

                {/* View Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginRight: '5px', textTransform: 'uppercase' }}>View</span>
                    <button style={toggleBtnStyle(showThoughts)} onClick={() => setShowThoughts(!showThoughts)} title="Toggle Thoughts">💭</button>
                    <button style={toggleBtnStyle(highlightEvents)} onClick={() => setHighlightEvents(!highlightEvents)} title="Highlight Events">👁️</button>
                </div>
            </div>

            {/* Center: Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={onReset} style={{ ...btnStyle(false), color: '#ef4444', borderColor: '#ef4444' }}>Reset</button>
                <div style={{ width: '1px', height: '20px', background: '#475569' }}></div>
                <button onClick={togglePlay} style={btnStyle(isPlaying)}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <div style={{ display: 'flex', gap: '2px', background: 'rgba(30, 41, 59, 0.5)', padding: '2px', borderRadius: '4px' }}>
                    <button onClick={() => handleSpeedChange(1)} style={btnStyle(speed === 1)}>1x</button>
                    <button onClick={() => handleSpeedChange(2)} style={btnStyle(speed === 2)}>2x</button>
                    <button onClick={() => handleSpeedChange(5)} style={btnStyle(speed === 5)}>5x</button>
                </div>
            </div>

            {/* Right: Global Stats */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
                <div>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{fps}</span> FPS
                </div>
                <div>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{tickCount}</span> Ticks
                </div>
                <div>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{totalEntities}</span> Entities
                </div>
            </div>
        </div >
    );
};

export default TopBar;
