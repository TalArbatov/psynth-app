import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { getMe } from '../../api/identity.js';
import type { AccountInfo } from '../../api/identity.js';

export function SettingsLayout() {
    const { username, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!username) {
            navigate('/login', { replace: true });
            return;
        }

        setLoading(true);
        getMe()
            .then((data) => {
                setAccount(data);
                setError('');
            })
            .catch((err) => {
                if (err?.status === 401) {
                    navigate('/login', { replace: true });
                    return;
                }
                setError(err?.message ?? 'Failed to load account');
            })
            .finally(() => setLoading(false));
    }, [username, authLoading, navigate]);

    if (authLoading || (!username && !error)) return null;

    return (
        <div className="settings-page">
            <div className="settings-topbar">
                <button className="settings-back" onClick={() => navigate('/synth')}>
                    &larr; Back to Synth
                </button>
                <span className="settings-title">Account Settings</span>
            </div>

            <div className="settings-container">
                <nav className="settings-nav" aria-label="Settings navigation">
                    <NavLink
                        to="/settings"
                        end
                        className={({ isActive }) =>
                            `settings-nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        Profile
                    </NavLink>
                    <NavLink
                        to="/settings/security"
                        className={({ isActive }) =>
                            `settings-nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        Security
                    </NavLink>
                    <NavLink
                        to="/settings/preferences"
                        className={({ isActive }) =>
                            `settings-nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        Preferences
                    </NavLink>
                </nav>

                <div className="settings-content">
                    {loading ? (
                        <div className="settings-loading">Loading...</div>
                    ) : error ? (
                        <div className="settings-error">{error}</div>
                    ) : (
                        <Outlet context={{ account, setAccount }} />
                    )}
                </div>
            </div>
        </div>
    );
}
