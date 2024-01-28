import { ref, computed } from 'vue';
import { gpioStore } from '@/stores/gpiostore'


export function getAPIUrl(api: string): string {
    const store = gpioStore();
    const url = `http://${store.ipAddress}:${store.httpPort}/${api}`;
    return url;
}

export function formatBytes(bytes: number | undefined): string {
    if (bytes !== undefined) {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed()} KB`;
        } else {
            return `${(bytes / 1024 / 1024).toFixed()} MB`;
        }
    }
    return "undefined";
}
export function formatHz(bytes: number | undefined): string {
    if (bytes) {
        if (bytes < 1000) {
            return `${bytes} Hz`;
        } else if (bytes < 1000 * 1024) {
            return `${(bytes / 1000).toFixed(2)} KHz`;
        } else {
            return `${(bytes / 1000 / 1000).toFixed(2)} MHz`;
        }
    }
    return "undefined";
}

export function formatMacAddress(chipId: number | undefined): string {
    if (chipId) {
        let macBytes = [
            chipId & 0xFF,
            (chipId / 0x100) & 0xFF,
            (chipId / 0x10000) & 0xFF,
            (chipId / 0x1000000) & 0xFF,
            (chipId / 0x100000000) & 0xFF,
            (chipId / 0x10000000000) & 0xFF
        ];
        let macAddress = macBytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
        return macAddress;
    }
    return "unknown";
}

export function formatTime(ms: number | undefined): string {
    if (ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
    
        const hoursFormatted = (hours % 24).toString().padStart(2, '0');
        const minutesFormatted = (minutes % 60).toString().padStart(2, '0');
        const secondsFormatted = (seconds % 60).toString().padStart(2, '0');
    
        return `${days}d ${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
    }
    return "unknown";
}