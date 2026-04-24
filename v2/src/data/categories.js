/**
 * Fixed category list matching v1.
 * Order and labels match the original app.
 * 'Lunch|Dinner' is a combined filter — matches recipes with either tag.
 */
export const V1_CATEGORIES = [
  // ── Meal Type ──
  { label: 'Breakfast',          icon: '🧇' },
  { label: 'Lunch / Dinner',    icon: '🍢', filter: 'Lunch|Dinner' },
  { label: 'Appetizers',        icon: '🥟' },
  { label: 'Sides',             icon: '🥦' },
  { label: 'Snacks',            icon: '🥨' },
  { label: 'Drinks',            icon: '🥤' },
  { label: 'Desserts',          icon: '🍨' },

  // ── Dish Type ──
  { label: 'Soups & Stews',     icon: '🍲' },
  { label: 'Salads',            icon: '🥗' },
  { label: 'Pasta & Noodles',   icon: '🍝' },
  { label: 'Sandwiches',        icon: '🥪' },
  { label: 'Burgers & Patties', icon: '🍔' },
  { label: 'Sauces & Dips',     icon: '🫙' },
  { label: 'Bread & Baking',    icon: '🥖' },
  { label: 'GF Bread',          icon: '🍞' },

  // ── Cuisine ──
  { label: 'Japanese',          icon: '🍱 🇯🇵' },
  { label: 'Mexican',           icon: '🌮 🇲🇽' },
  { label: 'Chinese',           icon: '🥡 🇨🇳' },
  { label: 'Thai',              icon: '🍜 🇹🇭' },
  { label: 'Vietnamese',        icon: '🍜 🇻🇳' },
  { label: 'Indian',            icon: '🍛 🇮🇳' },
  { label: 'Korean',            icon: '🥢 🇰🇷' },
  { label: 'Italian',           icon: '🍝 🇮🇹' },
  { label: 'Greek',             icon: '🫓 🇬🇷' },
  { label: 'Mediterranean',     icon: '🫒' },
  { label: 'Middle Eastern',    icon: '🧆' },
  { label: 'Southern',          icon: '🌽' },

  // ── Lifestyle & Diet ──
  { label: 'High-Protein',      icon: '🏋️' },
  { label: 'High-Fiber',        icon: '🌾' },
  { label: 'Raw',               icon: '🥬' },
  { label: 'Vegan Cheese',      icon: '🧀' },
  { label: 'Vegan Bacon',       icon: '🥓' },

  // ── Convenience & Occasion ──
  { label: 'Quick Meals',       icon: '⏱️' },
  { label: 'Beginner',          icon: '🌱' },
  { label: 'Kid-Friendly',      icon: '👶' },
  { label: 'Comfort Food',      icon: '🫕' },
  { label: 'Holiday & Festive', icon: '🎄' },
  { label: 'Game Day',          icon: '🏈' },
  { label: 'One-Pot',           icon: '🥘' },
  { label: 'Instant Pot',       icon: '⚡' },
];
