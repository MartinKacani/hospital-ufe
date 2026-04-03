import { newSpecPage } from '@stencil/core/testing';
import { TjmkHospitalWlApp } from '../tjmk-hospital-wl-app';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-app', () => {

  it('renders editor', async () => {
    const page = await newSpecPage({
      url: `http://localhost/entry/@new`,
      components: [TjmkHospitalWlApp],
      html: `<tjmk-hospital-wl-app base-path="/"></tjmk-hospital-wl-app>`,
    });
    (page.win as any).navigation = new EventTarget();
    const child = page.root?.shadowRoot?.firstElementChild;
    expect(child?.tagName.toLowerCase()).toEqual("tjmk-hospital-wl-editor");
  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/hospital-wl/`,
      components: [TjmkHospitalWlApp],
      html: `<tjmk-hospital-wl-app base-path="/hospital-wl/"></tjmk-hospital-wl-app>`,
    });
    (page.win as any).navigation = new EventTarget();
    const child = page.root?.shadowRoot?.firstElementChild;
    expect(child?.tagName.toLowerCase()).toEqual("tjmk-hospital-wl-list");
  });
});