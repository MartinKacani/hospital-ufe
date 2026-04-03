import { newSpecPage } from '@stencil/core/testing';
import { TjmkHospitalWlEditor } from '../tjmk-hospital-wl-editor';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-editor', () => {
  it('buttons shall be of different type', async () => {
    const page = await newSpecPage({
      components: [TjmkHospitalWlEditor],
      html: `<tjmk-hospital-wl-editor entry-id="@new"></tjmk-hospital-wl-editor>`,
    });
    let items: any = await page.root.shadowRoot.querySelectorAll("md-filled-button");
    expect(items.length).toEqual(1);
    items = await page.root.shadowRoot.querySelectorAll("md-outlined-button");
    expect(items.length).toEqual(1);

    items = await page.root.shadowRoot.querySelectorAll("md-filled-tonal-button");
    expect(items.length).toEqual(1);
  });
});