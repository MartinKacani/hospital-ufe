import { newE2EPage } from '@stencil/core/testing';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<tjmk-hospital-wl-app></tjmk-hospital-wl-app>');

    const element = await page.find('tjmk-hospital-wl-app');
    expect(element).toHaveClass('hydrated');
  });
});
