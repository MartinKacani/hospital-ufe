import { newE2EPage } from '@stencil/core/testing';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<tjmk-hospital-wl-list></tjmk-hospital-wl-list>');

    const element = await page.find('tjmk-hospital-wl-list');
    expect(element).toHaveClass('hydrated');
  });
});
