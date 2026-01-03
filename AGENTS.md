# Adding New Board Indicators

This repo displays GPIO activity on top of board images. To add a new board image and its indicators, follow the steps below.

## Workflow
1) Add the board image under `public/devboards_images/` (PNG preferred).
2) Create an indicator file under `public/indicators/` for that image.
3) Register the board in `public/boards.json` with the image and indicator paths.
4) Run the app and visually confirm alignment; fine-tune positions and sizes.

## Indicator JSON Structure
- File: `public/indicators/<BoardName>.json`
- Shape:
  - `pins`: array of `{ gpioid, top, left, valueJustify }`
    - `top`/`left` are **percentages** of the image (0-100).
    - `valueJustify`: `-1` = value text to the left, `0` = right, `-2` = vertical bar.
  - `settings`: visual sizing for pins and text.
  - `stats`: placement for system stats.
  - `wifiFeedback`: placement for WiFi icon.

## Placement Tips
- Use an image editor to read pixel coordinates for each GPIO pad center.
- Convert pixels to percent:
  - `top% = (y_px / image_height) * 100`
  - `left% = (x_px / image_width) * 100`
- Start from a similar board’s JSON in `public/indicators/` and adjust.
- Only include GPIO pins (skip GND, 3V3, VBUS, RUN, etc.).

## Checklist
- Image path and JSON path are correct in `public/boards.json`.
- Pins align at multiple zoom levels.
- `settings` sizes do not overlap labels or pads.
- `stats` and `wifiFeedback` are visible and not covering pins.
