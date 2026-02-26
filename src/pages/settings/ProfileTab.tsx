import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    updateMe,
    getAvatarUrl,
    getAvatarUploadUrl,
    confirmAvatar,
} from '../../api/identity.js';
import type { AccountInfo } from '../../api/identity.js';

interface SettingsContext {
    account: AccountInfo;
    setAccount: (a: AccountInfo) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export function ProfileTab() {
    const { account, setAccount } = useOutletContext<SettingsContext>();
    const [displayName, setDisplayName] = useState(account.displayName ?? '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(true);
    const [avatarError, setAvatarError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imgBroken, setImgBroken] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const dirty = displayName !== (account.displayName ?? '');

    // Fetch avatar on mount
    useEffect(() => {
        setAvatarLoading(true);
        getAvatarUrl()
            .then(({ url }) => {
                setAvatarUrl(url);
                setImgBroken(false);
            })
            .catch(() => setAvatarUrl(null))
            .finally(() => setAvatarLoading(false));
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            const updated = await updateMe({ displayName });
            setAccount(updated);
            setDisplayName(updated.displayName ?? '');
            setMessage('Display name updated.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so re-selecting the same file still triggers change
        e.target.value = '';

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setAvatarError('File must be JPEG, PNG, or WebP.');
            return;
        }

        // Validate size
        if (file.size > MAX_SIZE) {
            setAvatarError('File must be under 2 MB.');
            return;
        }

        setAvatarError('');
        setUploading(true);

        try {
            // 1. Get presigned upload URL
            const { key, uploadUrl } = await getAvatarUploadUrl({
                contentType: file.type,
                contentLength: file.size,
            });

            // 2. Upload directly to S3
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!uploadRes.ok) throw new Error('Upload failed');

            // 3. Confirm
            await confirmAvatar({ key });

            // 4. Refresh avatar URL
            const { url } = await getAvatarUrl();
            setAvatarUrl(url);
            setImgBroken(false);
            setAvatarError('');
            setMessage('Profile photo updated.');
        } catch (err) {
            setAvatarError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    const showImg = avatarUrl && !imgBroken;

    const defaultAvatarSvg = `data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#2B2D42"/><stop offset="1" stop-color="#1B1D2E"/>' +
        '</linearGradient></defs>' +
        '<circle cx="128" cy="128" r="120" fill="url(#g)"/>' +
        '<circle cx="128" cy="104" r="44" fill="#E9ECF8" opacity=".92"/>' +
        '<path d="M56 216c12-42 47-64 72-64s60 22 72 64" fill="#E9ECF8" opacity=".92"/>' +
        '<circle cx="128" cy="128" r="120" fill="none" stroke="#FFF" opacity=".08" stroke-width="8"/>' +
        '</svg>'
    )}`;

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Profile</h2>

            {/* Avatar */}
            <div className="avatar-section">
                <div className="avatar-circle">
                    {showImg ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="avatar-img"
                            onError={() => setImgBroken(true)}
                        />
                    ) : (
                        <img
                            src={defaultAvatarSvg}
                            alt="Default avatar"
                            className="avatar-img"
                        />
                    )}
                </div>

                <div className="avatar-controls">
                    <button
                        type="button"
                        className="settings-btn primary"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                    >
                        {uploading ? 'Uploading...' : 'Change photo'}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => void handleFileChange(e)}
                    />
                    <span className="avatar-hint">JPEG, PNG, or WebP. Max 2 MB.</span>
                </div>

                {avatarError && <div className="settings-msg error">{avatarError}</div>}
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="settings-form">
                <div className="settings-field">
                    <label htmlFor="profile-email">Email</label>
                    <input
                        id="profile-email"
                        type="email"
                        className="settings-input"
                        value={account.email}
                        disabled
                        readOnly
                    />
                </div>

                <div className="settings-field">
                    <label htmlFor="profile-username">Username</label>
                    <input
                        id="profile-username"
                        type="text"
                        className="settings-input"
                        value={account.username}
                        disabled
                        readOnly
                    />
                </div>

                <div className="settings-field">
                    <label htmlFor="profile-display-name">Display Name</label>
                    <input
                        id="profile-display-name"
                        type="text"
                        className="settings-input"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display name"
                        maxLength={50}
                    />
                </div>

                {error && <div className="settings-msg error">{error}</div>}
                {message && <div className="settings-msg success">{message}</div>}

                <div className="settings-actions">
                    <button
                        type="submit"
                        className="settings-btn primary"
                        disabled={!dirty || saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}
