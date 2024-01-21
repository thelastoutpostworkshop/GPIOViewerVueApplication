import { ref, computed } from 'vue';
import { gpioStore } from '@/stores/gpiostore'


export function getAPIUrl(api: string): string {
    const store = gpioStore();
    const url = `http://${store.ipAddress}:${store.httpPort}/${api}`;
    return url;
}

export function formatBytes(bytes: number | undefined): string {
    if (bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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
            (chipId >> 40) & 0xFF,
            (chipId >> 32) & 0xFF,
            (chipId >> 24) & 0xFF,
            (chipId >> 16) & 0xFF,
            (chipId >> 8) & 0xFF,
            chipId & 0xFF
        ];
        let macAddress = macBytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
        return macAddress;
    }
    return "unknown";
}