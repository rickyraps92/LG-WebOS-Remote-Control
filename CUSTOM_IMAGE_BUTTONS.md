# Custom fork handoff

This file documents the changes made in this fork, the exact Home Assistant setup currently using it, and the maintenance steps needed to change or repair it later.

## Repository and HACS install

Repository:

```text
rickyraps92/LG-WebOS-Remote-Control-Custom
```

Default branch:

```text
master
```

HACS category:

```text
Dashboard
```

HACS manifest:

```json
{
  "name": "LG WebOS Remote Control Custom",
  "filename": "lg-webos-remote-control-custom.js",
  "render_readme": true
}
```

Installed frontend resource:

```text
/hacsfiles/LG-WebOS-Remote-Control-Custom/lg-webos-remote-control-custom.js
```

The upstream card and this fork use the same custom element name, `lg-remote-control`. Do not load both JavaScript resources at the same time.

The original upstream HACS repository can remain downloaded as a fallback. To revert, remove the custom resource and restore:

```text
/hacsfiles/LG-WebOS-Remote-Control/lg-remote-control.js
```

as a JavaScript module, then hard-refresh the browser.

HACS requires GitHub repositories to remain public. A private GitHub repository cannot be used by HACS. Official reference: https://www.hacs.xyz/docs/faq/private_repositories/

## What this fork changes

The upstream implementation remains in `src/lg-remote-control.ts`.

The fork entry point is:

```text
src/lg-remote-control-patched.ts
```

It imports the upstream card and monkey-patches three behaviors without renaming the custom card.

### 1. Image URLs on source-grid buttons

`LgRemoteControl.getIcon()` is wrapped so these values render as `<img>` elements:

```text
/local/...
http://...
https://...
data:image/...
```

Current image rendering settings in `src/lg-remote-control-patched.ts`:

```text
width: 82%
height: 82%
object-fit: contain
```

Normal MDI and built-in icons continue through the original `getIcon()` implementation.

### 2. `image:` alias for `icon:`

`setConfig()` maps:

```yaml
image: /local/tv-logos/example.png
```

to the upstream card's existing `icon:` field internally.

This allows source entries to use either normal icons or local PNG files.

### 3. Per-button Home Assistant service calls

`_select_source()` is wrapped so a source-grid button can call a Home Assistant service instead of selecting a TV source.

Example:

```yaml
- name: CNN
  image: /local/tv-logos/cnn.png
  service: script.directv_favorite_channel
  data:
    down_count: 4
```

If `service:` is absent, the original source-selection behavior is preserved.

## Build path

Rollup entry point:

```text
src/lg-remote-control-patched.ts
```

Rollup output:

```text
dist/lg-webos-remote-control-custom.js
```

Build commands:

```bash
npm install
npm run build
```

The `package.json` version-replacement step also targets:

```text
dist/lg-webos-remote-control-custom.js
```

The GitHub Actions build workflow runs on pushes and pull requests. On a push it builds and commits the current HACS bundle when the generated file changes.

## Home Assistant entities and exact source names

Television media-player entity:

```text
media_player.living_room_living_room_television
```

Wake-on-LAN button entity:

```text
button.living_room_living_room_television_wol
```

Exact DIRECTV source name:

```text
DIRECTV Live TV + Streaming
```

Current source names used by the remote card:

```text
DIRECTV Live TV + Streaming
HBO Max
Hulu
Apple TV
YouTube
XBOX Game Console
Netflix
Disney+
```

The source names must match the values exposed by the LG media player's `source_list` attribute.

## Local image files

Home Assistant filesystem directory:

```text
/config/www/tv-logos/
```

Frontend path:

```text
/local/tv-logos/
```

Current PNG filenames:

```text
directv.png
hbo.png
hulu.png
nbc10.png
boston25.png
cnn.png
msnow.png
```

The custom monochrome word/number icons use:

```text
foreground: #f4f4f5
transparent background
512 x 512 PNG
```

The remote button background is:

```text
#65707a
```

The visible artwork should occupy most of the PNG canvas. Large transparent margins make the logo unreadable at the source-grid button size.

