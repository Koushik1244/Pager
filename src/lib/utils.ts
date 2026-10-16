// Add this function to your existing utils file
export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const week = Math.floor(day / 7);
    const month = Math.floor(day / 30);
    const year = Math.floor(month / 12);

    if (sec < 60) return `${Math.max(1, min)}m`;
    if (min < 60) return `${Math.max(1, min)}m`;
    if (hr < 24) return `${Math.max(1, hr)}h`;
    if (day < 7) return `${Math.max(1, day)}d`;
    if (month < 12) return `${Math.max(1, month)}mo`;
    return `${Math.max(1, year)}y`;
}
