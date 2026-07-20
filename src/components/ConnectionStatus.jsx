import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useSocketStore } from '../store/useSocketStore';

// Don't flash a banner for the sub-second drops socket.io recovers from on its
// own — only surface a disconnect the user would actually notice.
const GRACE_MS = 1500;

/**
 * A quiet "Reconnecting…" bar shown while the socket is down.
 *
 * Without it, a dropped connection is invisible: sends buffer or time out and
 * incoming messages simply stop, with no explanation. On reconnect,
 * SocketManager refetches the open thread (the server does not replay missed
 * messages), so the banner disappearing genuinely means "you're up to date".
 */
export default function ConnectionStatus() {
    const socket = useSocketStore(state => state.socket);
    const connected = useSocketStore(state => state.connected);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // No socket yet (pre-login / initializing) is not a disconnect.
        if (!socket || connected) return;

        const timer = setTimeout(() => setVisible(true), GRACE_MS);
        // Hiding happens in cleanup — it runs on reconnect (and on unmount),
        // which keeps the effect body free of synchronous setState.
        return () => { clearTimeout(timer); setVisible(false); };
    }, [socket, connected]);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            data-testid="connection-status"
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium border-b border-amber-500/25"
        >
            <WifiOff size={13} className="animate-pulse" />
            <span>Reconnecting… messages will send once you're back online.</span>
        </div>
    );
}
