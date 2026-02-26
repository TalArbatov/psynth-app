import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/auth.js';

// ── Validation ──

const USERNAME_RE = /^[a-z][a-z0-9_]{1,22}[a-z0-9]$/;
const MIN_PW = 8;

function validateUsername(v: string): string | null {
    if (v.length === 0) return null;
    if (v.length < 3) return 'Must be at least 3 characters';
    if (v.length > 24) return 'Must be 24 characters or fewer';
    if (!/^[a-z]/.test(v)) return 'Must start with a lowercase letter';
    if (/[^a-z0-9_]/.test(v)) return 'Only lowercase letters, digits, and underscores';
    if (/__/.test(v)) return 'No consecutive underscores';
    if (v.endsWith('_')) return 'Cannot end with an underscore';
    if (!USERNAME_RE.test(v)) return 'Invalid username';
    return null;
}

function validatePassword(v: string): string | null {
    if (v.length === 0) return null;
    if (v.length < MIN_PW) return `Must be at least ${MIN_PW} characters`;
    return null;
}

function validateConfirm(pw: string, confirm: string): string | null {
    if (confirm.length === 0) return null;
    if (pw !== confirm) return 'Passwords do not match';
    return null;
}

// ── Helpers ──

type TouchedFields = Record<'email' | 'username' | 'password' | 'confirm', boolean>;

function fieldClass(touched: boolean, error: string | null, value: string): string {
    if (!touched || value.length === 0) return 'start-input';
    return `start-input${error ? ' invalid' : ' valid'}`;
}

// ── Component ──

export function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setLocalUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState<TouchedFields>({
        email: false,
        username: false,
        password: false,
        confirm: false,
    });
    const navigate = useNavigate();
    const { setUsername, setAccountId } = useAuth();

    // Derived validation
    const emailMissing = touched.email && !email.trim();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirm(password, confirm);

    const canSubmit =
        email.trim() !== '' &&
        usernameError === null &&
        username.length > 0 &&
        password.length >= MIN_PW &&
        password === confirm &&
        !submitting;

    function touch(field: keyof TouchedFields) {
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    }

    function handleUsernameChange(raw: string) {
        setLocalUsername(raw.toLowerCase().replace(/\s/g, ''));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Touch everything so errors show on premature submit
        setTouched({ email: true, username: true, password: true, confirm: true });

        if (!canSubmit) return;

        setSubmitting(true);
        setError('');
        try {
            const user = await register(username, email.trim(), password, displayName.trim());
            setUsername(username);
            if (user.id) setAccountId(user.id);
            navigate('/synth');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Registration failed';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="start-page">
            <h1 className="start-title">Tal's Polyphonic Dual Oscillator Synth</h1>
            <div className="start-window">
                <div className="start-tabs">
                    <button className="start-tab active">Register</button>
                </div>
                <form
                    onSubmit={(e) => void handleSubmit(e)}
                    noValidate
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                >
                    {/* Email */}
                    <div className="start-field">
                        <input
                            type="email"
                            className={fieldClass(touched.email, emailMissing ? 'Required' : null, email)}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => touch('email')}
                            autoComplete="email"
                            required
                            aria-describedby="email-hint"
                        />
                        {touched.email && emailMissing && (
                            <span id="email-hint" className="start-field-hint error">Email is required</span>
                        )}
                    </div>

                    {/* Username */}
                    <div className="start-field">
                        <input
                            type="text"
                            className={fieldClass(touched.username, usernameError, username)}
                            placeholder="Username"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            onBlur={() => touch('username')}
                            autoComplete="username"
                            maxLength={24}
                            required
                            aria-describedby="username-hint"
                        />
                        {touched.username && usernameError ? (
                            <span id="username-hint" className="start-field-hint error">{usernameError}</span>
                        ) : !touched.username && username.length === 0 ? (
                            <span className="start-field-hint">Lowercase letters, digits, underscores. 3–24 chars.</span>
                        ) : null}
                    </div>

                    {/* Display Name */}
                    <div className="start-input-row">
                        <input
                            type="text"
                            className="start-input"
                            placeholder="Display Name (optional)"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                            maxLength={50}
                        />
                    </div>

                    {/* Password */}
                    <div className="start-field">
                        <input
                            type="password"
                            className={fieldClass(touched.password, passwordError, password)}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => touch('password')}
                            autoComplete="new-password"
                            required
                            aria-describedby="password-hint"
                        />
                        {touched.password && passwordError && (
                            <span id="password-hint" className="start-field-hint error">{passwordError}</span>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="start-field">
                        <input
                            type="password"
                            className={fieldClass(touched.confirm, confirmError, confirm)}
                            placeholder="Confirm Password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            onBlur={() => touch('confirm')}
                            autoComplete="new-password"
                            required
                            aria-describedby="confirm-hint"
                        />
                        {touched.confirm && confirmError && (
                            <span id="confirm-hint" className="start-field-hint error">{confirmError}</span>
                        )}
                    </div>

                    {/* Server error */}
                    {error && <div className="start-error">{error}</div>}

                    <div className="start-action">
                        <button
                            type="submit"
                            className="start-button"
                            disabled={submitting}
                        >
                            {submitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
                <p className="start-link">Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </div>
    );
}
