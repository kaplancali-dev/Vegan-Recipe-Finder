/**
 * Shared recipe share action.
 * Used by Browse, Favorites, ReadyToCook, and RecipeDetail.
 */

/**
 * Share a recipe via native share sheet or clipboard fallback.
 * @param {string} title - Recipe title
 * @param {string} url - Recipe URL
 * @param {HTMLElement} [btn] - Button element to show feedback on
 */
export function shareRecipe(title, url) {
  const recipeUrl = url || 'https://myharvestvegan.com';
  const text = `Check out this vegan recipe: ${title}\n\n${recipeUrl}\n\nFound on HARVEST — myharvestvegan.com`;

  if (navigator.share) {
    navigator.share({ title, text, url: recipeUrl }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {}).catch(() => {});
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
  shareRecipe(shareBtn.dataset.shareTitle, shareBtn.dataset.shareUrl);
  return true;
}
