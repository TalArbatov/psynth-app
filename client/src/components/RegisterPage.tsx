import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/auth.js';

export function RegisterPage() {
    const [username, setLocalUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { setUsername, setAccountId } = useAuth();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!username.trim() || !email.trim() || !password) return;

        setSubmitting(true);
        setError('');
        try {
            const user = await register(username.trim(), email.trim(), password);
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
                <form onSubmit={(e) => void handleSubmit(e)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="start-input-row">
                        <input
                            type="email"
                            className="start-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="start-input-row">
                        <input
                            type="text"
                            className="start-input"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setLocalUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="start-input-row">
                        <input
                            type="password"
                            className="start-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>
                    {error ? <div className="start-error">{error}</div> : null}
                    <div className="start-action">
                        <button
                            type="submit"
                            className="start-button"
                            disabled={submitting || !username.trim() || !email.trim() || !password}
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