Home Assistant/browser image caching can be bypassed by changing only the URL query string:

```yaml
image: /local/tv-logos/hulu.png?v=2
```

Increment the number after replacing a PNG while keeping the same filename.

## Current remote-card configuration

The source grid is four columns. The first two rows are apps/sources and the third row is DIRECTV favorites.

```yaml
type: custom:lg-remote-control
entity: media_player.living_room_living_room_television

sources:
  # Row 1
  - name: DIRECTV Live TV + Streaming
    image: /local/tv-logos/directv.png

  - name: HBO Max
    image: /local/tv-logos/hbo.png

  - name: Hulu
    image: /local/tv-logos/hulu.png

  - name: Apple TV
    icon: mdi:apple

  # Row 2
  - name: YouTube
    icon: mdi:youtube

  - name: XBOX Game Console
    icon: mdi:microsoft-xbox

  - name: Netflix
    icon: mdi:netflix

  - name: Disney+
    icon: disney

  # Row 3: DIRECTV favorites
  - name: NBC 10 Boston
    image: /local/tv-logos/nbc10.png
    service: script.directv_favorite_channel
    data:
      down_count: 2

  - name: Boston 25 News
    image: /local/tv-logos/boston25.png
    service: script.directv_favorite_channel
    data:
      down_count: 3

  - name: CNN
    image: /local/tv-logos/cnn.png
    service: script.directv_favorite_channel
    data:
      down_count: 4

  - name: MSNOW
    image: /local/tv-logos/msnow.png
    service: script.directv_favorite_channel
    data:
      down_count: 8

colors:
  background: "#3a3d42"
  buttons: "#65707a"
  text: "#f4f4f5"
  border: "#777d84"
```

## DIRECTV channel control

Numeric remote buttons do not directly tune channels inside the native DIRECTV app. Channel favorites therefore use deterministic guide navigation.

The tested normalization/navigation sequence is:

```text
DOWN
wait 3.0 s
LEFT
wait 0.5 s
DOWN
wait 0.5 s
ENTER
wait 2.5 s
repeat DOWN for the guide offset, waiting 0.5 s after each DOWN
ENTER
```

Starting from DIRECTV Live TV, the initial `DOWN` returns to Home. Starting from DIRECTV Home, it does not disrupt the sequence. `LEFT`, `DOWN`, `ENTER` then opens the guide at the first channel-by-number position.

### Tested DIRECTV guide offsets

| Channel | DIRECTV number | `down_count` |
| --- | ---: | ---: |
| WCVB | 5 | 0 |
| WMUR | 9 | 1 |
| NBC 10 Boston | 10 | 2 |
| Boston 25 / WFXT | 25 | 3 |
| CNN | 202 | 4 |
| MSNOW | 356 | 8 |
| Fox News | 360 | 9 |

To add or change a favorite, determine its number of `DOWN` presses from the first guide entry and use that number as `down_count`.

## `script.directv_favorite_channel`

Current tested script:

```yaml
alias: DIRECTV Favorite Channel

fields:
  down_count:
    name: Guide offset
    required: true
    selector:
      number:
        min: 0
        max: 20
        step: 1
        mode: box

sequence:
  - action: webostv.button
    data:
      entity_id: media_player.living_room_living_room_television
      button: DOWN

  - delay: "00:00:03.000"

  - action: webostv.button
    data:
      entity_id: media_player.living_room_living_room_television
      button: LEFT

  - delay: "00:00:00.500"

  - action: webostv.button
    data:
      entity_id: media_player.living_room_living_room_television
      button: DOWN

  - delay: "00:00:00.500"

  - action: webostv.button
    data:
      entity_id: media_player.living_room_living_room_television
      button: ENTER

  - delay: "00:00:02.500"

  - repeat:
      count: "{{ down_count | int }}"
      sequence:
        - action: webostv.button
          data:
            entity_id: media_player.living_room_living_room_television
            button: DOWN
        - delay: "00:00:00.500"

  - action: webostv.button
    data:
      entity_id: media_player.living_room_living_room_television
      button: ENTER

mode: restart
```

