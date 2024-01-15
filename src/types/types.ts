export interface BoardData {
  name: string;
  css: string;
  image: string;
  pins: string;
  chipname: string;
}
export interface PinStates {
  s: number;
  t: number;
  v: number;
}
export interface GPIOStates {
  pinStates:PinStates[];
}
export interface PinsSettings {
  pinWidth: number;
  pinHeight: number;
}
export interface PinsPositions {
  gpioid: number;
  top: number;
  left: number;
}
export interface PinsDefinition {
  pins: PinsPositions[];
  settings: PinsSettings;
}