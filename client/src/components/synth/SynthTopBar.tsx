import { useCallback, useEffect, useRef, useState } from 'react';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type { PresetSummary } from '../../models/patch.js';
import { KnobControl } from './KnobControl';
import { Modal } from '../Modal';

type SynthTopBarProps = {
    runtime: SynthRuntime | null;
    masterVolume: number;
    setMasterVolume: (v: number) => void;
    presetName: string;
    onPrevPreset: () => void;
    onNextPreset: () => void;
    canPrev: boolean;
    canNext: boolean;
    onSaveAs: (name: string) => Promise<PresetSummary>;
    onNewPreset: () => void;
    onOpenBrowser: () => void;
};

export function SynthTopBar({ runtime, masterVolume, setMasterVolume, presetName, onPrevPreset, onNextPreset, canPrev, canNext, onSaveAs, onNewPreset, onOpenBrowser }: SynthTopBarProps) {
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [savePresetName, setSavePresetName] = useState('');

    const handleSavePreset = useCallback(async () => {
        if (!savePresetName.trim() || saving) return;

        setSaving(true);
        try {
            await onSaveAs(savePresetName.trim());
            setModalOpen(false);
            setSavePresetName('');
            if (runtime) runtime.state.keyboardEnabled = true;
        } catch (err) {
            console.error('Failed to save preset:', err);
        } finally {
            setSaving(false);
        }
    }, [saving, savePresetName, onSaveAs, runtime]);

    return (
        <>
            <div className="synth-topbar">
                <div className="synth-topbar-left">
                    <span className="synth-brand">pSynth</span>
                </div>

                <div className="synth-topbar-center">
                    <button className="preset-arrow preset-arrow-left" aria-label="Previous preset" onClick={onPrevPreset} disabled={!canPrev}>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <PresetNameDisplay name={presetName} onClick={onOpenBrowser} />
                    <button className="preset-arrow preset-arrow-right" aria-label="Next preset" onClick={onNextPreset} disabled={!canNext}>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M4 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className={`preset-save${saving ? ' saving' : ''}`}
                        aria-label="Save preset"
                        onClick={() => {
                            setModalOpen(true);
                            if (runtime) runtime.state.keyboardEnabled = false;
                        }}
                        disabled={saving || !runtime}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M11.5 13H2.5C2.10218 13 1.72064 12.842 1.43934 12.5607C1.15804 12.2794 1 11.8978 1 11.5V2.5C1 2.10218 1.15804 1.72064 1.43934 1.43934C1.72064 1.15804 2.10218 1 2.5 1H9.5L13 4.5V11.5C13 11.8978 12.842 12.2794 12.5607 12.5607C12.2794 12.842 11.8978 13 11.5 13Z"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path d="M10 13V8H4V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 1V4H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className="preset-new"
                        aria-label="New preset"
                        onClick={onNewPreset}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M8 1H3C2.44772 1 2 1.44772 2 2V12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12V5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 6V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M5 8H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="synth-topbar-right">
                    <div className="synth-topbar-master">
                        <label>Vol</label>
                        <KnobControl
                            id="master-volume"
                            min={0}
                            max={1}
                            step={0.01}
                            value={masterVolume}
                            displayValue={masterVolume.toFixed(2)}
                            onValueChange={(value) => {
                                setMasterVolume(value);
                                if (!runtime) return;
                                runtime.state.baseMasterVolume = value;
                                runtime.engine.setMasterVolume(value);
                            }}
                        />
                    </div>
                </div>
            </div>

            <Modal open={modalOpen} onClose={() => {
                setModalOpen(false);
                if (runtime) runtime.state.keyboardEnabled = true;
            }}>
                <input
                    className="start-input"
                    placeholder="Preset name"
                    value={savePresetName}
                    onChange={(e) => setSavePresetName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset(); }}
                    autoFocus
                />
                <button
                    className="start-button"
                    onClick={handleSavePreset}
                    disabled={saving}
                >
                    Save
                </button>
            </Modal>
        </>
    );
}

function PresetNameDisplay({ name, onClick }: { name: string; onClick?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLSpanElement>(null);
    const [scrolling, setScrolling] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;
        const overflow = inner.scrollWidth > container.clientWidth;
        setScrolling(overflow);
        if (overflow) {
            const distance = inner.scrollWidth - container.clientWidth;
            container.style.setProperty('--scroll-distance', `-${distance}px`);
        }
    }, [name]);

    return (
        <div
            ref={containerRef}
            className={`preset-name${scrolling ? ' scrolling' : ''}${onClick ? ' clickable' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            <span ref={innerRef} className="preset-name-inner">{name}</span>
        </div>
    );
}
