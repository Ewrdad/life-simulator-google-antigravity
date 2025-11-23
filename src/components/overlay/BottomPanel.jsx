import React, { useState } from 'react';
import { CONFIG } from '../../engine/Config';

const ENTITY_DESCRIPTIONS = {
    HUMAN: "Dominant species. Builds houses, farms, and forms factions. Can wage war or split societies if overpopulated.",
    COW: "Peaceful herbivore. Eats berries and crops. Can be hunted by wolves and humans. Population can explode if unchecked.",
    WOLF: "Apex predator. Hunts cows and humans. Helps control population but can be dangerous in large packs.",
    TREE: "Provides wood for buildings. Grows slowly and spreads seeds. Essential for ecosystem balance.",
    BERRY_BUSH: "Primary food source for cows and early humans. Regrows over time.",
    HOUSE: "Shelter for humans. Increases survival chance and allows for food storage.",
    FARM: "Advanced food source created by humans. Provides steady food supply.",
    NATURE_RESERVE: "Protected area built by humans to conserve endangered species.",
};

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        style={{
            padding: '8px 16px',
            background: active ? '#38bdf8' : 'transparent',
            color: active ? '#0f172a' : '#94a3b8',
            border: 'none',
            borderBottom: active ? '2px solid #0f172a' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
        }}
    >
        {label}
    </button>
);

const Slider = ({ label, value, min, max, step, onChange }) => (
    <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '5px' }}>
            <span>{label}</span>
            <span>{typeof value === 'number' ? value.toFixed(step < 0.1 ? 3 : 1) : value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8' }}
        />
    </div>
);

