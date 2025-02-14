import { gpioStore } from '@/stores/gpiostore'
import { type Pins } from '@/types/types';
import { PinModeValue, PinModeBroad, type PinModeKeys, PinModeDescription, PinType } from '@/const'

export const themeCookie = 'theme';

export const pinBroadMode = (pintype:number,gpio:number): string => {
    const store = gpioStore();
    let mode: number = 0;
    let modeID: string = PinModeBroad.UNKNOWN
    if (pintype=== PinType.PWM) {
        mode = PinModeValue.OUTPUT
    } else {
        mode = store.getPinModeValue(gpio);
    }
    switch (mode) {
        case PinModeValue.OUTPUT_OPEN_DRAIN:
        case PinModeValue.OUTPUT:
            modeID = PinModeBroad.OUTPUT
            break;
        case PinModeValue.INPUT_PULLDOWN:
        case PinModeValue.INPUT_PULLUP:
            modeID = PinModeBroad.INPUT
            break;
    }
    return modeID
};

export const ValueToKeyMap: { [value: number]: PinModeKeys } = Object.entries(PinModeValue).reduce((acc, [key, value]) => {
    acc[value as number] = key as PinModeKeys;
    return acc;
}, {} as { [value: number]: PinModeKeys });

export function getPinModeDescription(value: number): string | undefined {
    const key = ValueToKeyMap[value];
    return key ? PinModeDescription[key] : undefined;
}

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

export function setCookie(name: string, value: string, days?: number): void {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}