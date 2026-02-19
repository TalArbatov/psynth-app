import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { findSession } from '../../api/sessions.js';

export function JoinSessionTab() {
    const [step, setStep] = useState<'session' | 'username'>('session');
    const [sessionName, setSessionName] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { setSession } = useSession();

    function goToUsername() {
        if (sessionName.trim().length > 0) {
            setStep('username');
            setError('');
        }
    }

    async function handleJoin() {
        if (!sessionName.trim() || !username.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            const sessionId = await findSession(sessionName.trim());
            setSession({ sessionId, username: username.trim() });
            navigate(`/session/${sessionId}`);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to join session';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            {step === 'session' ? (
                <div className="start-input-row">
                    <input
                        type="text"
                        className="start-input"
                        placeholder="Enter Session Name"
                        value={sessionName}
                        onChange={e => setSessionName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') goToUsername(); }}
                    />
                </div>
            ) : (
                <div className="start-input-row">
                    <input
                        type="text"
                        className="start-input"
                        placeholder="Enter Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleJoin(); }}
                    />
                </div>
            )}
            {error ? <div className="start-error">{error}</div> : null}
            <div className="start-action">
                <button
                    className="start-button"
                    disabled={step === 'session' ? sessionName.trim().length === 0 : submitting}
                    onClick={step === 'session' ? goToUsername : () => void handleJoin()}
                >
                    {step === 'session' ? 'Next' : 'Join'}
                </button>
            </div>
        </>
    );
}
