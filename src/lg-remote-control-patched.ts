import "./lg-remote-control";

const REMOTE_TAG = "lg-remote-control";
const RemoteControl = customElements.get(REMOTE_TAG) as any;

if (RemoteControl && !RemoteControl.__imageActionPatchApplied) {
    const originalGetIcon = RemoteControl.getIcon.bind(RemoteControl);
    const originalSelectSource = RemoteControl.prototype._select_source;
    const originalSetConfig = RemoteControl.prototype.setConfig;

    // Accept arbitrary image URLs/paths anywhere the source button `icon` field is used.
    // Examples: /local/tv-logos/nbc.svg, https://example.com/logo.png, data:image/...
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

    RemoteControl.__imageActionPatchApplied = true;
}
