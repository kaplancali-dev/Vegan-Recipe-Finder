/**
 * Ingredient aliases — bidirectional expansions.
 * If a user has "mushrooms (any)", they match any of the 20+ variants.
 */
export const INGREDIENT_ALIASES = {
  'plant-based milk (any)': ['almond milk','oat milk','soy milk','cashew milk','rice milk','hemp milk','macadamia milk','pistachio milk','plant milk','nondairy milk','non-dairy milk'],
  'any cooking oil':        ['coconut oil','olive oil','avocado oil','vegetable oil','canola oil','sunflower oil','grapeseed oil','light oil','neutral oil'],
  'nut butter (any)':       ['peanut butter','almond butter','sunflower butter','cashew butter','hazelnut butter','walnut butter','pecan butter','macadamia butter','mixed nut butter','seed butter'],
  'pasta (any)':            ['pasta','gluten-free pasta','spaghetti','penne','fusilli','farfalle','rigatoni','linguine','fettuccine','tagliatelle','orzo','macaroni','rotini','angel hair','lasagna noodles','noodles'],
  'soy sauce / tamari / coconut aminos':     ['soy sauce','tamari','coconut aminos','liquid aminos','aminos'],
  'sweetener (any)': ['maple syrup','agave','coconut sugar','brown sugar','sugar','date syrup'],
  'leafy greens (any)': ['spinach','kale','chard','arugula','collard greens','beet greens','bok choy','baby spinach'],
  'lettuce (any)': ['lettuce','romaine','romaine lettuce','iceberg','iceberg lettuce','butter lettuce','bibb lettuce','red leaf lettuce','green leaf lettuce','mixed greens','spring mix','mesclun','mixed salad greens'],
  'vinegar (any)': ['apple cider vinegar','rice vinegar','white vinegar','red wine vinegar','balsamic vinegar'],
  'flour (any)': ['flour','all-purpose flour','oat flour','almond flour','spelt flour','buckwheat flour','rice flour','coconut flour'],
  'fresh herbs (any)': ['cilantro','parsley','basil','mint','dill','thyme','rosemary','oregano','chives'],
  'mushrooms (any)': ['mushrooms','shiitake mushrooms','shiitake mushroom','shiitake','oyster mushrooms','oyster mushroom','cremini mushrooms','cremini mushroom','cremini','portobello mushrooms','portobello mushroom','portobello','portobellos','button mushrooms','button mushroom','king oyster mushrooms','king oyster mushroom','enoki mushrooms','enoki mushroom','enoki','maitake mushrooms','maitake mushroom','chanterelle mushrooms','chanterelle mushroom','baby bella mushrooms','baby bella','white mushrooms','mixed mushrooms','sliced mushrooms','chopped mushrooms','diced mushrooms','mushroom'],
  'rice (any)': ['rice','brown rice','white rice','jasmine rice','basmati rice','wild rice','long grain rice','short grain rice','sushi rice','sticky rice','arborio rice'],
  'berries (any)': ['berries','blueberries','strawberries','raspberries','blackberries','mixed berries','cranberries','boysenberries','fresh berries','frozen berries'],
  'chili oil': ['chili oil','chilli oil','hot oil'],
  'coconut milk': ['coconut milk','coconut cream','full-fat coconut milk','light coconut milk'],
  'gochujang': ['gochujang','korean chili paste'],
  'cocoa powder': ['cacao powder','raw cacao powder','unsweetened cocoa powder','dutch process cocoa','cacao','cocoa'],
  'chocolate chips (any)': ['chocolate chips','dark chocolate chips','vegan chocolate chips','semi-sweet chocolate chips','milk chocolate chips','dark-chocolate chips','mini chocolate chips'],
  'dark chocolate': ['dark chocolate','roughly chopped dark chocolate','semi-sweet chocolate','bittersweet chocolate','vegan chocolate'],
  'natural sweetener (any)': ['agave','agave nectar','agave syrup','monk fruit','monk fruit sweetener','allulose','stevia','date syrup','coconut sugar','maple syrup','maple','brown sugar','sugar','sweetener','coconut nectar','raw sugar','cane sugar'],
  'allulose / stevia / monk fruit': ['allulose','stevia','monk fruit','monk fruit sweetener','sugar','cane sugar','white sugar','granulated sugar','brown sugar','coconut sugar','powdered sugar','maple syrup','agave','agave nectar','agave syrup','sweetener'],
  'vegan yogurt': ['vegan yogurt','plant-based yogurt','coconut yogurt','soy yogurt','non-dairy yogurt','vanilla vegan yogurt','dairy-free yogurt'],
  'vegan mayo': ['vegan mayo','vegan mayonnaise','mayo','mayonnaise','vegan mayo*'],
  'canned tomatoes (any)': ['crushed tomatoes','diced tomatoes','tomato sauce','tomato puree','tomato purée','fire roasted tomatoes','fire-roasted tomatoes','fire roasted diced tomatoes','fire-roasted diced tomatoes','diced fire-roasted tomatoes','diced fire roasted tomatoes','whole peeled tomatoes','canned tomatoes','chopped tomatoes','stewed tomatoes','tinned tomatoes','petite diced tomatoes','plum tomatoes','can diced tomatoes','can crushed tomatoes','can tomato sauce','best-quality peeled tomatoes','canned chopped tomato','canned chopped tomatoes','canned diced tomatoes juice','chopped canned tomato with juice','tomato sauce puree','tomatoes their juice'],
  'cabbage (any)': ['cabbage','red cabbage','green cabbage','purple cabbage','napa cabbage','savoy cabbage','shredded cabbage','shredded red cabbage','shredded green cabbage','shredded purple cabbage','shredded napa cabbage','chopped purple cabbage','chopped napa cabbage'],
  'sea salt': ['kosher salt','fine salt','salt','salt and pepper','salt and pepper to taste','salt to taste','coarse salt','fine sea salt','flaky salt','table salt','teaspoon kosher salt','teaspoons kosher salt','kosher salt + more to taste'],
  'vegetable broth': ['vegetable stock','veggie broth','veggie stock','veg broth','veg stock'],
  'bay leaves': ['bay leaf'],
  'bell peppers (any)': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','bell peppers','red pepper','green pepper'],
  'miso paste': ['white miso','light miso','red miso','yellow miso','miso'],
  'red pepper flakes': ['chili flakes','crushed red pepper','crushed red pepper flakes','red chili flakes'],
  'white beans': ['cannellini beans','great northern beans','navy beans'],
  'arrowroot powder': ['tapioca starch','tapioca flour','tapioca','arrowroot starch','arrowroot'],
  'cornstarch': ['potato starch','corn starch'],
  'jalapeño': ['jalapeno','jalapeños','jalapenos'],
  'maple syrup': ['honey','agave nectar','agave syrup','agave'],
};

