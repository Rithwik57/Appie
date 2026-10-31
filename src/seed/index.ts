import { PLACEHOLDER_ITEMS } from '../domain/copy';
import type { DemoSeed } from '../domain/types';
import raw from './demoSeed.json';

/**
 * The single, typed source of fictional demo users, scenario templates,
 * mock service settings and non-clinical catalog labels.
 */
export const DEMO_SEED = raw as unknown as DemoSeed;

const catalogLabels = DEMO_SEED.catalog.items.map((item) => item.label).join('|');
const placeholderLabels = PLACEHOLDER_ITEMS.map((item) => item.label).join('|');
if (catalogLabels !== placeholderLabels) {
  throw new Error('[appie] demo seed catalog labels must match the placeholder item labels.');
}
