export function optimizeImageUrl(url, options = {}) {
  if (!url) return '';

  const {width = 1200, quality = 80, format = 'webp'} = options;
  const hasParams = url.includes('?');
  const separator = hasParams ? '&' : '?';

  return `${url}${separator}w=${width}&q=${quality}&fm=${format}&fit=max`;
}

export const imagePresets = {
  carousel: {width: 800, quality: 85, format: 'webp'},
  hero: {width: 2000, quality: 85, format: 'webp'},
  background: {width: 2000, quality: 75, format: 'webp'},
  thumbnail: {width: 400, quality: 80, format: 'webp'},
  menu: {width: 600, quality: 85, format: 'webp'},
  location: {width: 1000, quality: 80, format: 'webp'},
};
