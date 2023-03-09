// Hex code to HSL value
export const hexToHsl = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0,
    s: number,
    l: number = (max + min) / 2;

  // Calculate the HSL values
  if (diff === 0) {
    h = s = 0;
  } else {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

// Darken HSL color by a percentage
export const darkenHslColor = (hslColor: string, percent: number) => {
  const [h, s, l] = hslColor.split(' ').map((val) => parseInt(val.replace('%', '')));

  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    throw new Error(`Invalid HSL color: ${hslColor}`);
  }

  // Calculate the new lightness value
  const newL = (l * (100 - percent)) / 100;

  return `${h} ${s}% ${newL}%`;
};
