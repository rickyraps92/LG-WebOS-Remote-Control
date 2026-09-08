# Volume button safety patch

## Problem

The upstream remote card implements volume up/down with press-and-hold repeat inside `firstUpdated()` in `src/lg-remote-control.ts`.

For each volume direction, the upstream code:

1. starts a hold timer on `mousedown` / `touchstart`;
2. starts a repeating `setInterval()` after the hold threshold;
3. clears that interval only on `mouseup` / `touchend`.

If the release event is missed, the interval can continue calling `media_player.volume_up` or `media_player.volume_down` indefinitely. This can happen even during ordinary tapping if the release event is not delivered to the button element.

Both directions had the same failure mode. Volume down used a 400 ms hold threshold; volume up used 500 ms. The repeating interval was 100 ms for the TV entity or 250 ms when controlling the configured amplifier entity.

## Custom fix

The custom fork disables hold-to-repeat for both volume directions.

The patch is implemented in:

```text
src/lg-remote-control-patched.ts
```

The patched module overrides `LgRemoteControl.prototype.firstUpdated` after importing the upstream class. It intentionally does not call the upstream `firstUpdated()`, because that is where the unsafe long-press timers are installed.

Instead it adds one `click` listener to each existing volume button:

```text
#plusButton  -> one media_player.volume_up call
#minusButton -> one media_player.volume_down call
```

One completed click/tap now equals exactly one Home Assistant volume service call. There is no volume `setTimeout`/`setInterval` repeat mechanism left in the active custom card.

The existing `callServiceFromConfig()` path is preserved, so configured `VOLUME_UP` / `VOLUME_DOWN` key overrides and amplifier routing continue to work.

The temporary volume-value display is also preserved: a click sets `_show_vol_text`, updates the display, then hides it after 500 ms.

## Resulting behavior

- Tap `+` once: one volume-up command.
- Tap `-` once: one volume-down command.
- Repeated taps: one command per tap.
- Holding either button does not auto-repeat.
- A lost mouse/touch release event cannot create a runaway volume interval because no interval is created.

## Maintenance note

Do not re-enable or call the upstream `firstUpdated()` from `src/lg-remote-control-patched.ts` unless the upstream volume implementation has first been replaced with a safe implementation.

If a future upstream merge changes the volume button element IDs, update the custom selectors in the patch:

```text
#plusButton
#minusButton
```

The HACS bundle is built from `src/lg-remote-control-patched.ts` into:

```text
dist/lg-webos-remote-control-custom.js
```

GitHub Actions rebuilds the HACS bundle after pushes to the repository.
