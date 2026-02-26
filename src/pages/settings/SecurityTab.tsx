import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    changePassword,
    listSessions,
    revokeSession,
    logoutAll,
    deleteAccount,
    resendVerification,
} from '../../api/identity.js';
import type { AccountInfo, Session } from '../../api/identity.js';

interface SettingsContext {
    account: AccountInfo;
    setAccount: (a: AccountInfo) => void;
}

// ── Change Password ──

function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const mismatch = confirmPassword !== '' && newPassword !== confirmPassword;
    const tooShort = newPassword !== '' && newPassword.length < 8;
    const canSubmit =
        currentPassword !== '' &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword &&
        !submitting;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError('');
        setMessage('');
        try {
            await changePassword({ currentPassword, newPassword });
            setMessage('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="settings-form">
            <div className="settings-field">
                <label htmlFor="sec-current-pw">Current Password</label>
                <input
                    id="sec-current-pw"
                    type="password"
                    className="settings-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
            </div>

            <div className="settings-field">
                <label htmlFor="sec-new-pw">New Password</label>
                <input
                    id="sec-new-pw"
                    type="password"
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                />
                {tooShort && (
                    <span className="settings-hint error">Must be at least 8 characters</span>
                )}
            </div>

            <div className="settings-field">
                <label htmlFor="sec-confirm-pw">Confirm New Password</label>
                <input
                    id="sec-confirm-pw"
                    type="password"
                    className="settings-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                />
                {mismatch && (
                    <span className="settings-hint error">Passwords do not match</span>
                )}
            </div>

            {error && <div className="settings-msg error">{error}</div>}
            {message && <div className="settings-msg success">{message}</div>}

            <div className="settings-actions">
                <button
                    type="submit"
                    className="settings-btn primary"
                    disabled={!canSubmit}
                >
                    {submitting ? 'Changing...' : 'Change Password'}
                </button>
            </div>
        </form>
    );
}

// ── Helpers ──

function simplifyUserAgent(ua: string): string {
    if (!ua) return 'Unknown device';
    if (/mobile|android|iphone|ipad/i.test(ua)) return 'Mobile browser';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/edg/i.test(ua)) return 'Edge';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    return 'Browser';
}

