export function toDateTimeString(timestamp: number, timezone?: string): string {
    const date = new Date(timestamp);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return timestamp
        ? `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${timezone}`
        : `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function toDateOnlyString(timestamp: number): string {
    const date = new Date(timestamp);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getBRDateNow(): Date {
    return convertTZ(new Date(), 'America/Sao_Paulo');
}

export function convertTZ(date: Date | string, tzString: string): Date {
    return new Date(
        (typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', {
            timeZone: tzString,
        })
    );
}
