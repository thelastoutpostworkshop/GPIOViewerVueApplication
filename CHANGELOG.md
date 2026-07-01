# Changelog

## 2.3.0

### Added
- Added automated coverage with Vitest and Playwright for board configuration, board rendering, GPIO store helpers, utility functions, diagnostic views, theme behavior, and mocked ESP32 smoke flows.
- Added a mocked Playwright smoke test for the ESP32 event/API workflow, including GPIO updates, disconnect feedback, dark theme navigation, memory map, ESP info, and plotter navigation.
- Added a persistent light/dark theme system using Vuetify themes and local storage.
- Added first-activity animations for GPIO pins, pin labels, value pills, and progress fills.
- Added a responsive sidebar that stays open on wide screens and remains temporary on compact screens.

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