function formatDate(iso: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

// ── Sessions list ──

function SessionsList() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revoking, setRevoking] = useState<string | null>(null);
    const [loggingOutAll, setLoggingOutAll] = useState(false);
    const navigate = useNavigate();

    const fetchSessions = useCallback(() => {
        setLoading(true);
        setError('');
        listSessions()
            .then(setSessions)
            .catch((err) => {
                if (err?.status === 401) {
                    navigate('/login', { replace: true });
                    return;
                }
                setError(err?.message ?? 'Failed to load sessions');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    async function handleRevoke(id: string) {
        setRevoking(id);
        try {
            await revokeSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to revoke session');
        } finally {
            setRevoking(null);
        }
    }

    async function handleLogoutAll() {
        setLoggingOutAll(true);
        try {
            await logoutAll();
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign out');
        } finally {
            setLoggingOutAll(false);
        }
    }

    if (loading) return <div className="settings-loading">Loading sessions...</div>;
    if (error) return <div className="settings-msg error">{error}</div>;

    return (
        <div className="sessions-list">
            {sessions.length === 0 ? (
                <p className="settings-empty">No active sessions found.</p>
            ) : (
                <table className="sessions-table">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>IP</th>
                            <th>Created</th>
                            <th>Last Seen</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr key={s.id} className={s.isCurrent ? 'current' : ''}>
                                <td>
                                    {simplifyUserAgent(s.userAgent)}
                                    {s.isCurrent && (
                                        <span className="sessions-current-badge">current</span>
                                    )}
                                </td>
                                <td>{s.ip || '—'}</td>
                                <td>{formatDate(s.createdAt)}</td>
                                <td>{formatDate(s.lastSeenAt)}</td>
                                <td>
                                    {!s.isCurrent && (
                                        <button
                                            className="settings-btn danger-sm"
                                            disabled={revoking === s.id}
                                            onClick={() => void handleRevoke(s.id)}
                                        >
                                            {revoking === s.id ? '...' : 'Revoke'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="settings-actions" style={{ marginTop: 16 }}>
                <button
                    className="settings-btn danger-outline"
                    disabled={loggingOutAll}
                    onClick={() => void handleLogoutAll()}
                >
                    {loggingOutAll ? 'Signing out...' : 'Sign out of all devices'}
                </button>
            </div>
        </div>
    );
}

// ── Delete Account ──

function DeleteAccountSection() {
    const [confirm, setConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const enabled = confirm === 'DELETE';

    async function handleDelete() {
        if (!enabled) return;
        setDeleting(true);
        setError('');
        try {
            await deleteAccount();
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="settings-danger-zone">
            <h3 className="settings-danger-title">Danger Zone</h3>
            <p className="settings-danger-desc">
                Permanently delete your account and all associated data. This action
                cannot be undone.
            </p>

            <div className="settings-field">
                <label htmlFor="delete-confirm">
                    Type <strong>DELETE</strong> to confirm
                </label>
                <input
                    id="delete-confirm"
                    type="text"
                    className="settings-input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                />
            </div>

            {error && <div className="settings-msg error">{error}</div>}

            <div className="settings-actions">
                <button
                    className="settings-btn danger"
                    disabled={!enabled || deleting}
                    onClick={() => void handleDelete()}
                >
                    {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
            </div>
        </div>
    );
}

// ── Email Verification ──

function EmailVerificationCard() {
    const { account } = useOutletContext<SettingsContext>();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    function startCooldown(seconds: number) {
        setCooldown(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    async function handleResend() {
        setSending(true);
        setError('');
        setSent(false);
        try {
            const result = await resendVerification();
            if (result.rateLimited) {
                startCooldown(result.retrySeconds);
                setError(`Too many requests. Try again in ${result.retrySeconds}s.`);
            } else {
                setSent(true);
                startCooldown(60);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send');
        } finally {
            setSending(false);
        }
    }

    const disabled = sending || cooldown > 0;
    const cooldownLabel = cooldown > 0
        ? `Resend in 0:${String(cooldown).padStart(2, '0')}`
        : null;

    return (
        <div className="verification-card">
            <div className="verification-row">
                <span className="verification-label">Email</span>
                <span className="verification-value">{account.email}</span>
            </div>
            <div className="verification-row">
                <span className="verification-label">Status</span>
                {account.emailVerified ? (
                    <span className="verification-status verified">Verified</span>
                ) : (
                    <span className="verification-status unverified">Not verified</span>
                )}
            </div>
            {account.emailVerified && account.emailVerifiedAt && (
                <div className="verification-row">
                    <span className="verification-label">Verified</span>
                    <span className="verification-value">{formatDate(account.emailVerifiedAt)}</span>
                </div>
            )}

            {!account.emailVerified && (
                <div style={{ marginTop: 12 }}>
                    <button
                        className="settings-btn primary"
                        disabled={disabled}
                        onClick={() => void handleResend()}
                    >
                        {sending ? 'Sending...' : cooldownLabel ?? 'Send verification email'}
                    </button>
                    {sent && <div className="settings-msg success" style={{ marginTop: 8 }}>Sent. Check your inbox.</div>}
                    {error && <div className="settings-msg error" style={{ marginTop: 8 }}>{error}</div>}
                </div>
            )}
        </div>
    );
}

// ── Security Tab ──

export function SecurityTab() {
    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Email Verification</h2>
            <EmailVerificationCard />

            <h2 className="settings-section-title" style={{ marginTop: 40 }}>
                Change Password
            </h2>
            <ChangePasswordForm />

            <h2 className="settings-section-title" style={{ marginTop: 40 }}>
                Active Sessions
            </h2>
            <SessionsList />

            <DeleteAccountSection />
        </div>
    );
}
