/**
 * Fixed category list matching v1.
 * Order and labels match the original app.
 * 'Lunch|Dinner' is a combined filter — matches recipes with either tag.
 */
export const V1_CATEGORIES = [
  { label: 'Breakfast',        icon: '🧇' },
  { label: 'Lunch / Dinner',   icon: '🍢', filter: 'Lunch|Dinner' },
  { label: 'Soups & Stews',    icon: '🍲' },
  { label: 'Salads',           icon: '🥗' },
  { label: 'Pasta & Noodles',  icon: '🍝' },
  { label: 'High-Protein',     icon: '🏋️' },
  { label: 'Snacks',           icon: '🥨' },
  { label: 'Desserts',         icon: '🍨' },
  { label: 'Sauces & Dips',    icon: '🫙' },
  { label: 'Game Day',         icon: '🏈' },
  { label: 'Japanese',         icon: '🍱 🇯🇵' },
  { label: 'Mexican',          icon: '🌮 🇲🇽' },
  { label: 'Chinese',          icon: '🥡 🇨🇳' },
  { label: 'Thai',             icon: '🍜 🇹🇭' },
  { label: 'Vietnamese',       icon: '🍜 🇻🇳' },
  { label: 'Indian',           icon: '🍛 🇮🇳' },
  { label: 'Korean',           icon: '🥢 🇰🇷' },
  { label: 'Italian',          icon: '🍝 🇮🇹' },
  { label: 'Mediterranean',    icon: '🫒' },
  { label: 'Middle Eastern',   icon: '🧆' },
  { label: 'Southern',         icon: '🌽' },
  { label: 'Comfort Food',     icon: '🫕' },
  { label: 'Quick Meals',      icon: '⏱️' },
  { label: 'Beginner',         icon: '🌱' },
  { label: 'GF Bread',         icon: '🍞' },
  { label: 'One-Pot',          icon: '🥘' },
  { label: 'Instant Pot',      icon: '⚡' },
];
