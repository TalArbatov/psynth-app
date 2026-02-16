import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { apiUrl } from '../../config/api';

export function CreateSessionTab() {
    const [step, setStep] = useState<'session' | 'username'>('session');
    const [sessionName, setSessionName] = useState('');
    const [maxUsers, setMaxUsers] = useState(2);
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

    async function handleCreate() {
        if (!sessionName.trim() || !username.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(apiUrl('/session'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: sessionName.trim(), maxUsers }),
            });
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json() as { sessionId?: string };
            if (!data.sessionId) {
                throw new Error('Missing sessionId in response');
            }
            setSession({ sessionId: data.sessionId, username: username.trim() });
            navigate(`/session/${data.sessionId}`);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to create session';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            {step === 'session' ? (
                <>
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
                    <div className="start-labeled-row">
                        <label className="start-label" htmlFor="max-users-allowed">max users allowed:</label>
                        <select
                            id="max-users-allowed"
                            className="start-select"
                            value={maxUsers}
                            onChange={e => setMaxUsers(parseInt(e.target.value, 10))}
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                            <option value={6}>6</option>
                        </select>
                    </div>
                </>
            ) : (
                <div className="start-input-row">
                    <input
                        type="text"
                        className="start-input"
                        placeholder="Enter Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleCreate(); }}
                    />
                </div>
            )}
            {error ? <div className="start-error">{error}</div> : null}
            <div className="start-action">
                <button
                    className="start-button"
                    disabled={step === 'session' ? sessionName.trim().length === 0 : submitting}
                    onClick={step === 'session' ? goToUsername : () => void handleCreate()}
                >
                    {step === 'session' ? 'Next' : 'Create'}
                </button>
            </div>
        </>
    );
}
