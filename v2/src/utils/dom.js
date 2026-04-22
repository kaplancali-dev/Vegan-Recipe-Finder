/**
 * Shared DOM utility helpers.
 * Single source for querySelector shortcuts used across all components.
 */

/**
 * querySelector shorthand.
 * @param {string} sel - CSS selector
 * @param {Element|Document} [root=document]
 * @returns {Element|null}
 */
export const $ = (sel, root = document) => root.querySelector(sel);

/**
 * querySelectorAll shorthand.
 * @param {string} sel - CSS selector
 * @param {Element|Document} [root=document]
 * @returns {NodeListOf<Element>}
 */
export const $$ = (sel, root = document) => root.querySelectorAll(sel);
