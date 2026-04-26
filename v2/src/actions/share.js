/**
 * Shared recipe share action.
 * Used by Browse, Favorites, ReadyToCook, and RecipeDetail.
 */

/**
 * Share a recipe via native share sheet or clipboard fallback.
 * Links to HARVEST with a deep link to the specific recipe.
 * @param {string} title - Recipe title
 * @param {string} url - Original recipe URL (unused)
 * @param {number|string} [id] - Recipe ID for deep linking
 */
export function shareRecipe(title, url, id) {
  const harvestUrl = id
    ? `https://myharvestvegan.com?r=${id}`
    : 'https://myharvestvegan.com';
  const text = title
    ? `Check out "${title}" on HARVEST 🌿 — over 4,500 plant-based recipes matched to what's in your kitchen.`
    : `HARVEST 🌿 — over 4,500 plant-based recipes matched to what's in your kitchen.`;

  if (navigator.share) {
    navigator.share({ title: text, url: harvestUrl }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text}\n\n${harvestUrl}`).then(() => {}).catch(() => {});
  }
}

/**
 * Handle share button click from event delegation.
 * @param {Event} e - Click event
 * @returns {boolean} True if handled
 */
export function handleShareClick(e) {
  const shareBtn = e.target.closest('.share-btn');
  if (!shareBtn) return false;
  e.stopPropagation();
  shareRecipe(shareBtn.dataset.shareTitle, shareBtn.dataset.shareUrl, shareBtn.dataset.shareId);
  return true;
}