These timings are the tested reliable values for this TV and DIRECTV app state.

## NBC Nightly News automation

Current tested automation behavior:

```text
Monday-Friday at 6:29:30 PM
wake TV
wait for LG media player to become responsive
force mute
select DIRECTV
wait for DIRECTV source
allow app to settle
run NBC 10 favorite
leave TV muted
```

Current YAML:

```yaml
alias: NBC Nightly News
description: Wake TV, mute, open DIRECTV, and tune NBC 10.

trigger:
  - platform: time
    at: "18:29:30"

condition:
  - condition: time
    weekday:
      - mon
      - tue
      - wed
      - thu
      - fri

action:
  - action: button.press
    target:
      entity_id: button.living_room_living_room_television_wol

  - wait_template: >
      {{ states('media_player.living_room_living_room_television')
         not in ['off', 'unavailable', 'unknown'] }}
    timeout: "00:00:20"
    continue_on_timeout: false

  - delay: "00:00:01.000"

  - action: media_player.volume_mute
    target:
      entity_id: media_player.living_room_living_room_television
    data:
      is_volume_muted: true

  - action: media_player.select_source
    target:
      entity_id: media_player.living_room_living_room_television
    data:
      source: DIRECTV Live TV + Streaming

  - wait_template: >
      {{ state_attr(
          'media_player.living_room_living_room_television',
          'source'
         ) == 'DIRECTV Live TV + Streaming' }}
    timeout: "00:00:15"
    continue_on_timeout: true

  - delay: "00:00:06.000"

  - action: script.directv_favorite_channel
    data:
      down_count: 2

mode: single
```

The mute action intentionally uses `is_volume_muted: true`. It is not a toggle. The automation intentionally contains no unmute action.

## Maintenance and troubleshooting

### Change an image

Replace the PNG in:

```text
/config/www/tv-logos/
```

Keep the filename stable and increment `?v=N` in the dashboard YAML when a browser continues showing the cached version.

### Change image size inside a source button

Edit these values in `src/lg-remote-control-patched.ts`:

```ts
image.style.width = "82%";
image.style.height = "82%";
```

Rebuild after changing the patch.

### Add another scripted source-grid button

Use:

```yaml
- name: Button Label
  image: /local/tv-logos/example.png
  service: domain.service
  data:
    key: value
```

The patch passes `data:` directly to `hass.callService()`.

### Return a button to normal LG source selection

Remove `service:` and `data:`. The card then calls the original `_select_source()` behavior using the button's `name:`.

### Custom images disappear but the buttons remain

Check, in order:

1. The image opens directly at `/local/tv-logos/<filename>.png`.
2. The filename case matches exactly.
3. The custom HACS JavaScript resource is loaded.
4. The upstream JavaScript resource is not loaded at the same time.
5. Add or increment `?v=N` to bypass browser image caching.

### Custom card changes do not appear after a repository update

Verify the active resource is:

```text
/hacsfiles/LG-WebOS-Remote-Control-Custom/lg-webos-remote-control-custom.js
```

Then hard-refresh the browser. The original HACS repository may remain installed, but its JavaScript resource must not be active simultaneously.

### DIRECTV favorite lands on the wrong channel

Open the DIRECTV guide using the same normalized navigation sequence, count the `DOWN` presses from the first channel entry to the desired channel, and update `down_count`.

### DIRECTV UI becomes too slow for the script

The delays are all in `script.directv_favorite_channel`. Increase only the delay immediately before the failing navigation step and retest from both DIRECTV Home and Live TV.

## Public-repository data boundary

This repository currently contains Home Assistant entity IDs, local source names, local station/channel information, and dashboard configuration. Those values do not provide authentication to Home Assistant.

Do not commit any of the following:

```text
Home Assistant access tokens
GitHub tokens
passwords
Wi-Fi credentials
MAC addresses
public/external Home Assistant URLs
public IP addresses
Tailscale IP addresses
secrets.yaml contents
API keys
```

The repository must remain public while it is installed and updated through HACS.
