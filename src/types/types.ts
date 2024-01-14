export interface BoardData {
    name: string;
    css: string;
    image: string;
    pins: string;
  }
  export interface GPIOStates {
    s: number;
    t: number;
    v: number;
  }
  export interface IndicatorPosition {
    gpioid:number;
    top:number;
    left:number
  }