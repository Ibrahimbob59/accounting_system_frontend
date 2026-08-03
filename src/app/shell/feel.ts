/**
 * "Feel" — the two presentation axes the handoff (§3) requires to be theme
 * variables rather than hardcoded values: density and corner radius.
 *
 * Both are pure token remaps in tokens.css keyed off a data attribute on
 * <html>; nothing here knows what either mode actually changes, and no
 * component knows which mode is active. That's the point — adding a spacing or
 * radius difference between modes is an edit to tokens.css alone.
 *
 * There is deliberately no UI for these yet: the handoff ships a dark-mode
 * toggle but treats density/corners as prototype-level design exploration.
 * This module exists so the choice is settable and persisted (e.g. from a
 * future settings screen, or by a white-label build) without a rework.
 */

export type Density = 'spacious' | 'compact'
export type Corners = 'rounded' | 'sharp'

const DENSITY_KEY = 'density'
const CORNERS_KEY = 'corners'

export function getStoredDensity(): Density {
  return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'spacious'
}

export function getStoredCorners(): Corners {
  return localStorage.getItem(CORNERS_KEY) === 'sharp' ? 'sharp' : 'rounded'
}

/**
 * Reflect both axes on <html>. The default of each axis is written as an
 * attribute too, even though tokens.css only has selectors for the non-default
 * values — so the current mode is always readable from the DOM instead of
 * being "whatever the absence of an attribute means".
 */
export function applyFeel(density: Density, corners: Corners): void {
  document.documentElement.setAttribute('data-density', density)
  document.documentElement.setAttribute('data-corners', corners)
}

export function persistDensity(density: Density): void {
  localStorage.setItem(DENSITY_KEY, density)
  applyFeel(density, getStoredCorners())
}

export function persistCorners(corners: Corners): void {
  localStorage.setItem(CORNERS_KEY, corners)
  applyFeel(getStoredDensity(), corners)
}
