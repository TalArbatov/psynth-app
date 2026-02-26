import { useState } from 'react';
import { themes, applyTheme, activeTheme } from '../../modules/theme.js';
import type { ThemeDefinition } from '../../modules/theme.js';

const SWATCH_KEYS = ['bgBase', 'bgSurface', 'accent', 'signal'] as const;

function currentThemeId(): string {
    return localStorage.getItem('psynth-theme') || 'midnight';
}

export function PreferencesTab() {
    const [selected, setSelected] = useState(currentThemeId);

    function handlePick(theme: ThemeDefinition) {
        applyTheme(theme);
        setSelected(theme.id);
    }

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Preferences</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handlePick(theme)}
                        style={{
                            background: theme.colors.bgSurface,
                            border: selected === theme.id
                                ? `2px solid ${activeTheme.accent}`
                                : `2px solid ${theme.colors.border}`,
                            borderRadius: 8,
                            padding: 12,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.15s',
                        }}
                    >
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: theme.colors.textPrimary,
                            marginBottom: 8,
                            letterSpacing: 0.5,
                        }}>
                            {theme.name}
                        </div>
                        <div style={{ display: 'flex', gap: 3, borderRadius: 4, overflow: 'hidden' }}>
                            {SWATCH_KEYS.map((key) => (
                                <div
                                    key={key}
                                    style={{
                                        flex: 1,
                                        height: 16,
                                        background: theme.colors[key],
                                    }}
                                />
                            ))}
                        </div>
                        {selected === theme.id && (
                            <div style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: 1,
                                textTransform: 'uppercase' as const,
                                color: activeTheme.accent,
                                marginTop: 6,
                            }}>
                                Active
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
