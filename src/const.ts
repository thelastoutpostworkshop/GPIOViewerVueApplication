export type PinModeKeys = keyof typeof PinModeValue;

export const PinModeValue = {
    NOT_SET: -1,
    UNAVAILABLE: -2,
    OUTPUT: 3,
    PULLUP: 4,
    INPUT_PULLUP: 5,
    PULLDOWN: 8,
    INPUT_PULLDOWN: 9,
    OPEN_DRAIN: 16,
    OUTPUT_OPEN_DRAIN: 19,
    ANALOG: 192,
} as const;

export const PinModeBroad = {
    OUTPUT: 'O',
    INPUT: 'I',
    UNKNOWN: '-'
} as const

export const PinModeDescription: { [key in PinModeKeys]: string } = {
    NOT_SET: "Not set",
    UNAVAILABLE: "Unavailable",
    OUTPUT: "Output",
    PULLUP: "Pull-up",
    INPUT_PULLUP: "Input with Pull-up",
    PULLDOWN: "Pull-down",
    INPUT_PULLDOWN: "Input with Pull-down",
    OPEN_DRAIN: "Open Drain",
    OUTPUT_OPEN_DRAIN: "Output Open Drain",
    ANALOG: "Analog",
} as const;

export const PinType = {
    Digital: 0,
    PWM: 1,
    Analog: 2,
} as const;

export const PinDisplayTypeShort = {
    Digital: 'D',
    Analog: 'A',
    PMW: 'P'
} as const

export const DigitalValuesDisplay = {
    Low: "Low",
    High: "High"
} as const

export const WifiFeedbackConfigKey = {
    Light:"light",
    Dark:"dark"
} as const

export const PinColors: string[] = ["#00ff00",
    "#1fff00",
    "#3eff00",
    "#5dff00",
    "#7cff00",
    "#9bff00",
    "#baff00",
    "#d9ff00",
    "#f8ff00",
    "#ffff00", // Yellow
    "#ffef00",
    "#ffdf00",
    "#ffcf00",
    "#ffbf00",
    "#ffaf00",
    "#ff9f00",
    "#ff8f00",
    "#ff7f00",
    "#FE5454",
    "#ff0000", // Red
] as const;

export const GraphColors: string[] = [
    "rgb(255, 0, 0)",      // Red
    "rgb(0, 255, 0)",      // Green
    "rgb(0, 0, 255)",      // Blue
    "rgb(75, 192, 192)",   // Cyan-like color
    "rgb(255, 165, 0)",    // Orange
    "rgb(255, 255, 0)",    // Yellow
    "rgb(128, 0, 128)",    // Purple
    "rgb(255, 192, 203)",  // Pink
    "rgb(0, 128, 0)",      // Dark Green
    "rgb(128, 0, 0)",      // Maroon
    "rgb(128, 128, 0)",    // Olive
    "rgb(0, 128, 128)",    // Teal
    "rgb(0, 0, 128)",      // Navy
    "rgb(255, 69, 0)",     // Orange Red
    "rgb(255, 105, 180)",  // Hot Pink
    "rgb(173, 216, 230)",  // Light Blue
    "rgb(240, 230, 140)",  // Khaki
    "rgb(47, 79, 79)",     // Dark Slate Gray
    "rgb(0, 206, 209)",    // Dark Turquoise
    "rgb(148, 0, 211)",    // Dark Violet
    "rgb(255, 20, 147)",   // Deep Pink
    "rgb(0, 191, 255)",    // Deep Sky Blue
    "rgb(105, 105, 105)",  // Dim Gray
    "rgb(30, 144, 255)",   // Dodger Blue
    "rgb(178, 34, 34)",    // Firebrick
    "rgb(34, 139, 34)",    // Forest Green
    "rgb(220, 20, 60)",    // Crimson
    "rgb(218, 165, 32)",   // Golden Rod
    "rgb(189, 183, 107)",  // Dark Khaki
    "rgb(85, 107, 47)",    // Dark Olive Green
    "rgb(255, 140, 0)",    // Dark Orange
    "rgb(153, 50, 204)",   // Dark Orchid
    "rgb(139, 69, 19)",    // Saddle Brown
    "rgb(75, 0, 130)",     // Indigo
    "rgb(255, 215, 0)",    // Gold
    "rgb(240, 128, 128)",  // Light Coral
    "rgb(72, 61, 139)",    // Dark Slate Blue
    "rgb(143, 188, 143)",  // Dark Sea Green
    "rgb(46, 139, 87)",    // Sea Green
    "rgb(32, 178, 170)",   // Light Sea Green
    "rgb(70, 130, 180)",   // Steel Blue
    "rgb(176, 196, 222)",  // Light Steel Blue
    "rgb(106, 90, 205)",   // Slate Blue
    "rgb(123, 104, 238)",  // Medium Slate Blue
    "rgb(0, 250, 154)",    // Medium Spring Green
    "rgb(72, 209, 204)",   // Medium Turquoise
    "rgb(199, 21, 133)",   // Medium Violet Red
    "rgb(25, 25, 112)",    // Midnight Blue
    "rgb(245, 255, 250)",  // Mint Cream
    "rgb(255, 228, 225)",  // Misty Rose
    "rgb(255, 228, 181)"   // Moccasin
];
