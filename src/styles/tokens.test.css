import { describe, expect, it } from 'vitest';
import { COLORS } from './tokens';
import css from './tokens.css?raw';

const luminance = (hex: string): number => {
  const channels = hex.slice(1).match(/.{2}/g)!.map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
};
const contrast = (foreground: string, background: string): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
};

describe('visual tokens', () => {
  it('mirrors the spec §8 palette', () => {
    expect(COLORS.canvas).toBe('#F7F6F2');
    expect(COLORS.ink).toBe('#202A27');
    expect(COLORS.evergreen).toBe('#254D43');
    expect(COLORS.sage).toBe('#A5A798');
    expect(COLORS.butter).toBe('#D9B96B');
    expect(COLORS.terracotta).toBe('#B85C45');
    expect(COLORS.surface).toBe('#FFFFFF');
    expect(COLORS.border).toBe('#E4E2DB');
  });

  it('keeps tokens.css in sync with tokens.ts', () => {
    const kebab = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
    for (const [name, value] of Object.entries(COLORS)) {
      expect(css, name).toContain(`--color-${kebab(name)}: ${value};`);
    }
  });

  it('keeps text and component pairs accessible', () => {
    const textPairs: ReadonlyArray<readonly [string, string]> = [
      [COLORS.ink, COLORS.canvas], [COLORS.ink, COLORS.surface], [COLORS.inkMuted, COLORS.canvas], [COLORS.inkMuted, COLORS.surface],
      [COLORS.inkMuted, COLORS.surfaceMuted], [COLORS.white, COLORS.evergreen], [COLORS.white, COLORS.evergreenStrong], [COLORS.evergreen, COLORS.canvas],
      [COLORS.evergreen, COLORS.evergreen50], [COLORS.terracottaStrong, COLORS.surface], [COLORS.terracottaStrong, COLORS.canvas],
      [COLORS.success, COLORS.success50], [COLORS.warning, COLORS.warning50], [COLORS.info, COLORS.info50], [COLORS.urgent, COLORS.urgent50],
      [COLORS.pharmacy, COLORS.pharmacy50], [COLORS.ops, COLORS.ops50], [COLORS.ink, COLORS.butter50], [COLORS.ink, COLORS.butter],
      [COLORS.success, COLORS.surface], [COLORS.warning, COLORS.surface], [COLORS.info, COLORS.surface], [COLORS.urgent, COLORS.surface],
    ];
    const componentPairs: ReadonlyArray<readonly [string, string]> = [
      [COLORS.borderStrong, COLORS.surface], [COLORS.evergreen, COLORS.surface], [COLORS.evergreen, COLORS.canvas], [COLORS.butter, COLORS.evergreenStrong],
      [COLORS.terracotta, COLORS.surface],
    ];
    for (const [foreground, background] of textPairs) expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    for (const [foreground, background] of componentPairs) expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(3);
  });
});
