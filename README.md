# GPIOViewer Web Application

If your are looking for the GPIOViewer Arduino Library, go [here](https://github.com/thelastoutpostworkshop/gpio_viewer).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Waveshare ESP32-P4-Module-DEV-KIT

The board image is a transparent PNG derived from [Waveshare's clean product photo](https://www.waveshare.com/img/devkit/ESP32-P4-Module-DEV-KIT/ESP32-P4-Module-DEV-KIT-1.jpg). It preserves the original board pixels and the 1200×1600 portrait layout, with no added pinout labels. The 40-pin header mapping follows [Waveshare's official pinout](https://docs.waveshare.com/ESP32-P4-Module-DEV-KIT#pinout-definition). Indicators cover the header's 28 ESP32-P4 GPIOs, including I2C GPIO7/8 and UART GPIO37/38; power and ground pins are excluded. Use Generic View (GPIO0–54) for signals used by onboard peripherals that are not on this header, such as Ethernet GPIO50–52.

## Olimex ESP32-P4

The overlay covers all 31 GPIOs on the two visible headers. Per the [Olimex schematic](https://github.com/OLIMEX/ESP32-P4-DevKit/blob/main/HARDWARE/ESP32-P4-DevKit-Rev.B/ESP32-P4-DevKit_Rev_B.pdf), USB1-N and USB1-P are GPIO26 and GPIO27. The upper USB-N/P pins are dedicated USB signals, and the central plated holes are ground connections. GPIOs that are not on these visible headers, including GPIO50–52, can be monitored in Generic View.

## Contributors

Contributors are welcomed! If you want to submit pull requests, [here is how you can do it](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project).

## Project Setup

```sh
npm install
```

### Modify index.html

You need to modify `index.html` to configure your ESP32 ip Address and port:

```javascript
window.gpio_settings = {
  ip: "192.168.1.5",
  port: 8080,
  freeSketchRam: "179 KB",
};
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```
