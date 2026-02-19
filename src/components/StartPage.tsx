import { useState } from 'react';
import { CreateSessionTab } from './start/CreateSessionTab';
import { JoinSessionTab } from './start/JoinSessionTab';

type Tab = 'create' | 'join';

export function StartPage() {
    const [tab, setTab] = useState<Tab>('create');

    return (
        <div className="start-page">
            <h1 className="start-title">Tal's Polyphonic Dual Oscillator Synth</h1>
            <div className="start-window">
                <div className="start-tabs">
                    <button
                        className={`start-tab${tab === 'create' ? ' active' : ''}`}
                        onClick={() => setTab('create')}
                    >
                        Create Session
                    </button>
                    <button
                        className={`start-tab${tab === 'join' ? ' active' : ''}`}
                        onClick={() => setTab('join')}
                    >
                        Join Session
                    </button>
                </div>
                {tab === 'create' ? <CreateSessionTab /> : <JoinSessionTab />}
            </div>
        </div>
    );
}
