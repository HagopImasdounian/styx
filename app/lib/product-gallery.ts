type GalleryImage = {url?: string | null};

/** Normalize renditions and the verified duplicate suffix on catalog imports. */
export function galleryImageKey(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'cdn.shopify.com') return url;
    const path = parsed.pathname.replace(
      /(_\d+_(?:keep|shiny))_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z0-9]+)$/i,
      '$1$2',
    );
    return `${parsed.origin}${path}`;
  } catch {
    return url;
  }
}

export function remainingGalleryMedia<
  T extends {image?: GalleryImage | null; previewImage?: GalleryImage | null},
>(media: T[], leadImage?: GalleryImage | null): T[] {
  const seen = new Set(leadImage?.url ? [galleryImageKey(leadImage.url)] : []);
  return media.filter((item) => {
    const url = item.image?.url || item.previewImage?.url;
    if (!url) return false;
    const key = galleryImageKey(url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type GalleryVariant = {
  image?: GalleryImage | null;
  selectedOptions?: Array<{name: string; value: string}>;
};
type ColorMedia = {
  alt?: string | null;
  image?: (GalleryImage & {altText?: string | null}) | null;
  previewImage?: GalleryImage | null;
};
const normalize = (value: string) => value.trim().toLowerCase();
const colorOf = (variant: GalleryVariant) =>
  variant.selectedOptions?.find((option) => normalize(option.name) === 'color')
    ?.value;

/** Blank alt text is unknown, not evidence that a photo suits every finish. */
export function selectedGalleryMedia<T extends ColorMedia>(
  media: T[],
  selected: GalleryVariant,
  variants: GalleryVariant[],
  colors: string[],
): T[] {
  const selectedColor = normalize(colorOf(selected) || '');
  const colorNames = [
    ...new Set(
      [...colors, 'Yellow Gold', 'White Gold', 'Rose Gold'].map(normalize),
    ),
  ];
  const leadKey = selected.image?.url
    ? galleryImageKey(selected.image.url)
    : null;
  const multiColor = new Set(colors.map(normalize)).size > 1;

  return media.filter((item) => {
    const url = item.image?.url || item.previewImage?.url;
    if (!url) return false;
    const key = galleryImageKey(url);
    const alt = normalize(item.alt || item.image?.altText || '');
    const namedColors = colorNames.filter((color) => alt.includes(color));
    // Explicit finish metadata wins over stale cross-color assignments.
    if (selectedColor && namedColors.length)
      return namedColors.includes(selectedColor);
    if (key === leadKey) return true;
    const owners = variants.filter(
      (variant) =>
        variant.image?.url && galleryImageKey(variant.image.url) === key,
    );
    if (owners.length) {
      return owners.some((owner) =>
        selected.selectedOptions?.every((option) =>
          owner.selectedOptions?.some(
            (other) =>
              normalize(other.name) === normalize(option.name) &&
              normalize(other.value) === normalize(option.value),
          ),
        ),
      );
    }
    // Explicitly shared detail/packaging photos can be marked in Shopify alt text.
    return !multiColor || alt.includes('[shared]');
  });
}
