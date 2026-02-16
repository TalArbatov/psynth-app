import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { apiUrl } from '../../config/api';

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
            const res = await fetch(apiUrl(`/session?name=${encodeURIComponent(sessionName.trim())}`));
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Session not found');
                }
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json() as { sessionId?: string };
            if (!data.sessionId) {
                throw new Error('Missing sessionId in response');
            }
            setSession({ sessionId: data.sessionId, username: username.trim() });
            navigate(`/session/${data.sessionId}`);
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
