// Zero-dependency relative/calendar time formatting, built on Intl.
//
// Replaces date-fns (`formatDistanceToNow`), which was the only thing we used
// from that package — it pulled its whole entry chunk into the post-login
// bundle for one function. `Intl.RelativeTimeFormat` is built into every
// browser we support and costs nothing to ship.

// Reused across every bubble/sidebar row — constructing these is the expensive
// part of Intl, so do it once at module scope.
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const dateFormat = new Intl.DateTimeFormat(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
});

// Descending so the first unit the delta clears is the one we render.
const UNITS = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
];

/**
 * "just now" / "5 minutes ago" / "2 days ago".
 * Returns '' for missing or unparseable input (callers render it inline).
 */
export function formatRelativeTime(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    const ms = date.getTime();
    if (Number.isNaN(ms)) return '';

    const seconds = Math.round((ms - Date.now()) / 1000);
    const abs = Math.abs(seconds);

    // Under a minute reads better as a phrase than "in 0 seconds".
    if (abs < 45) return 'just now';

    for (const [unit, unitSeconds] of UNITS) {
        if (abs >= unitSeconds) {
            return relative.format(Math.round(seconds / unitSeconds), unit);
        }
    }
    return 'just now';
}

/** True if both timestamps fall on the same local calendar day. */
export function isSameDay(a, b) {
    const d1 = a instanceof Date ? a : new Date(a);
    const d2 = b instanceof Date ? b : new Date(b);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
    return d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate();
}

/**
 * Label for a date separator in the message list:
 * "Today" / "Yesterday" / "Tuesday" (within the last week) / "March 4, 2026".
 */
export function formatDayDivider(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    if (isSameDay(date, now)) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return 'Yesterday';

    // Compare at day granularity so "6 days ago" doesn't flip to a weekday name
    // based on the time of day.
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysAgo = Math.round((startOfToday - startOfDate) / 86_400_000);
    if (daysAgo > 0 && daysAgo < 7) return weekdayFormat.format(date);

    return dateFormat.format(date);
}
