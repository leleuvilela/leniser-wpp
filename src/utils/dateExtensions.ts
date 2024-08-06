export function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
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
