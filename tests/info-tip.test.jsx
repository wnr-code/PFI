// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InfoTip } from '../src/components/InfoTip.jsx';

afterEach(cleanup);

function renderTip() {
  render(<div><InfoTip title="Tujuan operasi" label="Buka informasi">Penjelasan singkat operasi.</InfoTip><button type="button">Di luar</button></div>);
  return screen.getByRole('button', { name: 'Buka informasi' });
}

describe('InfoTip', () => {
  it('toggles and closes with its dismiss button', () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Tujuan operasi' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup informasi' }));
    expect(screen.queryByRole('dialog')).toBeFalsy();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape and restores focus to its trigger', () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeFalsy();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when the user presses outside it', () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Di luar' }));
    expect(screen.queryByRole('dialog')).toBeFalsy();
  });

  it('can be dismissed by swiping its mobile sheet handle downward', () => {
    const trigger = renderTip();
    fireEvent.click(trigger);
    const handle = document.querySelector('.info-tip-drag-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 190 }] });
    fireEvent.touchEnd(handle);
    expect(screen.queryByRole('dialog')).toBeFalsy();
    expect(document.activeElement).toBe(trigger);
  });
});
