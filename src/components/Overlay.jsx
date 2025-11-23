import React, { useState } from 'react';
import TopBar from './overlay/TopBar';
import LeftPanel from './overlay/LeftPanel';
import RightPanel from './overlay/RightPanel';
import BottomPanel from './overlay/BottomPanel';

const Overlay = ({ world, gameLoop, onReset, selectedEntity, eventSystem, showThoughts, setShowThoughts, highlightEvents, setHighlightEvents, uiTick }) => {
    const [panelState, setPanelState] = useState({
        left: true,
        right: true,
        bottom: false
    });

    const togglePanel = (panel) => {
        setPanelState(prev => ({
            ...prev,
            [panel]: !prev[panel]
        }));
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Allow clicks to pass through to canvas
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Top Bar - Always visible */}
            <div style={{ pointerEvents: 'auto' }}>
                <TopBar
                    world={world}
                    gameLoop={gameLoop}
                    onReset={onReset}
                    panelState={panelState}
                    togglePanel={togglePanel}
                    showThoughts={showThoughts}
                    setShowThoughts={setShowThoughts}
                    highlightEvents={highlightEvents}
                    setHighlightEvents={setHighlightEvents}
                />
            </div>

            {/* Middle Section (Left, Center, Right) */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Left Panel */}
                <div style={{
                    width: panelState.left ? 'auto' : '0',
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    transition: 'width 0.3s ease'
                }}>
                    <LeftPanel world={world} uiTick={uiTick} />
                </div>

                {/* Center (Transparent) */}
                <div style={{ flex: 1 }}></div>

                {/* Right Panel */}
                <div style={{
                    width: panelState.right ? 'auto' : '0',
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    transition: 'width 0.3s ease'
                }}>
                    <RightPanel selectedEntity={selectedEntity} eventSystem={eventSystem} world={world} uiTick={uiTick} />
                </div>
            </div>

            {/* Bottom Panel */}
            <div style={{
                height: panelState.bottom ? 'auto' : '0',
                overflow: 'hidden',
                pointerEvents: 'auto',
                transition: 'height 0.3s ease'
            }}>
                <BottomPanel world={world} gameLoop={gameLoop} eventSystem={eventSystem} />
            </div>
        </div>
    );
};

export default Overlay;
