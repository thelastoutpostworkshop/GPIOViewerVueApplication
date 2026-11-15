# Changelog

## 2.3.5

### Added

- Added M5Stack AtomS3-Lite (C124) with a transparent underside photo, a front-view Grove connector inset, and indicators for all eight exposed GPIOs ([#208](https://github.com/thelastoutpostworkshop/gpio_viewer/issues/208)).

## 2.3.4

### Added

- Added support for optional GPIO labels from the existing `/pinmodes` response ([#207](https://github.com/thelastoutpostworkshop/gpio_viewer/issues/207)).
- Added a **Pin Labels** display mode when device labels are available, keeping GPIO numbers visible and showing labels beside live values.
- Added full labels to pin tooltips and the pin detail dialog, including before GPIO activity is received.

### Changed

- Constrained label callouts to the available screen space; narrow layouts prioritize labels, with full labels and values available in pin details.
- Preserved the original three display modes for devices without labels and accepted both numeric and string GPIO/mode values.

### Notes

- Tasmota integration requires its GPIO Viewer driver to include the optional `label` field in `/pinmodes`. The web app does not call Tasmota's command API.

## 2.3.3

### Added

- Added ESPImageServer to Maker Tools for local AI image and video generation and playback on compatible ESP32 displays.
- Added Waveshare ESP32-P4-Module-DEV-KIT with a transparent board photo and indicators for all 28 GPIOs on its 40-pin header ([#206](https://github.com/thelastoutpostworkshop/gpio_viewer/issues/206)).

### Changed

- Updated runtime and development dependencies, including Vitest 5 and jsdom 31, while keeping TypeScript at 6.0.3.

### Fixed

- Extended Generic View to include GPIO50–54 and adjusted spacing to fit all 55 GPIOs.
- Added missing GPIO26 and GPIO27 indicators (USB1-N/P) to the Olimex ESP32-P4 view, completing coverage of all 31 GPIOs on its visible headers.

## 2.3.2

### Added
- Added ESP Pinout Explorer to Maker Tools.

### Changed
- Updated `npm-run-all2` to v9.0.3.
- Simplified Maker Tools preview cards by removing the play and tool-logo overlays.
- Improved Maker Tools action-button contrast in dark mode.

## 2.3.1

### Added
- New Board : Freenove ESP32-WROVER-CAM

## 2.3.0

### Added
- New Board : FireBeetle 2 ESP32-S3 (N4)
- New Board : ESP32-C6 Super Mini
- Added automated coverage with Vitest and Playwright for board configuration, board rendering, GPIO store helpers, utility functions, diagnostic views, theme behavior, and mocked ESP32 smoke flows.
- Added a mocked Playwright smoke test for the ESP32 event/API workflow, including GPIO updates, disconnect feedback, dark theme navigation, memory map, ESP info, and plotter navigation.
- Added a persistent light/dark theme system using Vuetify themes and local storage.
- Added first-activity animations for GPIO pins, pin labels, value pills, and progress fills.
- Added a responsive sidebar that stays open on wide screens and remains temporary on compact screens.
- Added a digital logic-lane graph mode for GPIO history, with one high/low lane per selected digital pin.

### Changed
- Improved the main board view overlays for readability in light and dark mode.
- Hid inactive pin value overlays until a pin receives activity.
- Preserved original value-fill direction: regular values fill from the left, right-aligned values fill from the right, and vertical values fill from the bottom.
- Updated digital pin value colors so `High` is red and `Low` is green.
- Redesigned the pin detail dialog with a clearer layout, theme-aware styling, function chips, and a value meter.
- Improved ESP32 Information and Memory Map views to use Vuetify theme tokens instead of custom dark-mode branches.
- Improved the Memory Map ESP32 Partition Builder link so it opens the builder with the current partition table and flash size preloaded.
- Moved the theme toggle into the top app bar.
- Derived the displayed web app version from `package.json` instead of hardcoding it.
- Updated dependencies including `@vue/tsconfig`, Vite, Vue Router, Vuetify, and TypeScript.

### Fixed
- Fixed dark theme propagation for routed diagnostic views.
- Fixed the pin detail dialog closing immediately after opening.
- Fixed GPIO `0` pin function lookup in the pin detail dialog.
- Synced `package-lock.json` with the `package.json` version.

### Notes
- The production build still emits the existing large chunk warning.
