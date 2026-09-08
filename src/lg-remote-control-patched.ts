import "./lg-remote-control";

const REMOTE_TAG = "lg-remote-control";
const RemoteControl = customElements.get(REMOTE_TAG) as any;

if (RemoteControl && !RemoteControl.__imageActionPatchApplied) {
    const originalGetIcon = RemoteControl.getIcon.bind(RemoteControl);
    const originalSelectSource = RemoteControl.prototype._select_source;
    const originalSetConfig = RemoteControl.prototype.setConfig;
    const baseFirstUpdated = Object.getPrototypeOf(RemoteControl.prototype)?.firstUpdated;

    // Accept arbitrary image URLs/paths anywhere the source button `icon` field is used.
    // Examples: /local/tv-logos/nbc10.png, https://example.com/logo.png, data:image/...
    RemoteControl.getIcon = function(iconName: any) {
        const isImage = typeof iconName === "string" && (
            iconName.startsWith("/") ||
            iconName.startsWith("http://") ||
            iconName.startsWith("https://") ||
            iconName.startsWith("data:image/")
        );

        if (isImage) {
            const image = document.createElement("img");
            image.src = iconName;
            image.alt = "";
            image.style.width = "82%";
            image.style.height = "82%";
            image.style.objectFit = "contain";
            image.style.display = "block";
            image.style.margin = "auto";
            image.style.pointerEvents = "none";
            return image;
        }

        return originalGetIcon(iconName);
    };

    // Allow the friendlier `image:` property as an alias for `icon:`.
    RemoteControl.prototype.setConfig = function(config: any) {
        if (Array.isArray(config?.sources)) {
            config = {
                ...config,
                sources: config.sources.map((source: any) =>
                    source?.image && !source?.icon
                        ? { ...source, icon: source.image }
                        : source
                ),
            };
        }
        return originalSetConfig.call(this, config);
    };

    // Preserve normal source selection, but let an individual source-grid button
    // call any Home Assistant service instead. This makes the existing four-column
    // source grid usable for scripts such as DIRECTV channel favorites.
    RemoteControl.prototype._select_source = function(sourceName: string) {
        const buttonConfig = Array.isArray(this.config?.sources)
            ? this.config.sources.find((source: any) => source?.name === sourceName)
            : undefined;

        if (buttonConfig?.service) {
            const [domain, service] = String(buttonConfig.service).split(".", 2);
            if (!domain || !service) {
                console.error(`LG WebOS Remote Control: invalid service '${buttonConfig.service}'`);
                return;
            }

            this.hass.callService(domain, service, buttonConfig.data ?? {});
            return;
        }

        return originalSelectSource.call(this, sourceName);
    };

    // Replace the upstream press-and-hold volume implementation with deterministic
    // single-click controls. Upstream starts a repeating setInterval after a hold
    // and only clears it on mouseup/touchend. A missed release event can therefore
    // leave volume_up or volume_down running indefinitely. The custom fork does not
    // use a timer/interval for volume at all: one completed click equals one HA call.
    // This intentionally disables hold-to-repeat for BOTH volume directions.
    RemoteControl.prototype.firstUpdated = function(changedProperties: any) {
        // Preserve Lit's base lifecycle hook without invoking the upstream
        // firstUpdated(), because that method installs the unsafe long-press timers.
        if (typeof baseFirstUpdated === "function") {
            baseFirstUpdated.call(this, changedProperties);
        }

        const plusButton = this.shadowRoot?.querySelector("#plusButton");
        const minusButton = this.shadowRoot?.querySelector("#minusButton");

        const updateValue = (service: "volume_up" | "volume_down") => {
            if (isNaN(this.volume_value)) {
                return;
            }

            this._show_vol_text = true;
            this.callServiceFromConfig(service.toUpperCase(), `media_player.${service}`, {
                entity_id: this.output_entity,
            });

            if (this.valueDisplayTimeout) {
                clearTimeout(this.valueDisplayTimeout);
            }
            this.valueDisplayTimeout = setTimeout(() => {
                this._show_vol_text = false;
                this.requestUpdate();
            }, 500);
            this.requestUpdate();
        };

        plusButton?.addEventListener("click", () => updateValue("volume_up"));
        minusButton?.addEventListener("click", () => updateValue("volume_down"));
    };

    RemoteControl.__imageActionPatchApplied = true;
}