/**
 * One-way substitutions: if user HAS the left item, it also covers the right items in recipes.
 */
export const INGREDIENT_SUBS = {
  'olive oil':      ['coconut oil','avocado oil','vegetable oil','light oil','neutral oil'],
  'coconut oil':    ['olive oil','vegetable oil','light oil'],
  'almond milk':    ['soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'soy milk':       ['almond milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'rice milk':      ['almond milk','soy milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'hemp milk':      ['almond milk','soy milk','rice milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'macadamia milk': ['almond milk','soy milk','rice milk','hemp milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'pistachio milk': ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'oat milk':       ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','cashew milk','plant milk','plant-based milk'],
  'cashew milk':    ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','plant milk','plant-based milk'],
  'peanut butter':  ['almond butter','sunflower butter','cashew butter','nut butter'],
  'almond butter':  ['peanut butter','sunflower butter','cashew butter','nut butter'],
  'sunflower butter': ['peanut butter','almond butter','cashew butter','nut butter'],
  'cashew butter':  ['peanut butter','almond butter','sunflower butter','nut butter'],
  'maple syrup': ['agave','agave nectar','agave syrup','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','maple','sugar','coconut nectar','honey'],
  'agave': ['maple syrup','maple','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','agave nectar','agave syrup','sugar','coconut nectar'],
  'natural sweetener (any)': ['maple syrup','maple','agave','agave nectar','agave syrup','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','sugar','coconut nectar','raw sugar','cane sugar'],
  'spinach': ['kale','chard','baby spinach','arugula','collard greens'],
  'kale': ['spinach','chard','collard greens','baby spinach'],
  'apple cider vinegar': ['rice vinegar','white vinegar','lemon juice'],
  'rice vinegar': ['apple cider vinegar','white vinegar','white wine vinegar','seasoned rice vinegar'],
  'flour': ['oat flour','almond flour','spelt flour','rice flour','gluten-free flour','gf flour','all-purpose flour','1:1 gluten-free flour'],
  'all-purpose flour': ['gluten-free flour','1:1 gluten-free flour','gf flour','oat flour','almond flour','rice flour','spelt flour'],
  'gluten-free flour': ['1:1 gluten-free flour','gf flour','oat flour','almond flour','rice flour'],
  'almond flour': ['oat flour','coconut flour','rice flour','gluten-free flour'],
  'oat flour': ['almond flour','rice flour','gluten-free flour','1:1 gluten-free flour'],
  'rice flour': ['oat flour','almond flour','gluten-free flour','1:1 gluten-free flour'],
  'cornstarch': ['arrowroot powder','tapioca flour','tapioca starch','potato starch','corn starch'],
  'arrowroot powder': ['cornstarch','tapioca flour','tapioca starch','tapioca','arrowroot starch','arrowroot','potato starch'],
  'vegetable broth': ['water','mushroom broth','miso water','vegetable stock','veggie broth','veggie stock','veg broth','veg stock'],
  'coconut cream': ['cashew cream','coconut milk'],
  'lemon': ['lime','apple cider vinegar'],
  'lime': ['lemon'],
  'cilantro': ['parsley','basil'],
  'lettuce':            ['romaine','iceberg','butter lettuce','bibb lettuce','red leaf lettuce','green leaf lettuce','mixed greens','spring mix'],
  'romaine':            ['lettuce','iceberg','butter lettuce','green leaf lettuce','red leaf lettuce','mixed greens'],
  'iceberg':            ['lettuce','romaine','butter lettuce','green leaf lettuce','red leaf lettuce'],
  'butter lettuce':     ['lettuce','romaine','iceberg','bibb lettuce','green leaf lettuce','red leaf lettuce'],
  'red leaf lettuce':   ['lettuce','romaine','iceberg','green leaf lettuce','butter lettuce','mixed greens'],
  'green leaf lettuce': ['lettuce','romaine','iceberg','red leaf lettuce','butter lettuce','mixed greens'],
  'mixed greens':       ['lettuce','romaine','spring mix','mesclun','arugula','spinach','baby spinach'],
  'arugula':            ['spinach','baby spinach','mixed greens','lettuce'],
  'fresh ginger': ['ginger','ginger powder'],
  'ginger': ['fresh ginger','ginger powder'],
  'cocoa powder': ['cacao powder','raw cacao powder','cacao','cocoa','unsweetened cocoa powder','dutch process cocoa'],
  'cacao powder': ['cocoa powder','raw cacao powder','cacao','cocoa','unsweetened cocoa powder'],
  'chocolate chips (any)': ['dark chocolate chips','dark chocolate','semi-sweet chocolate chips','vegan chocolate chips','bittersweet chocolate','chocolate','chocolate chips'],
  'dark chocolate': ['chocolate chips','dark chocolate chips','semi-sweet chocolate','bittersweet chocolate','vegan chocolate','chocolate'],
  'rice (any)': ['rice','brown rice','white rice','jasmine rice','basmati rice','wild rice','arborio rice','sushi rice'],
  'brown rice': ['rice','white rice','jasmine rice','basmati rice','wild rice'],
  'canned tomatoes (any)': ['crushed tomatoes','diced tomatoes','tomato sauce','tomato puree','fire roasted tomatoes','fire-roasted tomatoes','whole peeled tomatoes','canned tomatoes','chopped tomatoes','stewed tomatoes','marinara sauce','pasta sauce','marinara','best-quality peeled tomatoes','canned chopped tomato','canned chopped tomatoes','canned diced tomatoes juice','chopped canned tomato with juice','tomato sauce puree','tomatoes their juice'],
  'red cabbage': ['cabbage','green cabbage','purple cabbage','napa cabbage','shredded cabbage','shredded red cabbage','shredded green cabbage','chopped purple cabbage'],
  'cabbage': ['red cabbage','green cabbage','purple cabbage','napa cabbage','shredded cabbage','shredded red cabbage','shredded green cabbage','chopped purple cabbage'],
  'green cabbage': ['cabbage','red cabbage','purple cabbage','napa cabbage','shredded cabbage','shredded green cabbage'],
  'purple cabbage': ['cabbage','red cabbage','green cabbage','napa cabbage','shredded cabbage','shredded purple cabbage','chopped purple cabbage'],
  'napa cabbage': ['cabbage','red cabbage','green cabbage','purple cabbage','shredded cabbage','shredded napa cabbage','chopped napa cabbage'],
  'crushed tomatoes': ['diced tomatoes','canned tomatoes','chopped tomatoes','whole peeled tomatoes','fire roasted tomatoes'],
  'diced tomatoes': ['crushed tomatoes','canned tomatoes','chopped tomatoes','whole peeled tomatoes','fire roasted tomatoes'],
  'tomato sauce': ['tomato puree','crushed tomatoes','canned tomatoes'],
  'tomato puree': ['tomato sauce','crushed tomatoes','canned tomatoes'],
  'sea salt': ['kosher salt','fine salt','salt','coarse salt','fine sea salt','flaky salt','table salt'],
  'bay leaves': ['bay leaf'],
  'bell peppers (any)': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','red pepper','green pepper'],
  'bell peppers': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','red pepper','green pepper'],
  'miso paste': ['white miso','light miso','red miso','yellow miso','miso'],
  'red pepper flakes': ['chili flakes','crushed red pepper','crushed red pepper flakes','red chili flakes'],
  'white beans': ['cannellini beans','great northern beans'],
  'tapioca flour': ['tapioca starch','arrowroot powder','arrowroot starch','arrowroot','tapioca','potato starch'],
  'jalapeño': ['jalapeno','jalapeños','jalapenos'],
  'balsamic vinegar': ['balsamic glaze','balsamic reduction'],

  // ── Proteins / Beans ──
  'chickpeas': ['white beans','cannellini beans','great northern beans','butter beans'],
  'black beans': ['pinto beans','kidney beans','red beans'],
  'pinto beans': ['black beans','kidney beans','red beans'],
  'kidney beans': ['black beans','pinto beans','red beans'],
  'extra-firm tofu': ['firm tofu','super-firm tofu','tempeh'],
  'firm tofu': ['extra-firm tofu','super-firm tofu','tempeh'],
  'silken tofu': ['soft tofu','vegan yogurt','blended cashews'],
  'soft tofu': ['silken tofu','vegan yogurt'],
  'tempeh': ['extra-firm tofu','firm tofu','soy curls'],
  'green lentils': ['brown lentils','french lentils'],
  'brown lentils': ['green lentils','french lentils'],
  'red lentils': ['yellow lentils','split peas'],

  // ── Grains / Pasta ──
  'quinoa': ['couscous','bulgur','farro','millet'],
  'farro': ['quinoa','barley','bulgur','freekeh'],
  'rolled oats': ['quick oats','oats','steel-cut oats'],
  'spaghetti': ['linguine','angel hair','thin spaghetti','pasta'],
  'linguine': ['spaghetti','fettuccine','pasta'],
  'penne pasta': ['rigatoni','fusilli','elbow pasta','pasta'],
  'elbow pasta': ['penne pasta','fusilli','rotini','pasta'],
  'udon noodles': ['rice noodles','soba noodles','ramen noodles'],
  'ramen noodles': ['udon noodles','rice noodles','soba noodles'],
  'basmati rice': ['jasmine rice','white rice','long grain rice'],
  'jasmine rice': ['basmati rice','white rice','long grain rice'],

  // ── Nuts / Seeds ──
  'almonds': ['peanuts'],
  'peanuts': ['almonds'],
  'sunflower seeds': ['pumpkin seeds','pepitas'],
  'pumpkin seeds': ['sunflower seeds','pepitas'],
  'chia seeds': ['flax seeds','flaxseed meal'],
  'flaxseed meal': ['ground flaxseed','ground flaxseeds','chia seeds','flax seeds'],

  // ── Sauces / Condiments ──
  'soy sauce': ['tamari','coconut aminos','liquid aminos'],
  'tamari': ['soy sauce','coconut aminos','liquid aminos'],
  'coconut aminos': ['tamari','soy sauce','liquid aminos'],
  'sriracha': ['hot sauce','sambal oelek','chili garlic sauce','gochujang'],
  'hot sauce': ['sriracha','sambal oelek','chili garlic sauce'],
  'sambal oelek': ['sriracha','chili garlic sauce','hot sauce','gochujang'],
  'chili garlic sauce': ['sambal oelek','sriracha','gochujang'],
  'gochujang': ['sriracha','sambal oelek','chili garlic sauce'],
  'hoisin sauce': ['teriyaki sauce','bbq sauce','sweet soy glaze'],
  'dijon mustard': ['whole grain mustard','yellow mustard','stone-ground mustard'],
  'vegan worcestershire sauce': ['soy sauce','tamari','coconut aminos'],
  'vegan mayo': ['tahini','vegan sour cream','cashew cream'],
  'red wine vinegar': ['sherry vinegar','balsamic vinegar','white wine vinegar','apple cider vinegar'],
  'sherry vinegar': ['red wine vinegar','white wine vinegar','apple cider vinegar'],
  'white wine vinegar': ['rice vinegar','sherry vinegar','apple cider vinegar','red wine vinegar'],

  // ── Vegetables ──
  'zucchini': ['yellow squash','summer squash','eggplant'],
  'sweet potato': ['butternut squash','pumpkin','sweet potatoes'],
  'sweet potatoes': ['butternut squash','pumpkin','sweet potato'],
  'butternut squash': ['sweet potato','pumpkin','kabocha squash'],
  'cauliflower': ['broccoli','cauliflower florets'],
  'broccoli': ['cauliflower','broccolini','broccoli florets'],
  'eggplant': ['zucchini','portobello mushrooms','yellow squash'],
  'mushrooms': ['cremini mushrooms','shiitake mushrooms','baby bella mushrooms','portobello mushrooms','white button mushrooms','oyster mushrooms'],
  'cremini mushrooms': ['baby bella mushrooms','white button mushrooms','mushrooms','shiitake mushrooms'],
  'shiitake mushrooms': ['cremini mushrooms','oyster mushrooms','king oyster mushrooms','mushrooms'],
  'celery': ['fennel bulb','celery ribs'],
  'shallot': ['shallots','red onion'],
  'shallots': ['shallot','red onion'],
  'scallions': ['green onion','green onions','scallion','spring onion'],
  'green onion': ['scallions','green onions','scallion','spring onion'],

  // ── Dairy Alternatives ──
  'vegan yogurt': ['coconut yogurt','soy yogurt','cashew yogurt','plant-based yogurt'],
  'vegan cheese': ['nutritional yeast','vegan cheddar','vegan mozzarella'],
  'vegan parmesan': ['nutritional yeast','vegan cheese'],
  'vegan cream cheese': ['cashew cream cheese','vegan cream','vegan sour cream'],
  'vegan sour cream': ['vegan yogurt','cashew cream','vegan cream cheese'],
  'vegan butter': ['coconut oil','olive oil','avocado oil'],
  'nutritional yeast': ['vegan parmesan','vegan cheese'],
  'coconut milk': ['coconut cream','cashew milk','oat milk'],

  // ── Sweeteners (gaps) ──
  'coconut sugar': ['brown sugar','maple syrup','date sugar','raw sugar'],
  'brown sugar': ['coconut sugar','maple syrup','date sugar','muscovado sugar'],
  'powdered sugar': ['blended coconut sugar','powdered monk fruit'],
  'date syrup': ['maple syrup','agave','brown rice syrup','molasses'],
  'medjool dates': ['dates','date paste','date syrup','prunes'],

  // ── Oils (gaps) ──
  'sesame oil': ['toasted sesame oil','peanut oil','neutral oil'],
  'avocado oil': ['olive oil','coconut oil','vegetable oil','grapeseed oil'],
  'vegetable oil': ['canola oil','grapeseed oil','sunflower oil','avocado oil','neutral oil'],

  // ── Tahini / Pastes ──
  // tahini — no substitutes, unique flavor
  'tomato paste': ['sun-dried tomato paste','tomato sauce'],
  'red curry paste': ['green curry paste','yellow curry paste','curry powder'],
  'green curry paste': ['red curry paste','yellow curry paste','curry powder'],

  // ── Herbs (gaps) ──
  'parsley': ['cilantro','basil','chives'],
  'basil': ['parsley','cilantro','thai basil'],
  'mint': ['basil','cilantro'],
  'rosemary': ['thyme','oregano','sage'],
  'thyme': ['rosemary','oregano','marjoram'],
  'oregano': ['thyme','marjoram','italian seasoning'],
  'dill': ['fennel fronds','tarragon','parsley'],
  'sage': ['thyme','rosemary','marjoram'],

  // ── Egg Replacers ──
  // flax egg — no substitutes, specific binding function
  'aquafaba': ['chia egg'],
};

/**
 * Gluten-free swaps — shown inline on recipe cards when GF filter is active.
 */
export const GF_SWAPS = {
  'soy sauce':'tamari or coconut aminos','flour tortillas':'corn tortillas','noodles':'rice noodles',
  'ramen noodles':'rice ramen noodles','pasta':'gluten-free pasta','elbow macaroni':'gluten-free pasta',
  'penne pasta':'gluten-free penne','spaghetti':'gluten-free spaghetti','linguine':'gluten-free linguine',
  'jumbo pasta shells':'gluten-free pasta shells','egg noodles':'rice noodles',
  'breadcrumbs':'gluten-free breadcrumbs','panko breadcrumbs':'gluten-free panko',
  'all-purpose flour':'gluten-free flour','wheat flour':'gluten-free flour','flour':'gluten-free flour','bread flour':'gluten-free flour','spelt flour':'gluten-free flour',
  'burger buns':'GF burger buns','baguette':'GF baguette','sourdough bread':'GF sourdough bread',
  'thick bread':'GF bread','pita bread':'GF pita','gyoza wrappers':'rice paper wrappers',
  'dumpling wrappers':'rice paper wrappers','ladyfinger biscuits':'GF ladyfingers',
  'phyllo dough':'GF phyllo dough','seitan':'extra firm tofu','couscous':'quinoa','barley':'brown rice',
};

/**
 * Sugar-free swaps — shown inline on recipe cards for sweetener ingredients.
 * Maps sugar-containing ingredient names to a swap tip.
 */
export const SUGAR_SWAPS = {
  'sugar':'allulose or monk fruit','cane sugar':'allulose or monk fruit',
  'white sugar':'allulose or monk fruit','granulated sugar':'allulose or monk fruit',
  'brown sugar':'allulose brown sugar or coconut sugar','coconut sugar':'allulose or monk fruit',
  'powdered sugar':'powdered monk fruit','icing sugar':'powdered monk fruit',
  'maple syrup':'zero-sugar maple syrup (allulose/monk fruit)','agave':'allulose syrup',
  'agave nectar':'allulose syrup','agave syrup':'allulose syrup',
  'turbinado sugar':'allulose or monk fruit','raw sugar':'allulose or monk fruit',
  'demerara sugar':'allulose or monk fruit','muscovado sugar':'allulose or monk fruit',
  'date sugar':'monk fruit sugar','corn syrup':'allulose syrup',
};

/**
 * Vegan swaps — [vegan_term, original_term], most specific first.
 */
export const VEGAN_SWAPS = [
  ['vegan monterey jack cheese','monterey jack cheese'],
  ['vegan provolone cheese','provolone cheese'],
  ['vegan goat cheese','goat cheese'],
  ['vegan cream cheese','cream cheese'],
  ['vegan sour cream','sour cream'],
  ['plant-based buttermilk','buttermilk'],
  ['plant-based yogurt','yogurt'],
  ['plant-based cream','cream'],
  ['plant-based milk','milk'],
  ['vegan parmesan','parmesan'],
  ['vegan mozzarella','mozzarella'],
  ['vegan ricotta','ricotta'],
  ['vegan cheddar','cheddar'],
  ['vegan feta','feta'],
  ['vegan butter','butter'],
  ['vegan cheese','cheese'],
  ['flax egg','egg'],
  ['aquafaba','egg whites'],
];

/**
 * Allergy keyword map — used to filter recipes by allergen.
 */
export const ALLERGY_KEYWORDS = {
  'peanut':     ['peanut','peanut butter'],
  'tree nut':   ['almond','cashew','walnut','pecan','brazil nut','pistachio','macadamia','hazelnut','pine nut','almond butter','almond milk','cashew milk','macadamia milk','pistachio milk','cashew butter','macadamia butter','hazelnut butter','pecan butter','walnut butter'],
  'soy':        ['edamame','soy milk','soy protein','soy curls','soy sauce','tofu','tempeh','miso','tamari'],
  'coconut':    ['coconut milk','coconut oil','coconut cream','coconut flakes','coconut'],
  'corn':       ['corn','cornstarch','corn tortilla','polenta','corn flour'],
  'mushroom':   ['mushroom'],
  'nightshade': ['tomato','bell pepper','eggplant','potato','paprika','chili','jalapeño','chipotle'],
};

/**
 * Quick-add ingredient panels — staples organized by category.
 */
export const QA_ITEMS = [
  {cat:'🫘 Proteins & Legumes', items:['chickpeas','black beans','lentils','kidney beans','navy beans','pinto beans','white beans','tofu','tempeh','edamame','hemp seeds','chia seeds','flax seeds','pumpkin seeds','sunflower seeds','tahini','protein powder']},
  {cat:'🌾 Grains & Starches',  items:['pasta (any)','rice (any)','quinoa','oats','sweet potatoes','potatoes','corn tortillas','polenta','buckwheat','almond flour','coconut flour','oat flour','tapioca flour','brown rice flour','arrowroot powder','rice noodles','nori','pita bread','breadcrumbs']},
  {cat:'🥦 Vegetables',         items:['garlic','onions','spinach','kale','carrots','broccoli','cauliflower','bell peppers','mushrooms (any)','tomatoes','avocado','zucchini','corn','cucumber','green onions','eggplant','cabbage','bean sprouts','bamboo shoots','shallots']},
  {cat:'🍋 Fruits',             items:['lemon','lime','banana','berries (any)','mango','apple','oranges','pineapple','peaches','pears','grapes','watermelon','coconut','dates']},
  {cat:'🥜 Nuts & Seeds', items:['nut butter (any)','cashews','almonds','walnuts','pecans','brazil nuts','macadamia nuts','hazelnuts','pistachio','peanuts','sesame seeds','pine nuts']},
  {cat:'🥛 Plant-Based Milks',  items:['plant-based milk (any)','almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk']},
  {cat:'🫙 Pantry & Oils',      items:['any cooking oil','olive oil','coconut oil','avocado oil','sesame oil','chili oil','canned tomatoes (any)','crushed tomatoes','diced tomatoes','tomato sauce','vegetable broth','soy sauce / tamari / coconut aminos','coconut milk','miso paste','maple syrup','natural sweetener (any)','apple cider vinegar','nutritional yeast','rice vinegar','dijon mustard','tomato paste','vegan mayo','tamarind paste','gochujang','balsamic vinegar','sriracha / hot sauce','olives','curry paste','liquid smoke','vegan sour cream']},
  {cat:'🌿 Spices & Herbs',     items:['turmeric','cumin','smoked paprika','cinnamon','chili powder','ginger','curry powder','black pepper','garlic powder','onion powder','oregano','basil','thyme','coriander','cayenne','cardamom','bay leaves','five spice','nutmeg','sea salt','garam masala','lemongrass','star anise','dill','mint','rosemary','red pepper flakes','sumac','italian seasoning']},
  {cat:'🍨 Dessert Pantry',     items:['vanilla extract','vanilla','cocoa powder','chocolate chips (any)','coconut cream','coconut sugar','vegan butter','flax egg','baking soda','baking powder','cornstarch','shredded coconut','medjool dates','allulose / stevia / monk fruit']},
];

/**
 * Perishable ingredients — shown in the "Fresh This Week" quick-add panel.
 */
export const PERISHABLES = [
  {cat:'🥬 Leafy Greens', items:['spinach','baby spinach','kale','arugula','mixed greens','romaine','bok choy','collard greens','chard']},
  {cat:'🥒 Vegetables', items:['cucumber','bell peppers (any)','fresh tomatoes','cherry tomatoes','zucchini','broccoli','cauliflower','asparagus','celery','fresh carrots','red cabbage','fresh green beans','fresh corn','eggplant','fresh mushrooms','bean sprouts','snap peas','fresh jalapeño']},
  {cat:'🧅 Onions', items:['red onion','yellow onion','white onion','spring onion','scallions','shallots']},
  {cat:'🍓 Fruits', items:['berries (any)','fresh mango','banana','fresh apple','fresh peaches','fresh pears','grapes']},
];
