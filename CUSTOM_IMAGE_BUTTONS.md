# Custom image and action buttons

This fork extends the existing `sources:` grid without changing the upstream behavior for ordinary source buttons.

## Local Home Assistant images

Files placed in `/config/www/tv-logos/` are available to the frontend under `/local/tv-logos/`.

Current local PNG filenames for this setup:

```text
hulu.png
hbo.png
cnn.png
boston25.png
nbc10.png
msnow.png
directv.png
```

Home Assistant runs on Linux, so image paths are case-sensitive.

A source button can use a local Home Assistant image or a normal web image. `image:` is accepted as an alias for `icon:`.

## Ready-to-use source grid

The first two rows are apps/sources. The third row is four DIRECTV channel favorites.

```yaml
sources:
  # Row 1: apps
  - name: Netflix
    icon: mdi:netflix

  - name: Disney+
    icon: disney

  - name: YouTube
    icon: mdi:youtube

  - name: Prime Video
    icon: amazon

  # Row 2: apps/sources
  - name: Hulu
    image: /local/tv-logos/hulu.png

  - name: HBO Max
    image: /local/tv-logos/hbo.png

  - name: DIRECTV Live TV + Streaming
    image: /local/tv-logos/directv.png

  - name: XBOX Game Console
    icon: mdi:microsoft-xbox

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
```

The exact LG source names above match this TV's Home Assistant `source_list`: `Netflix`, `Disney+`, `YouTube`, `Prime Video`, `Hulu`, `HBO Max`, `DIRECTV Live TV + Streaming`, and `XBOX Game Console`.

The channel offsets are the tested DIRECTV guide offsets used by `script.directv_favorite_channel`: NBC 10 = 2, Boston 25/WFXT = 3, CNN = 4, and MSNOW = 8.

If `service:` is omitted, the original behavior is preserved and the button calls `media_player.select_source` with its `name:`.

Because the upstream source grid uses four columns, the 12 entries above render as exactly three rows of four buttons.
