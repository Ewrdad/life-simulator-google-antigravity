import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AI_STATEMENT } from '../../config/AIStatement';

const AIDisclaimerModal = ({ onClose }) => {
    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999, // High z-index to ensure it's on top
            pointerEvents: 'auto' // Ensure clicks are captured
        }} onClick={onClose}>
            <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '25px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        lineHeight: 1
                    }}
                >
                    &times;
                </button>

                <h2 style={{
                    color: '#38bdf8',
                    marginTop: 0,
                    marginBottom: '20px',
                    borderBottom: '1px solid #334155',
                    paddingBottom: '10px'
                }}>
                    AI Statement & Disclaimer
                </h2>

                <div style={{ color: '#e2e8f0', lineHeight: '1.6' }}>
                    <p style={{ fontStyle: 'italic', color: '#94a3b8', marginBottom: '20px' }}>
                        Author: {AI_STATEMENT.author} | Last Updated: {AI_STATEMENT.lastUpdated}
                    </p>

                    {AI_STATEMENT.statements.map((item, index) => (
                        <div key={index} style={{ marginBottom: '20px' }}>
                            <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '8px' }}>
                                {item.header}
                            </h3>
                            <p style={{ margin: 0, color: '#cbd5e1' }}>
                                {item.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const Inspector = ({ entity, world }) => {
    // Re-renders are driven by parent passing new uiTick prop (even if unused here, it triggers render)

    if (!entity) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                Select an entity to inspect
            </div>
        );
    }

    let traits = null;
    if (entity.traits) {
        traits = entity.traits;
    } else if (entity.type === 'human' && world && world.getFactionTraits) {
        traits = world.getFactionTraits(entity.faction);
    }

    return (
        <div style={{ padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: entity.color,
                    border: '2px solid #fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                }}></div>
                <div>
                    <h3 style={{ margin: 0, color: '#f1f5f9', textTransform: 'capitalize' }}>{entity.type}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {entity.id || 'N/A'}</span>
                    {entity.faction && (
                        <div style={{ fontSize: '0.75rem', color: entity.color, marginTop: '2px' }}>
                            Faction: {entity.faction}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                {entity.hunger !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Hunger</div>
                        <div style={{ color: '#f1f5f9' }}>{Math.round(entity.hunger)}%</div>
                    </div>
                )}
                {entity.thirst !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Thirst</div>
                        <div style={{ color: '#f1f5f9' }}>{Math.round(entity.thirst)}%</div>
                    </div>
                )}
                {entity.age !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Age</div>
                        <div style={{ color: '#f1f5f9' }}>{Math.round(entity.age)}</div>
                    </div>
                )}
                {entity.state && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>State</div>
                        <div style={{ color: '#f1f5f9' }}>{entity.state}</div>
                    </div>
                )}
            </div>

            {traits && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Genetics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '4px' }}>
                            <div style={{ color: '#60a5fa' }}>Speed</div>
                            <div style={{ color: '#e2e8f0' }}>{traits.moveSpeed.toFixed(2)}x</div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px' }}>
                            <div style={{ color: '#f87171' }}>Aggression</div>
                            <div style={{ color: '#e2e8f0' }}>{traits.aggression.toFixed(2)}x</div>
                        </div>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px', borderRadius: '4px' }}>
                            <div style={{ color: '#4ade80' }}>Metabolism</div>
                            <div style={{ color: '#e2e8f0' }}>{traits.hungerRate.toFixed(2)}x</div>
                        </div>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '6px', borderRadius: '4px' }}>
                            <div style={{ color: '#c084fc' }}>Vision</div>
                            <div style={{ color: '#e2e8f0' }}>{traits.visionRadius.toFixed(2)}x</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EventLog = ({ eventSystem, uiTick }) => {
    const [events, setEvents] = useState([]);
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        const updateEvents = () => {
            const allEvents = eventSystem.getRecentEvents();
            if (activeFilter === 'ALL') {
                setEvents(allEvents);
            } else {
                setEvents(allEvents.filter(e => e.category === activeFilter));
            }
        };

        updateEvents();
    }, [eventSystem, activeFilter, uiTick]);

    const categories = ['ALL', 'POPULATION', 'RESOURCE', 'DISASTER', 'SYSTEM'];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderTop: '1px solid #334155' }}>
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0', fontWeight: '600', letterSpacing: '0.5px' }}>EVENT LOG</h3>
                <button
                    onClick={() => eventSystem.triggerRandomEvent()}
                    style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.background = 'rgba(59, 130, 246, 0.3)'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(59, 130, 246, 0.2)'; }}
                >
                    TRIGGER
                </button>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.3)',
                padding: '0 5px',
                borderBottom: '1px solid #334155'
            }}>
                {categories.map(cat => {
                    const isActive = activeFilter === cat;

                    const catColors = {
                        'POPULATION': '#38bdf8',
                        'RESOURCE': '#4ade80',
                        'DISASTER': '#f87171',
                        'SYSTEM': '#a855f7',
                        'ALL': '#94a3b8'
                    };

                    const color = catColors[cat];

                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            style={{
                                flex: 1,
                                background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: 'none',
                                borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                                color: isActive ? color : '#64748b',
                                padding: '10px 4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                fontWeight: isActive ? '600' : '500',
                                transition: 'all 0.2s',
                                minWidth: '50px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat === 'ALL' ? 'ALL' : cat.slice(0, 3)}
                        </button>
                    );
                })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                {events.map((event, index) => {
                    const catColors = {
                        'POPULATION': '#38bdf8',
                        'RESOURCE': '#4ade80',
                        'DISASTER': '#f87171',
                        'SYSTEM': '#a855f7'
                    };
                    const accentColor = catColors[event.category] || '#94a3b8';

                    return (
                        <div key={event.id || index} style={{
                            padding: '12px 15px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: `3px solid ${accentColor}`,
                            background: 'rgba(0,0,0,0.1)',
                            fontSize: '0.85rem',
                            color: '#cbd5e1'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                                <span style={{ color: accentColor, opacity: 0.9, fontWeight: '600' }}>{event.category}</span>
                                <span>Tick {event.tick}</span>
                            </div>
                            <div style={{ lineHeight: '1.4' }}>
                                {event.message}
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        No recent {activeFilter === 'ALL' ? '' : activeFilter.toLowerCase()} events
                    </div>
                )}
            </div>
        </div>
    );
};

const RightPanel = ({ selectedEntity, eventSystem, world, uiTick }) => {
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    return (
        <div style={{
            width: '300px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid #334155',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>Inspector</h2>
            </div>

            <Inspector entity={selectedEntity} world={world} uiTick={uiTick} />

            <EventLog eventSystem={eventSystem} uiTick={uiTick} />

            <div style={{
                padding: '8px',
                borderTop: '1px solid #334155',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <button
                    onClick={() => setShowDisclaimer(true)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.opacity = 1}
                    onMouseLeave={e => e.target.style.opacity = 0.7}
                >
                    AI Statement
                </button>
            </div>

            {showDisclaimer && <AIDisclaimerModal onClose={() => setShowDisclaimer(false)} />}
        </div>
    );
};

export default RightPanel;
