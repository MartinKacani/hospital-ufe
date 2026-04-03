import { newE2EPage } from '@stencil/core/testing';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<tjmk-hospital-wl-editor></tjmk-hospital-wl-editor>');

    const element = await page.find('tjmk-hospital-wl-editor');
    expect(element).toHaveClass('hydrated');
  });
});
