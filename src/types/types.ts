export interface BoardData {
  name: string;
  css: string;
  image: string;
  pins: string;
  chipname: string;
}
export interface PinState {
  s: number;
  t: number;
  v: number;
}

export type PinStateMap = {
  [gpio: number]: PinState;
}
export interface PinsSettings {
  pinWidth: number;
  pinHeight: number;
}
export interface PinsPositions {
  gpioid: number;
  top: number;
  left: number;
  color:string;
}
export interface PinsDefinition {
  pins: PinsPositions[];
  settings: PinsSettings;
}