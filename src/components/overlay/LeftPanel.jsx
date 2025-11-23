import React, { useState, useEffect } from 'react';
import { CONFIG } from '../../engine/Config';

const Sparkline = ({ data, color }) => {
    if (!data || data.length < 2) return null;

    const width = 60;
    const height = 20;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const StatRow = ({ label, value, color, history, isWarning }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '0.9rem',
        padding: '4px 8px',
        borderRadius: '4px',
        background: isWarning ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
        border: isWarning ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
        transition: 'all 0.3s ease'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
            <span style={{ color: isWarning ? '#fca5a5' : '#cbd5e1' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkline data={history} color={color} />
            <span style={{ color: '#f1f5f9', fontWeight: 'bold', minWidth: '30px', textAlign: 'right' }}>{value}</span>
        </div>
    </div>
);

const LeftPanel = ({ world, uiTick }) => {
    const [stats, setStats] = useState({});
    const [history, setHistory] = useState({
        human: [],
        wolf: [],
        cow: [],
        tree: [],
        berry: [],
        house: [],
        naturereserve: [],
        totem: []
    });
    const [factionStats, setFactionStats] = useState([]);

    useEffect(() => {
        const updateStats = () => {
            const counts = world.entityCounts;
            setStats({ ...counts });

            setHistory(prevHistory => {
                const newHistory = { ...prevHistory };
                const maxHistory = 20;
                Object.keys(newHistory).forEach(key => {
                    const val = counts[key] || 0;
                    const hist = [...(newHistory[key] || [])];
                    hist.push(val);
                    if (hist.length > maxHistory) hist.shift();
                    newHistory[key] = hist;
                });
                return newHistory;
            });

            // Faction Stats
            if (world.entitiesByType.has('human')) {
                const humans = world.entitiesByType.get('human');
                const factions = {};

                humans.forEach(h => {
                    if (!factions[h.faction]) {
                        factions[h.faction] = {
                            name: h.faction,
                            color: h.color,
                            count: 0,
                            traits: world.getFactionTraits(h.faction)
                        };
                    }
                    factions[h.faction].count++;
                });

                const sortedFactions = Object.values(factions)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3); // Top 3

                setFactionStats(sortedFactions);
            }
        };

        updateStats();
    }, [world, uiTick]);

    // Threshold Checks
    const isHumanWarning = (stats.human || 0) < CONFIG.ENTITIES.HUMAN.SPAWN_THRESHOLD || (stats.human || 0) > CONFIG.ENTITIES.HUMAN.TARGET_POPULATION.MAX;
    const isWolfWarning = (stats.wolf || 0) < CONFIG.ECOSYSTEM.WOLVES.MIN_THRESHOLD || (stats.wolf || 0) > CONFIG.ECOSYSTEM.WOLVES.MAX_THRESHOLD;
    const isCowWarning = (stats.cow || 0) < CONFIG.ECOSYSTEM.COWS.MIN_THRESHOLD || (stats.cow || 0) > CONFIG.ECOSYSTEM.COWS.MAX_THRESHOLD;

    const getTraitSummary = (traits) => {
        if (!traits) return "Unknown";
        // Shorthand: A=Aggression, S=Speed, H=Hunger, V=Vision
        return (
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: '#94a3b8' }}>
                <span title="Aggression">A: {traits.aggression.toFixed(2)}</span>
                <span title="Speed">S: {traits.moveSpeed.toFixed(2)}</span>
                <span title="Hunger Rate">H: {traits.hungerRate.toFixed(2)}</span>
                <span title="Vision">V: {traits.visionRadius.toFixed(2)}</span>
            </div>
        );
    };

    return (
        <div style={{
            width: '250px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid #334155',
            padding: '15px',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>Populations</h2>

            <div>
                <StatRow label="Humans" value={stats.human || 0} color="#38bdf8" history={history.human} isWarning={isHumanWarning} />
                <StatRow label="Wolves" value={stats.wolf || 0} color="#ef4444" history={history.wolf} isWarning={isWolfWarning} />
                <StatRow label="Cows" value={stats.cow || 0} color="#eab308" history={history.cow} isWarning={isCowWarning} />
            </div>

            {factionStats.length > 0 && (
                <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>Dominant Factions</h3>
                    {factionStats.map(f => (
                        <div key={f.name} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ color: f.color, fontWeight: 'bold' }}>{f.name.split('_')[0]}</span>
                                <span style={{ color: '#f1f5f9' }}>{f.count}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {getTraitSummary(f.traits)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>Resources</h3>
                <StatRow label="Trees" value={stats.tree || 0} color="#22c55e" history={history.tree} />
                <StatRow label="Bushes" value={stats.berry || 0} color="#a855f7" history={history.berry} />
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>Structures</h3>
                <StatRow label="Houses" value={stats.house || 0} color="#f97316" history={history.house} />
                <StatRow label="Reserves" value={stats.naturereserve || 0} color="#14b8a6" history={history.naturereserve} />
                <StatRow label="Totems" value={stats.totem || 0} color="#a855f7" history={history.totem} />
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '15px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div style={{ marginBottom: '8px' }}>
                    Made by <a href="https://www.linkedin.com/in/ewrdad/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>Ewrdad</a>
                </div>
                <div style={{ marginBottom: '8px' }}>
                    Developed by <a href="https://deepmind.google/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Google Antigravity</a> and <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Gemini 3 Pro</a>
                </div>
                <div style={{ fontSize: '0.65rem', fontStyle: 'italic', opacity: 0.6 }}>
                    Not endorsed by Google or any external organisation
                </div>
            </div>
        </div>
    );
};

export default LeftPanel;
