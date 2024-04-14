export const PinModeValue = {
    NOT_SET: -1,
    UNAVAILABLE:-2,
    OUTPUT: 3,
    PULLUP: 4,
    INPUT_PULLUP: 5,
    PULLDOWN: 8,
    INPUT_PULLDOWN: 9,
    OPEN_DRAIN: 16,
    OUTPUT_OPEN_DRAIN: 19,
    ANALOG: 192,
} as const;