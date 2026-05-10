/**
 * Common cooking-term misspellings → canonical spelling.
 *
 * Used by Browse search to silently correct typos before matching.
 * The user's typed query is preserved; search runs against the
 * corrected version and a "Showing results for X" banner explains the swap.
 *
 * Add new entries here whenever beta testers surface a typo we missed.
 * All keys are lowercase. Multi-word phrases use single spaces.
 */
export const TYPO_CORRECTIONS = {
  // Pasta
  'spagetti': 'spaghetti',
  'spaggetti': 'spaghetti',
  'spageti': 'spaghetti',
  'macroni': 'macaroni',
  'macaronni': 'macaroni',
  'lasange': 'lasagna',
  'lasanga': 'lasagna',
  'gnochi': 'gnocchi',
  'tagliatele': 'tagliatelle',

  // Vegetables
  'tomatoe': 'tomato',
  'tomatos': 'tomatoes',
  'potatoe': 'potato',
  'potatos': 'potatoes',
  'broccolli': 'broccoli',
  'brocoli': 'broccoli',
  'califlower': 'cauliflower',
  'caulflower': 'cauliflower',
  'avacado': 'avocado',
  'avocato': 'avocado',
  'asparagas': 'asparagus',
  'aspargus': 'asparagus',
  'zuchini': 'zucchini',
  'zuchinni': 'zucchini',
  'mushrom': 'mushroom',
  'mushrooom': 'mushroom',
  'cucumber': 'cucumber',
  'cucumbur': 'cucumber',
  'eggplnt': 'eggplant',

  // Fruits
  'rasberry': 'raspberry',
  'rasberries': 'raspberries',
  'blueberrys': 'blueberries',
  'strawbery': 'strawberry',
  'strawberrys': 'strawberries',
  'pinapple': 'pineapple',
  'mangoe': 'mango',
  'banaa': 'banana',
  'bananna': 'banana',
  'pomegranite': 'pomegranate',
  'cherrys': 'cherries',

  // Spices / herbs
  'cinammon': 'cinnamon',
  'cinamon': 'cinnamon',
  'pepperoncini': 'pepperoncini',
  'jalepeno': 'jalapeño',
  'jalapino': 'jalapeño',
  'jalepino': 'jalapeño',
  'parmesean': 'parmesan',
  'parmasan': 'parmesan',
  'parmasen': 'parmesan',
  'oregeno': 'oregano',
  'oregona': 'oregano',
  'cilantro': 'cilantro',
  'corriander': 'coriander',
  'rosmary': 'rosemary',
  'tumeric': 'turmeric',
  'turmeic': 'turmeric',
  'cardomom': 'cardamom',
  'cardamon': 'cardamom',
  'parsely': 'parsley',
  'cayene': 'cayenne',
  'cayanne': 'cayenne',
  'pimento': 'pimiento',

  // Beans / legumes
  'chickpea': 'chickpeas',
  'chickpeans': 'chickpeas',
  'garbonzo': 'garbanzo',
  'garbanzo bean': 'garbanzo beans',
  'lentil': 'lentils',
  'lentls': 'lentils',
  'cannelini': 'cannellini',
  'canelinni': 'cannellini',

  // Sweeteners / sweets
  'carmel': 'caramel',
  'caramal': 'caramel',
  'chocalate': 'chocolate',
  'choclate': 'chocolate',
  'chocolatey': 'chocolate',
  'cocao': 'cacao',
  'cocoa powder': 'cocoa powder',
  'cocnut': 'coconut',

  // Dairy alternatives
  'almod': 'almond',
  'almnd': 'almond',
  'cashew': 'cashews',
  'oatmeal': 'oats',

  // Common cooking methods (kept since people search by them)
  'sautee': 'sauté',
  'saute': 'sauté',

  // Misc common
  'recieve': 'receive',
  'recipie': 'recipe',
  'recpie': 'recipe',
  'ingrediant': 'ingredient',
  'ingrediants': 'ingredients',
  'desert': 'dessert',
  'deserts': 'desserts',
  'sandwhich': 'sandwich',
  'sandwhiches': 'sandwiches',
  'casarole': 'casserole',
  'caserole': 'casserole',
  'soufle': 'soufflé',
  'breakfest': 'breakfast',
  'brefeast': 'breakfast',

  // International / cuisines
  'curyy': 'curry',
  'curri': 'curry',
  'masla': 'masala',
  'massala': 'masala',
  'tikka masala': 'tikka masala',
  'gyros': 'gyros',
  'falafal': 'falafel',
  'falaffel': 'falafel',
  'humus': 'hummus',
  'hummmus': 'hummus',
  'guacomole': 'guacamole',
  'guacomoli': 'guacamole',
  'enchilada': 'enchiladas',
  'tortila': 'tortilla',
  'tortillla': 'tortilla',
};