const BottomPanel = ({ world, gameLoop, eventSystem }) => {
    const [activeTab, setActiveTab] = useState('humans');
    const [, setTick] = useState(0); // Force update

    const updateSetting = (key, value) => {
        Object.assign(world.settings, { [key]: value });
        setTick(t => t + 1);
    };

    const updateTickRate = (value) => {
        if (gameLoop) {
            gameLoop.setTickRate(value);
            updateSetting('tickRate', value);
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset all settings to defaults?')) {
            Object.assign(world.settings, {
                humanHungerRate: CONFIG.ENTITIES.HUMAN.HUNGER_RATE,
                wolfHungerRate: CONFIG.ENTITIES.WOLF.HUNGER_RATE,
                cowHungerRate: CONFIG.ENTITIES.COW.HUNGER_RATE,
                humanDefenseChance: CONFIG.ENTITIES.HUMAN.DEFENSE_CHANCE,
                humanReproductionCost: CONFIG.ENTITIES.HUMAN.REPRODUCTION_COST,
                wolfReproductionCost: CONFIG.ENTITIES.WOLF.REPRODUCTION_COST,
                cowReproductionCost: CONFIG.ENTITIES.COW.REPRODUCTION_COST,
                humanWarChance: CONFIG.ENTITIES.HUMAN.WAR_CHANCE,
                humanSocietalSplitChance: CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.CHANCE,
                wolfHuntThreshold: CONFIG.ENTITIES.WOLF.HUNT_THRESHOLD,
                cowMaxAge: CONFIG.ENTITIES.COW.MAX_AGE,
                berryRegrowth: CONFIG.ENTITIES.RESOURCES.BERRY_REGROWTH,
                tickRate: CONFIG.WORLD.TICK_RATE,
            });
            if (gameLoop) gameLoop.setTickRate(CONFIG.WORLD.TICK_RATE);
            if (eventSystem) eventSystem.reset();
            setTick(t => t + 1);
        }
    };

    const handleExport = () => {
        const exportData = {
            ...world.settings,
            eventSettings: eventSystem ? {
                chance: eventSystem.eventChance,
                enabled: Array.from(eventSystem.enabledEvents)
            } : null
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "life_simulator_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);

                // Extract event settings if present
                if (settings.eventSettings && eventSystem) {
                    if (typeof settings.eventSettings.chance === 'number') {
                        eventSystem.setEventChance(settings.eventSettings.chance);
                    }
                    if (Array.isArray(settings.eventSettings.enabled)) {
                        eventSystem.enabledEvents = new Set(settings.eventSettings.enabled);
                    }
                    delete settings.eventSettings; // Remove from world settings
                }

                Object.assign(world.settings, settings);
                if (settings.tickRate && gameLoop) gameLoop.setTickRate(settings.tickRate);
                setTick(t => t + 1);
                alert('Configuration imported successfully!');
            } catch (err) {
                console.error(err);
                alert('Error parsing JSON');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{
            height: '250px', // Increased height for more content
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #334155', padding: '0 10px' }}>
                <TabButton active={activeTab === 'humans'} onClick={() => setActiveTab('humans')} label="Humans" />
                <TabButton active={activeTab === 'animals'} onClick={() => setActiveTab('animals')} label="Animals" />
                <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="System" />
                <TabButton active={activeTab === 'entities'} onClick={() => setActiveTab('entities')} label="Entities" />
                <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="Events" />
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {activeTab === 'humans' && (
                    <>
                        <Slider
                            label="Hunger Rate"
                            value={world.settings.humanHungerRate}
                            min={0.01} max={0.5} step={0.01}
                            onChange={(v) => updateSetting('humanHungerRate', v)}
                        />
                        <Slider
                            label="Defense Chance"
                            value={world.settings.humanDefenseChance}
                            min={0} max={1} step={0.1}
                            onChange={(v) => updateSetting('humanDefenseChance', v)}
                        />
                        <Slider
                            label="Reproduction Cost (Hunger)"
                            value={world.settings.humanReproductionCost || 20}
                            min={10} max={80} step={5}
                            onChange={(v) => updateSetting('humanReproductionCost', v)}
                        />
                        <Slider
                            label="War Chance"
                            value={world.settings.humanWarChance || 0.05}
                            min={0} max={1} step={0.01}
                            onChange={(v) => updateSetting('humanWarChance', v)}
                        />
                        <Slider
                            label="Societal Split Chance"
                            value={world.settings.humanSocietalSplitChance || 0.01}
                            min={0} max={0.5} step={0.01}
                            onChange={(v) => updateSetting('humanSocietalSplitChance', v)}
                        />
                    </>
                )}

                {activeTab === 'animals' && (
                    <>
                        <Slider
                            label="Wolf Hunger Rate"
                            value={world.settings.wolfHungerRate}
                            min={0.01} max={0.5} step={0.01}
                            onChange={(v) => updateSetting('wolfHungerRate', v)}
                        />
                        <Slider
                            label="Wolf Hunt Threshold"
                            value={world.settings.wolfHuntThreshold || 20}
                            min={0} max={80} step={5}
                            onChange={(v) => updateSetting('wolfHuntThreshold', v)}
                        />
                        <Slider
                            label="Wolf Repro Cost"
                            value={world.settings.wolfReproductionCost || 40}
                            min={10} max={80} step={5}
                            onChange={(v) => updateSetting('wolfReproductionCost', v)}
                        />
                        <Slider
                            label="Cow Hunger Rate"
                            value={world.settings.cowHungerRate || CONFIG.ENTITIES.COW.HUNGER_RATE}
                            min={0.01} max={0.5} step={0.01}
                            onChange={(v) => updateSetting('cowHungerRate', v)}
                        />
                        <Slider
                            label="Cow Repro Cost"
                            value={world.settings.cowReproductionCost || 30}
                            min={10} max={80} step={5}
                            onChange={(v) => updateSetting('cowReproductionCost', v)}
                        />
                    </>
                )}

                {activeTab === 'system' && (
                    <>
                        <Slider
                            label="Tick Rate (Speed)"
                            value={world.settings.tickRate || 10}
                            min={1} max={60} step={1}
                            onChange={updateTickRate}
                        />
                        <Slider
                            label="Berry Regrowth Time"
                            value={world.settings.berryRegrowth || 300}
                            min={50} max={1000} step={50}
                            onChange={(v) => updateSetting('berryRegrowth', v)}
                        />
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '10px' }}>
                            <button onClick={handleReset} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                Reset Defaults
                            </button>
                            <button onClick={handleExport} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                Export JSON
                            </button>
                            <label style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'inline-block' }}>
                                Import JSON
                                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </>
                )}

                {activeTab === 'entities' && (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {Object.entries(ENTITY_DESCRIPTIONS).map(([key, desc]) => (
                            <div key={key} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#38bdf8' }}>{key.replace('_', ' ')}</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'events' && eventSystem && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Slider
                            label="Global Event Chance (per tick)"
                            value={eventSystem.eventChance}
                            min={0} max={0.05} step={0.001}
                            onChange={(v) => {
                                eventSystem.setEventChance(v);
                                setTick(t => t + 1);
                            }}
                        />

                        <h4 style={{ color: '#cbd5e1', marginBottom: '10px', marginTop: '20px' }}>Enabled Events</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                            {eventSystem.allEventTypes.map(type => (
                                <label key={type} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    background: eventSystem.enabledEvents.has(type) ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    border: eventSystem.enabledEvents.has(type) ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={eventSystem.enabledEvents.has(type)}
                                        onChange={() => {
                                            eventSystem.toggleEvent(type);
                                            setTick(t => t + 1);
                                        }}
                                        style={{ accentColor: '#38bdf8' }}
                                    />
                                    <span style={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BottomPanel;
