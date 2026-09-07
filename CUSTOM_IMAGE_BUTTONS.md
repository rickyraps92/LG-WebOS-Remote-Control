# Custom image and action buttons

This fork extends the existing `sources:` grid without changing the upstream behavior for ordinary source buttons.

## Arbitrary images

A source button can use a local Home Assistant image or a normal web image. `image:` is accepted as an alias for `icon:`.

```yaml
sources:
  - name: Netflix
    image: /local/tv-logos/netflix.svg

  - name: Disney+
    image: /local/tv-logos/disney.svg
```

Home Assistant files placed in `/config/www/tv-logos/` are available to the frontend under `/local/tv-logos/`.

## Service/script buttons in the same grid

A source-grid button can call a Home Assistant service instead of selecting a TV source:

```yaml
sources:
  - name: NBC
    image: /local/tv-logos/nbc.svg
    service: script.directv_favorite_channel
    data:
      down_count: 2
```

If `service:` is omitted, the original behavior is preserved and the button calls `media_player.select_source` with its `name:`.

Because the upstream source grid uses four columns, four configured buttons form one row, eight form two rows, and twelve form three rows.
