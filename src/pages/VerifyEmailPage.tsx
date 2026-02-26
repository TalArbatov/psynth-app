import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api/identity.js';

type Status = 'loading' | 'success' | 'error' | 'invalid';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<Status>(token ? 'loading' : 'invalid');
    const [errorMsg, setErrorMsg] = useState('');

    // Resend state
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [resendError, setResendError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const calledRef = useRef(false);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!token || calledRef.current) return;
        calledRef.current = true;

        verifyEmail({ token })
            .then(() => setStatus('success'))
            .catch((err) => {
                setStatus('error');
                setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
            });
    }, [token]);

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
        setResending(true);
        setResendMsg('');
        setResendError('');
        try {
            const result = await resendVerification();
            if (result.rateLimited) {
                startCooldown(result.retrySeconds);
                setResendError(`Too many requests. Try again in ${result.retrySeconds}s.`);
            } else {
                setResendMsg('Sent. Check your inbox.');
                startCooldown(60);
            }
        } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            if (status === 401) {
                setResendError('Please log in and resend from Account Settings.');
            } else {
                setResendError(err instanceof Error ? err.message : 'Failed to send');
            }
        } finally {
            setResending(false);
        }
    }

    const resendDisabled = resending || cooldown > 0;
    const cooldownLabel = cooldown > 0
        ? `Resend in 0:${String(cooldown).padStart(2, '0')}`
        : null;

    return (
        <div className="verify-email-page">
            <div className="verify-email-card">
                {status === 'loading' && (
                    <p className="verify-email-status">Verifying&hellip;</p>
                )}

                {status === 'success' && (
                    <>
                        <p className="verify-email-status success">Email verified</p>
                        <button
                            className="settings-btn primary"
                            onClick={() => navigate('/synth')}
                        >
                            Back to Synth
                        </button>
                    </>
                )}

                {status === 'invalid' && (
                    <p className="verify-email-status error-text">Invalid link.</p>
                )}

                {status === 'error' && (
                    <>
                        <p className="verify-email-status error-text">
                            {errorMsg || 'This link is invalid or expired.'}
                        </p>
                        <div style={{ marginTop: 12 }}>
                            <button
                                className="settings-btn primary"
                                disabled={resendDisabled}
                                onClick={() => void handleResend()}
                            >
                                {resending ? 'Sending...' : cooldownLabel ?? 'Send verification email'}
                            </button>
                            {resendMsg && <div className="settings-msg success" style={{ marginTop: 8 }}>{resendMsg}</div>}
                            {resendError && <div className="settings-msg error" style={{ marginTop: 8 }}>{resendError}</div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
