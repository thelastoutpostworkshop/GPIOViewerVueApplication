//Boards types
export interface BoardData {
  name: string;
  css: string;
  image: string;
  pins: string;
  chipname: string;
}

//Pins configuration for the board
export interface PinsSettings {
  pinWidth: number;
  pinHeight: number;
}
export interface PinsPositions {
  gpioid: number;
  top: number;
  left: number;
  color:string;
  value:number;
}
export interface PinsConfiguration {
  pins: PinsPositions[];
  settings: PinsSettings;
}

// Pins state sent by GPIOViewer Library
export interface PinState {
  s: number;
  t: number;
  v: number;
}
export type PinStateMap = {
  [gpio: number]: PinState;
}