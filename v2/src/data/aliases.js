/**
 * Ingredient aliases — bidirectional expansions.
 * If a user has "mushrooms (any)", they match any of the 20+ variants.
 */
export const INGREDIENT_ALIASES = {
  // Plant-based milk: after norm dash→space, "plant-based milk" becomes
  // "plant based milk" (3 words). MUST include both 2-word and 3-word forms.
  'plant-based milk (any)': ['almond milk','oat milk','soy milk','cashew milk','rice milk','hemp milk','macadamia milk','pistachio milk','plant milk','plant-based milk','plant based milk','nondairy milk','non-dairy milk','non dairy milk','dairy-free milk','dairy free milk','unsweetened plant milk','unsweetened plant-based milk','unsweetened plant based milk','unflavored plant milk','unflavored plant-based milk','unflavored plant based milk'],
  // "Any cooking oil" covers all liquid neutral oils. Includes bare "oil"
  // so recipes saying just "1 tsp oil" or "oil for cooking" match.
  'any cooking oil':        ['coconut oil','olive oil','avocado oil','vegetable oil','canola oil','sunflower oil','grapeseed oil','light oil','neutral oil','oil','cooking oil','frying oil'],
  'nut butter (any)':       ['peanut butter','almond butter','sunflower butter','cashew butter','hazelnut butter','walnut butter','pecan butter','macadamia butter','mixed nut butter','seed butter'],
  // GF pasta (any) — GLUTEN-FREE pasta varieties only. HARVEST is GF-focused.
  // Includes red lentil, chickpea, brown rice, quinoa, edamame pasta, etc.
  'GF pasta (any)':         ['gluten-free pasta','gf pasta','red lentil pasta','red lentil penne','lentil pasta','chickpea pasta','chickpea penne','brown rice pasta','brown rice penne','rice pasta','rice penne','edamame pasta','edamame spaghetti','black bean pasta','black bean spaghetti','quinoa pasta','buckwheat pasta','soba noodles','rice noodles','glass noodles','spaghetti','penne','fusilli','farfalle','rigatoni','linguine','fettuccine','orzo','macaroni','rotini','angel hair'],
  // Renamed: HARVEST is GF, so the staple no longer offers regular soy sauce
  // (which contains wheat). Tamari and coconut aminos are both GF.
  'tamari / coconut aminos':                 ['tamari','coconut aminos','liquid aminos','aminos','gluten-free soy sauce','gf soy sauce'],
  // Keep the old key for users whose pantry already has the legacy staple
  'soy sauce / tamari / coconut aminos':     ['tamari','coconut aminos','liquid aminos','aminos'],
  // Combined staple "sriracha / hot sauce" needs to expand to both sides
  // (and to common substitutes: sambal oelek, chili garlic sauce, gochujang)
  'sriracha / hot sauce':                    ['sriracha','hot sauce','sambal oelek','chili garlic sauce','gochujang','rooster sauce'],
  'sweetener (any)': ['maple syrup','agave','coconut sugar','brown sugar','sugar','date syrup'],
  'leafy greens (any)': ['spinach','kale','chard','arugula','collard greens','beet greens','bok choy','baby spinach'],
  'lettuce (any)': ['lettuce','romaine','romaine lettuce','iceberg','iceberg lettuce','butter lettuce','bibb lettuce','red leaf lettuce','green leaf lettuce','mixed greens','spring mix','mesclun','mixed salad greens'],
  'vinegar (any)': ['apple cider vinegar','rice vinegar','white vinegar','red wine vinegar','balsamic vinegar'],
  'flour (any)': ['flour','all-purpose flour','oat flour','almond flour','spelt flour','buckwheat flour','rice flour','coconut flour'],
  'fresh herbs (any)': ['cilantro','parsley','basil','mint','dill','thyme','rosemary','oregano','chives','herbs','fresh herbs','dried herbs','mixed herbs','herb sprigs','herb','italian herbs','provençal herbs','herbes de provence','herb mix','herb blend'],
  'mushrooms (any)': ['mushrooms','shiitake mushrooms','shiitake mushroom','shiitake','oyster mushrooms','oyster mushroom','cremini mushrooms','cremini mushroom','cremini','portobello mushrooms','portobello mushroom','portobello','portobellos','button mushrooms','button mushroom','king oyster mushrooms','king oyster mushroom','enoki mushrooms','enoki mushroom','enoki','maitake mushrooms','maitake mushroom','chanterelle mushrooms','chanterelle mushroom','baby bella mushrooms','baby bella','white mushrooms','mixed mushrooms','sliced mushrooms','chopped mushrooms','diced mushrooms','mushroom'],
  'rice (any)': ['rice','brown rice','white rice','jasmine rice','basmati rice','wild rice','long grain rice','short grain rice','sushi rice','sticky rice','arborio rice'],
  'berries (any)': ['berries','blueberries','strawberries','raspberries','blackberries','mixed berries','boysenberries','fresh berries','frozen berries'],
  'chili oil': ['chili oil','chilli oil','hot oil'],
  'coconut milk': ['coconut milk','coconut cream','full-fat coconut milk','light coconut milk'],
  'gochujang': ['gochujang','korean chili paste'],
  'cocoa powder': ['cacao powder','raw cacao powder','unsweetened cocoa powder','dutch process cocoa','cacao','cocoa'],
  'chocolate chips (any)': ['chocolate chips','dark chocolate chips','vegan chocolate chips','semi-sweet chocolate chips','milk chocolate chips','dark-chocolate chips','mini chocolate chips'],
  'dark chocolate': ['dark chocolate','roughly chopped dark chocolate','semi-sweet chocolate','bittersweet chocolate','vegan chocolate'],
  'natural sweetener (any)': ['agave','agave nectar','agave syrup','monk fruit','monk fruit sweetener','allulose','stevia','date syrup','coconut sugar','maple syrup','maple','brown sugar','sugar','sweetener','coconut nectar','raw sugar','cane sugar'],
  'allulose': ['sugar','cane sugar','white sugar','granulated sugar','brown sugar','powdered sugar','sweetener'],
  'stevia / monk fruit': ['stevia','monk fruit','monk fruit sweetener','sweetener'],
  'white chocolate chips': ['white chocolate','vegan white chocolate','vegan white chocolate chips'],
  'cacao nibs': ['cacao nib','cocoa nibs','raw cacao nibs'],
  'date sugar': ['date sugar','dried date sugar'],
  'vegan yogurt': ['vegan yogurt','plant-based yogurt','coconut yogurt','soy yogurt','non-dairy yogurt','vanilla vegan yogurt','dairy-free yogurt'],
  'vegan mayo': ['vegan mayo','vegan mayonnaise','mayo','mayonnaise','vegan mayo*'],
  'canned tomatoes (any)': ['crushed tomatoes','diced tomatoes','tomato sauce','tomato puree','tomato purée','fire roasted tomatoes','fire-roasted tomatoes','fire roasted diced tomatoes','fire-roasted diced tomatoes','diced fire-roasted tomatoes','diced fire roasted tomatoes','whole peeled tomatoes','canned tomatoes','chopped tomatoes','stewed tomatoes','tinned tomatoes','petite diced tomatoes','plum tomatoes','can diced tomatoes','can crushed tomatoes','can tomato sauce','best-quality peeled tomatoes','canned chopped tomato','canned chopped tomatoes','canned diced tomatoes juice','chopped canned tomato with juice','tomato sauce puree','tomatoes their juice'],
  'cabbage (any)': ['cabbage','red cabbage','green cabbage','purple cabbage','napa cabbage','savoy cabbage','shredded cabbage','shredded red cabbage','shredded green cabbage','shredded purple cabbage','shredded napa cabbage','chopped purple cabbage','chopped napa cabbage'],
  // Sea salt covers all forms of salt. The old hack also claimed "salt and
  // pepper" was a salt synonym to work around the matcher not handling
  // combined ingredients — that's now handled properly by the matcher's
  // combined-ingredient logic, so removing the false claim.
  'sea salt': ['kosher salt','fine salt','salt','salt to taste','coarse salt','fine sea salt','flaky salt','table salt','teaspoon kosher salt','teaspoons kosher salt','kosher salt + more to taste'],
  'vegetable broth': ['vegetable stock','veggie broth','veggie stock','veg broth','veg stock'],
  'bay leaves': ['bay leaf'],
  'bell peppers (any)': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','bell peppers','red pepper','green pepper'],
  // Onions: yellow, white, sweet, spanish, vidalia are the default cooking
  // onions and ARE interchangeable with generic "onion". Red onion is
  // DELIBERATELY excluded — it's sharper, sweeter, often eaten raw, and
  // not a substitute for default cooking onion. Same with shallots/leeks.
  'onion': ['onions','yellow onion','yellow onions','white onion','white onions','sweet onion','sweet onions','spanish onion','vidalia onion','cooking onion','cooking onions'],
  // Miso paste — white/yellow/light/shiro are the default mild miso (used
  // most commonly). Red/dark miso is saltier and deeper-flavored, kept
  // separate so recipes calling for "white miso paste" don't falsely match.
  'miso paste': ['miso','white miso','white miso paste','light miso','yellow miso','yellow miso paste','shiro miso','sweet miso'],
  // Pepper: black pepper is the DEFAULT form (what most recipes mean by "pepper").
  // Bidirectional with all the common forms — ground, cracked, freshly ground, etc.
  'pepper': ['black pepper','ground pepper','ground black pepper','cracked pepper','cracked black pepper','freshly ground black pepper','freshly cracked black pepper','fresh ground pepper','fresh ground black pepper','peppercorns','black peppercorns'],
  // Scallions / green onions — same plant, used interchangeably.
  // Spring onions are similar enough to also include.
  'green onions': ['scallions','green onion','scallion','spring onions','spring onion'],
  // Pumpkin: whole pumpkin → puree (you can make puree from a pumpkin).
  // One-way only: someone with canned puree shouldn't claim whole pumpkin.
  'pumpkin': ['pumpkin puree','pumpkin purée','canned pumpkin','pumpkin pulp'],
  // Red pepper flakes / chili flakes / crushed red pepper — same product.
  'red pepper flakes': ['chili flakes','chilli flakes','crushed red pepper','crushed red pepper flakes','red chili flakes','red chilli flakes','aleppo pepper','red chilli','red chili','hot chilli powder','hot chili powder'],
  // Smoked paprika ↔ paprika: smoked is the preferred form in vegan recipes
  // (adds depth) but plain paprika is interchangeable in most uses.
  // Note: paprika IS a powder; "X paprika powder" recipes redundantly say so.
  'smoked paprika': ['paprika','sweet paprika','hot paprika','spanish paprika','hungarian paprika','smoked paprika powder','paprika powder','smoked sweet paprika'],
  // UK ↔ US chili spelling: "chilli" is British, "chili" is American
  'chili powder': ['chilli powder','red chili powder','red chilli powder','hot chili powder','hot chilli powder','mild chili powder','mild chilli powder','ground chili','ground chilli'],
  // Ground spices ARE powders. "X powder" = "X" for these. Same fix pattern
  // as smoked paprika powder. The IDENTITY_SUFFIXES guard would otherwise
  // reject these as different products.
  'cumin': ['cumin powder','ground cumin','jeera','ground cumin powder'],
  'coriander': ['coriander powder','ground coriander','dhania','ground coriander powder'],
  'turmeric': ['turmeric powder','ground turmeric','haldi'],
  'cinnamon': ['cinnamon powder','ground cinnamon'],
  'ginger': ['ginger powder','ground ginger','dried ginger'],
  'cardamom': ['cardamom powder','ground cardamom','green cardamom','green cardamom powder'],
  'cloves': ['ground cloves','clove powder','cloves powder'],
  'nutmeg': ['nutmeg powder','ground nutmeg'],
  'allspice': ['allspice powder','ground allspice'],
  'cayenne': ['cayenne powder','ground cayenne','cayenne pepper','ground cayenne pepper'],
  'fennel seeds': ['fennel powder','ground fennel'],
  'mustard': ['mustard powder','ground mustard','dry mustard'],
  // Citrus zest is part of the whole fruit
  'oranges': ['orange zest','orange peel','grated orange zest','orange rind'],
  // Almond extract (specialty flavoring, doesn't have an alias yet)
  'almond extract': ['pure almond extract','natural almond extract'],
  // Vegan parmesan ↔ plant-based parmesan
  'vegan parmesan': ['plant-based parmesan','plant based parmesan','dairy-free parmesan','dairy free parmesan','non-dairy parmesan','vegan parmesan cheese','vegan parm','plant-based parm','plant based parm'],
  // Curry paste types — bidirectional with generic "curry paste"
  'curry paste': ['red curry paste','green curry paste','yellow curry paste','massaman curry paste','panang curry paste','thai curry paste'],
  // Vegetable broth covers bouillon (concentrated form), stock, etc.
  'vegetable broth': ['vegetable stock','veggie broth','veggie stock','veg broth','veg stock','vegetable bouillon','vegetable bouillon cube','vegetable bouillon cubes','veggie bouillon','bouillon cube','vegan bouillon','vegetable base'],
  // Sriracha aliases — including bare "sriracha sauce"
  'sriracha / hot sauce': ['sriracha','hot sauce','sambal oelek','chili garlic sauce','gochujang','rooster sauce','sriracha sauce','hot pepper sauce','tabasco'],
  // Vegan cheese variants
  'vegan cheese': ['plant-based cheese','plant based cheese','dairy-free cheese','dairy free cheese','non-dairy cheese','vegan cheese shreds','plant-based cheese shreds'],
  // Vegan feta variants
  'vegan feta': ['plant-based feta','plant based feta','dairy-free feta','vegan feta cheese'],
  // UK ↔ US sugar naming: caster = superfine = granulated, icing = powdered
  'powdered sugar': ['icing sugar','confectioners sugar','confectioner\'s sugar','10x sugar'],
  'cane sugar': ['caster sugar','superfine sugar','caster superfine sugar','granulated sugar','white sugar','raw sugar','organic cane sugar'],
  // Rice vinegar variants — same product
  'rice vinegar': ['rice wine vinegar','brown rice vinegar','seasoned rice vinegar','japanese rice vinegar'],
  // For a GF app: when a recipe calls for soy sauce, having tamari counts.
  // (Recipes calling for soy sauce in a GF context expect substitution.)
  'tamari': ['soy sauce','reduced sodium soy sauce','low sodium soy sauce','low-sodium soy sauce','dark soy sauce','light soy sauce','shoyu','gluten-free soy sauce','gf soy sauce','liquid aminos','coconut aminos'],
  // Flaxseed meal naming variations
  'flaxseed meal': ['flax meal','flaxmeal','ground flaxseed','ground flax','milled flaxseed','linseed meal'],
  // Vanilla extract is what most recipes mean when they say "vanilla"
  'vanilla extract': ['vanilla','pure vanilla extract','vanilla bean paste','vanilla paste'],
  // Pomegranate fruit covers seeds (you get seeds FROM the fruit)
  'pomegranate': ['pomegranate seeds','pomegranate arils'],
  // Mustard variants
  'dijon mustard': ['dijon-style mustard','dijon style mustard','grainy dijon','wholegrain mustard','whole grain mustard','stone-ground mustard','stoneground mustard','dry mustard','mustard powder','ground mustard'],
  // Generic "vinegar" — user with any specific vinegar can satisfy
  'apple cider vinegar': ['vinegar','any vinegar'],
  // Vegan butter, plant butter, vegan margarine — same product family
  // (designed to behave like dairy butter). Bidirectional category.
  'vegan butter': ['plant butter','plant-based butter','dairy-free butter','vegan margarine','non-dairy butter'],
  // 'red pepper flakes' is defined earlier in this section with the FULL alias list — duplicate removed
  // White beans is a true CATEGORY — these are all members. Bidirectional:
  // any of these ↔ "white beans" so recipes calling for the category match
  // user's specific bean and vice versa. Lima beans/butter beans are
  // technically white but textural differences make them less interchangeable.
  'white beans': ['cannellini beans','great northern beans','navy beans','butter beans','lima beans'],
  // Kidney beans default to RED variety. Recipes saying "red kidney beans"
  // are the same product as generic "kidney beans". White kidney beans = cannellini
  // (in the white beans group above, NOT in this kidney bean group).
  'kidney beans': ['red kidney beans','dark red kidney beans','light red kidney beans','dark kidney beans','light kidney beans','canned beans','canned kidney beans','beans'],
  // Black beans = black turtle beans (same product, different name)
  'black beans': ['black turtle beans','turtle beans','canned black beans','canned beans'],
  // Pinto beans
  'pinto beans': ['pinto bean','pintos','refried beans','refried pinto beans','vegan refried beans','canned pinto beans','canned beans'],
  // Cannellini and white beans cover "canned beans" too
  'white beans': ['cannellini beans','great northern beans','navy beans','butter beans','lima beans','canned white beans','canned beans'],
  // Chickpeas / garbanzos
  'chickpeas': ['canned chickpeas','canned beans','canned garbanzo beans','garbanzo beans','garbanzos'],
  // Generic "canned beans" parent — picker entry; bidirectional so any specific bean covers it
  'canned beans': ['canned kidney beans','canned black beans','canned pinto beans','canned white beans','canned cannellini beans','canned chickpeas','canned navy beans','canned great northern beans','canned red beans','beans','red beans','navy beans','great northern beans','butter beans'],
  'arrowroot powder': ['tapioca starch','tapioca flour','tapioca','arrowroot starch','arrowroot'],
  'cornstarch': ['potato starch','corn starch'],
  'jalapeño': ['jalapeno','jalapeños','jalapenos'],
  'maple syrup': ['honey','agave nectar','agave syrup','agave'],
  'BBQ sauce': ['barbecue sauce','bbq sauce','BBQ'],
  'vegan worcestershire': ['worcestershire sauce','worcestershire','vegan worcestershire sauce'],
  'hoisin sauce': ['hoisin'],
  'active dry yeast': ['yeast','instant yeast','dry yeast','rapid rise yeast'],
  'lentils': ['red lentils','green lentils','brown lentils','french lentils','yellow lentils','black lentils','beluga lentils','split red lentils','split lentils','dal','dahl'],
  'flax seeds': ['flax egg','ground flaxseed','flaxseed meal','ground flax','flax meal'],
  'jackfruit': ['young jackfruit','canned jackfruit','green jackfruit'],
  'fresh ginger': ['ginger root','fresh ginger root','minced ginger','grated ginger','1 inch ginger','2 inch ginger'],
  'lettuce (any)': ['lettuce','romaine','romaine lettuce','iceberg','iceberg lettuce','butter lettuce','bibb lettuce','red leaf lettuce','green leaf lettuce','mixed greens','spring mix','mesclun','mixed salad greens'],
  'vegan yogurt': ['vegan yogurt','plant-based yogurt','coconut yogurt','soy yogurt','non-dairy yogurt','dairy-free yogurt'],
  'vegan cream cheese': ['vegan cream cheese','dairy-free cream cheese','plant-based cream cheese'],
  // 'vegan parmesan' duplicate removed — full alias defined earlier in this section
  'chickpea flour': ['besan','gram flour','garbanzo bean flour'],
  'soba noodles': ['buckwheat noodles'],
  'sambal oelek': ['sambal','chili garlic sauce'],
  'TVP': ['textured vegetable protein','tvp','soy crumbles','soy mince'],
  'raisins': ['golden raisins','sultanas','dried currants'],
  'agave nectar': ['agave','agave syrup'],
  'molasses': ['blackstrap molasses','dark molasses','unsulphured molasses'],
  'date syrup': ['date molasses','silan'],
  'coconut nectar': ['coconut syrup'],
  'sherry vinegar': ['sherry wine vinegar'],
  'white wine vinegar': ['champagne vinegar'],
  'lima beans': ['butter beans'],
  'split peas': ['green split peas','yellow split peas'],
  'GF bread': ['gluten-free bread','gf bread','bread','sandwich bread','sourdough bread','white bread','whole wheat bread'],
  'GF breadcrumbs': ['gluten-free breadcrumbs','gf breadcrumbs','breadcrumbs','panko','panko breadcrumbs','bread crumbs'],
  'GF tortillas': ['gluten-free tortillas','gf tortillas','flour tortillas','tortillas','wraps','gf wraps'],
  'glass noodles': ['cellophane noodles','bean thread noodles','mung bean noodles','crystal noodles','sweet potato noodles','japchae noodles'],
  // ── British / regional names ──
  // Bidirectional so US recipes match UK pantries and vice versa.
  'eggplant': ['aubergine','aubergines','eggplants','baby eggplant','japanese eggplant','italian eggplant','chinese eggplant'],
  'arugula': ['rocket','rocket leaves','baby rocket','wild rocket','baby arugula'],
  'beets': ['beetroot','beetroots','red beets','golden beets','cooked beets','grated beets'],
  'vegan yogurt': ['vegan yogurt','vegan yoghurt','plant-based yogurt','plant-based yoghurt','coconut yogurt','coconut yoghurt','soy yogurt','soy yoghurt','non-dairy yogurt','non-dairy yoghurt','dairy-free yogurt','dairy-free yoghurt','vanilla vegan yogurt','vanilla vegan yoghurt'],
  // Italian "herbs" / "italian herbs" used as shorthand for italian seasoning
  'italian seasoning': ['italian herbs','italian seasoning blend','italian seasoning mix','italian herb blend','italian herb mix','herbes de provence'],
  // Generic "neutral oil" / "neutral tasting oil" / "mild tasting oil" — recipe shorthand
  // for any non-flavored cooking oil. Already covered by 'any cooking oil' but the
  // catch-all is one-way (parent → variants) so we need the reverse mapping here.
  'vegetable oil': ['neutral oil','neutral tasting oil','neutral-tasting oil','neutral flavored oil','neutral-flavored oil','neutral flavoured oil','neutral-flavoured oil','mild oil','mild tasting oil','mild-tasting oil','flavorless oil','flavourless oil','light oil','rice bran oil','peanut oil','cooking oil','frying oil','high smoke point oil','high-smoke-point oil','any oil','any cooking oil'],
  // Common typo — xantham (extra H) for xanthan gum
  'xanthan gum': ['xantham gum','xantham','xanthan'],
  // Olives — the colors are interchangeable enough for matching purposes.
  // Recipes calling for "black olives" or "green olives" are satisfied by
  // having "olives" in pantry. (kalamata is a specific cultivar, but if a
  // user has olives, the recipe is salvageable with substitution.)
  'olives': ['black olives','green olives','kalamata olives','castelvetrano olives','castelvetrano','manzanilla olives','spanish olives','greek olives','pitted olives','sliced olives','chopped olives','mixed olives'],
  // Smoked tofu — pre-flavored firm tofu, used like firm tofu in stir-fries
  // and grain bowls. Reasonable cross-match for matching purposes.
  'firm tofu': ['extra-firm tofu','super-firm tofu','smoked tofu','baked tofu','marinated tofu','pressed tofu','high-protein tofu'],
  // Indian black salt (kala namak) — sulfurous "eggy" salt used in tofu scrambles.
  'kala namak': ['black salt','indian black salt','himalayan black salt'],
  // Almond extract is a flavoring; pantry entry needed but also alias spelling
  'almond extract': ['pure almond extract','natural almond extract','almond flavoring','almond essence'],
  // Vanilla → vanilla extract is already aliased above; add additional forms
  // Common produce duplicates / spellings
  'sweet potatoes': ['sweet potato','yams','japanese sweet potato','japanese sweet potatoes','garnet yams','jewel yams','orange sweet potato'],
  'green peas': ['peas','frozen peas','frozen green peas','fresh peas','fresh green peas','english peas','garden peas','sweet peas','shelled peas','sugar snap peas','snap peas'],
  // Brussels sprouts spelling variants
  'brussels sprouts': ['brussel sprouts','brussels sprout','sprouts','shaved brussels sprouts','shredded brussels sprouts','halved brussels sprouts','trimmed brussels sprouts'],
  // Parsnips
  'parsnips': ['parsnip','baby parsnips','peeled parsnips','chopped parsnips','diced parsnips','medium parsnips'],
  // Swiss chard
  'swiss chard': ['chard','rainbow chard','red chard','green chard','silverbeet','silver beet'],
  // Green chili — Indian/SE Asian recipes
  'green chili': ['green chilli','green chilies','green chillies','hot green chili','hot green chilli','thai green chili','thai green chilli','serrano','serrano pepper','serranos','green thai chili','indian green chili','indian green chilli','bird\'s eye chili','bird\'s eye chilli'],
  // Curry leaves — fresh/dried both work
  'curry leaves': ['curry leaf','fresh curry leaves','dried curry leaves','curry leaf sprig','indian curry leaves'],
  // Whole spice seeds — added to picker as separate entries because they're
  // genuinely different from the ground form (used for tempering, not blending)
  'cumin seeds': ['whole cumin','whole cumin seeds','jeera seeds'],
  'coriander seeds': ['whole coriander','whole coriander seeds'],
  'mustard seeds': ['black mustard seeds','brown mustard seeds','yellow mustard seeds','rai','indian mustard seeds'],
  'poppy seeds': ['blue poppy seeds','white poppy seeds','khus khus'],
  // Poultry seasoning — vegan-friendly herb blend (sage, thyme, marjoram)
  'poultry seasoning': ['vegan poultry seasoning','herb blend','sage thyme blend'],
  // Peanut oil — used for high-heat frying, mainly Asian recipes
  'peanut oil': ['groundnut oil'],
  // ── Wave 2 alias additions ──
  // British "courgette" = zucchini (US). Critical UK alias.
  'zucchini': ['courgette','courgettes','baby zucchini','baby courgette','small zucchini','small courgette','medium zucchini','green zucchini','yellow zucchini'],
  // Balsamic vinegar variants — white balsamic is a milder, paler version
  // but used the same way; substituting is acceptable for matching purposes.
  'balsamic vinegar': ['white balsamic vinegar','white balsamic','aged balsamic','balsamic glaze','balsamic reduction','balsamic'],
  // Potato variants — red, yukon, fingerling, baby are all interchangeable
  // for matching ("recipe needs red potatoes, user has potatoes" → match).
  'potatoes': ['potato','red potatoes','red potato','yukon gold potatoes','yukon potatoes','yukon gold','fingerling potatoes','baby potatoes','new potatoes','russet potatoes','russet potato','idaho potatoes','white potatoes','small potatoes','medium potatoes','large potatoes','waxy potatoes','floury potatoes','starchy potatoes'],
  // Sesame seeds — white, black, toasted are all sesame seeds for matching
  'sesame seeds': ['white sesame seeds','black sesame seeds','toasted sesame seeds','toasted white sesame seeds','toasted black sesame seeds','raw sesame seeds','hulled sesame seeds','unhulled sesame seeds'],
  // Chile powders — ancho, chipotle, guajillo are technically distinct but
  // serve the same role (smoky/mild heat). For matching, allow a "chili
  // powder" pantry to satisfy these specific chile powder calls.
  'chili powder': ['chilli powder','red chili powder','red chilli powder','hot chili powder','hot chilli powder','mild chili powder','mild chilli powder','ground chili','ground chilli','ancho chile powder','ancho chili powder','ancho powder','chipotle chile powder','chipotle chili powder','chipotle powder','guajillo chile powder','guajillo powder','new mexico chile powder','pasilla chile powder','arbol chile powder'],
  // Bok choy — baby bok choy is just smaller; matches generic bok choy
  'bok choy': ['baby bok choy','pak choi','pak choy','baby pak choi','shanghai bok choy','tatsoi'],
  // Sugar — palm sugar / coconut sugar / jaggery are unrefined sugars used
  // similarly. For matching, the "natural sweetener (any)" catch-all already
  // covers most, but recipes specifying "palm sugar" need the alias.
  'coconut sugar': ['brown sugar','maple syrup','date sugar','raw sugar','palm sugar','jaggery','panela','rapadura','muscovado'],
  // Vegan single cream / heavy cream / whipping cream — all plant cream
  // products usable interchangeably; coconut cream is the most common stand-in.
  'coconut cream': ['vegan single cream','vegan double cream','vegan heavy cream','vegan whipping cream','vegan cream','plant-based cream','plant based cream','dairy-free cream','dairy free cream','non-dairy cream','cashew cream','soy cream','oat cream','full-fat coconut milk thick part'],
  // "cooking oil" bare — falls under any cooking oil but the catch-all is
  // one-way. Make it a direct alias to vegetable oil so it matches.
  // (Already handled by 'any cooking oil' parent → variants. But user without
  // 'any cooking oil' selected still needs match. Adding 'cooking oil' to
  // the vegetable oil group fixes this.)
  // ── Wave 3 ──
  // Rice paper wrappers — same product as rice paper. Brown rice paper too.
  'rice paper': ['rice paper wrappers','rice paper wrapper','spring roll wrappers','spring roll wrapper','summer roll wrappers','vietnamese rice paper','brown rice paper','brown rice paper wrappers','round rice paper'],
  // Vegetable broth ↔ stock cubes / bouillon (bidirectional). Already covered
  // above but adding "vegan stock cube" specifically.
  // (No edit needed — 'vegetable bouillon cube' alias exists)
  // High smoke point oil — generic "use any neutral oil" recipe shorthand
  // Already partially covered by 'vegetable oil' group via wave 2 additions
  // Delicata squash — close cousin of butternut, similar use
  'butternut squash': ['kabocha squash','delicata squash','acorn squash','winter squash','squash','peeled squash','cubed squash','roasted squash'],
  // Red miso paste is distinct from white miso (saltier, more fermented).
  // Recipes specifying red miso want that specifically. Don't auto-equate.
  // But add the "miso paste" parent alias so generic miso pantry covers it.
  'red miso paste': ['red miso','dark miso','aged miso','barley miso','genmai miso'],
  // Cooking oil bare = neutral oil (already in vegetable oil group above)
  // Add 'cooking oil' to vegetable oil group via dedicated entry:
  'any cooking oil': ['coconut oil','olive oil','avocado oil','vegetable oil','canola oil','sunflower oil','grapeseed oil','light oil','neutral oil','oil','cooking oil','frying oil','high smoke point oil','high-smoke-point oil'],
  // ── Wave 4 (final tightening) ──
  // British / regional / spelling variants that don't change identity
  'green chili': ['green chilli','green chilies','green chillies','hot green chili','hot green chilli','thai green chili','thai green chilli','serrano','serrano pepper','serranos','green thai chili','indian green chili','indian green chilli','bird\'s eye chili','bird\'s eye chilli','green chile','green chiles','poblano','poblano chile','poblano pepper','hatch green chile','anaheim chile','anaheim pepper'],
  'allspice': ['all-spice','all spice','jamaican allspice','allspice powder','ground allspice'],
  'sunflower seeds': ['sunflower kernels','hulled sunflower seeds','raw sunflower seeds','toasted sunflower seeds','sunflower seed kernels'],
  'green peas': ['peas','frozen peas','frozen green peas','fresh peas','fresh green peas','english peas','garden peas','sweet peas','shelled peas','sugar snap peas','snap peas','snow peas','mangetout','mange tout','sugarsnap peas'],
  'vegan mayo': ['vegan mayo','vegan mayonnaise','mayo','mayonnaise','vegan mayo*','plant-based mayo','plant based mayo','plant-based mayonnaise','plant based mayonnaise','dairy-free mayo','vegan aioli'],
  'vegan cream cheese': ['vegan cream cheese','dairy-free cream cheese','plant-based cream cheese','vegan ricotta','plant-based ricotta','dairy-free ricotta','vegan cream','cashew cream','tofu ricotta'],
  'pumpkin pie spice': ['pumpkin spice','pumpkin pie spice mix','apple pie spice','mixed spice','speculaas spice','chai spice','warm spice mix','warming spices'],
  'pinto beans': ['pinto bean','pintos','refried beans','refried pinto beans','vegan refried beans'],
  'corn tortillas': ['corn tortilla','blue corn tortillas','yellow corn tortillas','tortilla chips','corn chips','tostadas','tostada shells'],
  // Apple juice — common ingredient especially in baking / sauces.
  // Bidirectional with apple (whole fruit covers juice — you can juice it).
  'apple': ['apples','apple juice','fresh apple juice','unsweetened apple juice','cloudy apple juice','clear apple juice','apple sauce','applesauce','unsweetened applesauce','fresh apple','fuji apple','gala apple','honeycrisp apple','granny smith apple','red apple','green apple'],
  'apple juice': ['unsweetened apple juice','fresh apple juice','cloudy apple juice','clear apple juice'],
  'pineapple': ['fresh pineapple','canned pineapple','pineapple chunks','pineapple rings','pineapple juice','fresh pineapple juice','canned pineapple juice','unsweetened pineapple juice'],
  'pineapple juice': ['fresh pineapple juice','canned pineapple juice','unsweetened pineapple juice'],
  // Kiwi spelling variants
  'kiwi': ['kiwifruit','kiwifruits','kiwi fruit','golden kiwi'],
  // Adzuki / red beans family
  'red beans': ['red bean','adzuki beans','aduki beans','azuki beans','small red beans'],
  // Five-spice alias chain
  'five spice': ['chinese five spice','chinese 5 spice','5-spice','five-spice','five spice powder','chinese five spice powder','5 spice powder'],
  // Apple sauce / applesauce naming
  'applesauce': ['apple sauce','unsweetened applesauce','unsweetened apple sauce','fresh apple sauce'],
  // Coffee variants
  'instant coffee': ['coffee granules','coffee crystals','instant espresso','espresso powder','instant coffee granules','coffee powder'],
  // Salad greens / mixed greens
  'mixed greens': ['salad greens','spring mix','mesclun','assorted salad','assorted salad leaves','salad mix','baby greens','field greens','italian salad mix','mediterranean salad mix'],
  // Salsa / pico de gallo
  'salsa': ['pico de gallo','tomato salsa','red salsa','green salsa','salsa verde','purchased salsa','purchased pico de gallo','jarred salsa','prepared salsa'],
  // Neutral oil expanded (already in vegetable oil group via wave 1)
  // Just add "neutral flavored oil" / "neutral-flavoured oil" UK spelling
  // (vegetable oil already includes 'neutral oil','neutral tasting oil',etc)
  // No new entry needed — let me extend the existing vegetable oil group:
  // Jackfruit in water / brine — same as jackfruit
  'jackfruit': ['young jackfruit','canned jackfruit','green jackfruit','jackfruit in water','jackfruit in brine','jackfruit in salt water'],
  // Mirepoix = onion + carrot + celery (the holy trinity). Best treated as
  // "onion" since onion is the bulk and the most-likely-on-hand component.
  // (We could split into all 3 but combined-ingredient logic complicates
  // matching — simpler to canonicalize to onion.)
  'onion': ['onions','yellow onion','yellow onions','white onion','white onions','sweet onion','sweet onions','spanish onion','vidalia onion','cooking onion','cooking onions','mirepoix','frozen mirepoix','soffritto'],
  // Lasagne (UK spelling) — pasta variant
  // (handled by GF auto-swap which now includes 'lasagna')
  // Suffix-form aliases — recipes often say "X powder/spice" where the bare
  // form is what we have in the pantry. Identity suffix guard would otherwise
  // reject these as different products.
  'matcha': ['matcha powder','matcha green tea','matcha green tea powder','culinary matcha','ceremonial matcha'],
  'berbere': ['berbere spice','berbere powder','berbere blend','berbere seasoning'],
  'za\'atar': ['zaatar','za atar','zaatar spice','za\'atar spice','zaatar blend','za\'atar blend'],
  'psyllium husk': ['psyllium husk powder','psyllium powder','psyllium','whole psyllium husk','psyllium husks'],
  'saffron': ['saffron threads','saffron strands','saffron stamens','spanish saffron','iranian saffron'],
  // Guacamole — most recipes calling for guacamole are dips/toppings; if
  // user has avocado + lime + salt, they can make it. Combined match.
  'guacamole': ['homemade guacamole','prepared guacamole','store-bought guacamole'],
  // Jicama — root vegetable used raw in slaws. No close substitute. Add
  // alias for pluralizations.
  'jicama': ['jicamas','jicama matchsticks','sliced jicama','julienned jicama'],
  // Vegan stock cube — same as vegetable bouillon cube, already aliased
  // under 'vegetable broth' but adding directly:
  'vegetable broth': ['vegetable stock','veggie broth','veggie stock','veg broth','veg stock','vegetable bouillon','vegetable bouillon cube','vegetable bouillon cubes','veggie bouillon','bouillon cube','vegan bouillon','vegetable base','vegan stock cube','vegan stock cubes','vegetable stock cube','vegetable stock cubes','stock cube','stock cubes'],
  // Coconut butter — different from coconut oil but close enough; recipes
  // calling for it can use coconut oil (with adjustment). Match for pantry purposes.
  'coconut oil': ['refined coconut oil','unrefined coconut oil','virgin coconut oil','extra virgin coconut oil','coconut butter','manna coconut'],
  // Celery seed — distinct from celery itself; small jar in spice pantry
  // most cooks don't have. Pure alias for matching when user has celery
  // (recipes typically use it with celery anyway, treat as same family).
  // (Adding to picker may be cleaner — kept here as fallback)

  // Dark muscovado / demerara / turbinado / raw sugar all serve same role
  // as brown sugar in baking. Already partially covered in coconut sugar
  // group — adding "brown sugar" parent group:
  'brown sugar': ['light brown sugar','dark brown sugar','muscovado sugar','dark muscovado sugar','light muscovado sugar','demerara sugar','demerara','turbinado sugar','turbinado','raw cane sugar','rapadura','panela','jaggery','sucanat'],
  // Pul biber = Turkish red pepper flakes (Aleppo / Maras pepper variants)
  // Same product family as red pepper flakes
  'red pepper flakes': ['chili flakes','chilli flakes','crushed red pepper','crushed red pepper flakes','red chili flakes','red chilli flakes','aleppo pepper','red chilli','red chili','hot chilli powder','hot chili powder','pul biber','maras pepper','marash pepper','urfa biber','aleppo flakes','korean chili flakes'],
  // Ginger garlic paste — also matches space-separated form, not just hyphenated
  // (Hyphen→combined regex in matching.js handles "ginger-garlic paste".
  // For "ginger garlic paste" we add a direct combined entry.)

  // Sauerkraut — fermented cabbage, used in topping role similar to kimchi
  // Has standalone identity but recipes can use kimchi as substitute
  'sauerkraut': ['fermented cabbage','raw sauerkraut','unpasteurized sauerkraut'],
  // Chilli paste — blanket category that includes sambal, sriracha, gochujang
  'sriracha / hot sauce': ['sriracha','hot sauce','sambal oelek','chili garlic sauce','gochujang','rooster sauce','sriracha sauce','hot pepper sauce','tabasco','chilli paste','chili paste','red chilli paste','red chili paste','asian chilli paste','asian chili paste'],
};

/**
 * One-way substitutions: if user HAS the left item, it also covers the right items in recipes.
 */
export const INGREDIENT_SUBS = {
  // Liquid cooking oils — interchangeable for sautéing, dressings, frying.
  // Coconut oil is DELIBERATELY excluded: it solidifies at room temp, which
  // is essential for peanut-butter cups, chocolate bark, no-bake bars, energy
  // bites, and anything that needs to "set firm." Liquid oils can't substitute.
  'olive oil':      ['avocado oil','vegetable oil','light oil','neutral oil'],
  // Coconut oil is its own thing — neither donates to nor accepts liquid oils
  // as substitutes. If a recipe calls for it specifically, the user needs it.
  'coconut oil':    [],
  'almond milk':    ['soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'soy milk':       ['almond milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'rice milk':      ['almond milk','soy milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'hemp milk':      ['almond milk','soy milk','rice milk','macadamia milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'macadamia milk': ['almond milk','soy milk','rice milk','hemp milk','pistachio milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'pistachio milk': ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','oat milk','cashew milk','plant milk','plant-based milk'],
  'oat milk':       ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','cashew milk','plant milk','plant-based milk'],
  'cashew milk':    ['almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','plant milk','plant-based milk'],
  // Nut butters have distinct flavors. Peanut butter is iconic; almond
  // butter is mellower and slightly bitter; cashew is sweet and mild.
  // Substituting changes the dish noticeably. No automatic cross-coverage.
  'peanut butter':  [],
  'almond butter':  [],
  'maple syrup': ['agave','agave nectar','agave syrup','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','maple','sugar','coconut nectar','honey'],
  'agave': ['maple syrup','maple','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','agave nectar','agave syrup','sugar','coconut nectar'],
  'natural sweetener (any)': ['maple syrup','maple','agave','agave nectar','agave syrup','coconut sugar','brown sugar','date syrup','monk fruit','allulose','stevia','sweetener','sugar','coconut nectar','raw sugar','cane sugar'],
  // Greens are NOT interchangeable. Different plants, different textures,
  // different cooking behaviors. Spinach wilts in seconds; kale needs
  // massaging or longer cooking. Only keep same-plant variants. Users who
  // want broad coverage can pick "leafy greens (any)" as a staple.
  'spinach': ['baby spinach'],
  'baby spinach': ['spinach'],
  'kale': [],
  // Vinegars are NOT generally interchangeable. Apple cider vinegar is
  // fruity; rice vinegar is mild and slightly sweet; white vinegar is
  // sharp; balsamic is sweet/syrupy. Substituting changes the dish.
  // Lemon juice is a totally different acid. Keep only seasoned/unseasoned
  // rice vinegar pairing since they're effectively the same product.
  'apple cider vinegar': [],
  'rice vinegar': ['seasoned rice vinegar'],
  // Flours behave VERY differently in baking — gluten content, density,
  // moisture absorption all vary. Almond flour can't sub for all-purpose
  // without recipe adjustments. The only safe bidirectional sub is between
  // 1:1 gluten-free blends (which are designed to behave like AP flour).
  'flour': ['all-purpose flour'],
  'all-purpose flour': ['flour'],
  'gluten-free flour': ['1:1 gluten-free flour','gf flour'],
  'cassava flour': [],
  'almond flour': [],
  'oat flour': [],
  'rice flour': [],
  'cornstarch': ['arrowroot powder','tapioca flour','tapioca starch','potato starch','corn starch'],
  'arrowroot powder': ['cornstarch','tapioca flour','tapioca starch','tapioca','arrowroot starch','arrowroot','potato starch'],
  // Vegetable broth/stock are interchangeable. WATER is NOT a substitute —
  // recipes calling for broth want the flavor. Mushroom broth is a different
  // thing (umami-heavy). Removing those false claims.
  'vegetable broth': ['vegetable stock','veggie broth','veggie stock','veg broth','veg stock'],
  'coconut cream': ['coconut milk'],
  // Whole citrus fruit covers juice (you can squeeze it). One-way:
  // bottled juice does NOT cover whole fruit (no zest, no slices, no wedges).
  // Lemon ↔ lime: cross-acceptable since they're similar acidity (with a
  // small flavor adjustment).
  // Lemon ↔ lime cross-substitution: similar acidity, common swap. User with
  // either covers BOTH the whole fruit AND juice/zest forms of either.
  'lemon':  ['lime','lemons','lemon juice','fresh lemon juice','juice of 1 lemon','juice of a lemon','juice of half a lemon','lemon zest','lemon wedges',
             'lime juice','fresh lime juice','juice of 1 lime','juice of a lime','lime zest','lime wedges','tablespoons lemon juice','tbsp lemon juice','tablespoons lime juice','tbsp lime juice'],
  'lime':   ['lemon','limes','lime juice','fresh lime juice','juice of 1 lime','juice of a lime','lime zest','lime wedges',
             'lemon juice','fresh lemon juice','juice of 1 lemon','juice of a lemon','lemon zest','lemon wedges','tablespoons lime juice','tbsp lime juice','tablespoons lemon juice','tbsp lemon juice'],
  'lemon juice': ['lime juice','fresh lemon juice','fresh lime juice','tablespoons lemon juice','tbsp lemon juice','tablespoons lime juice','tbsp lime juice'],
  'lime juice':  ['lemon juice','fresh lime juice','fresh lemon juice','tablespoons lime juice','tbsp lime juice','tablespoons lemon juice','tbsp lemon juice'],
  'orange': ['oranges','orange juice','fresh orange juice','juice of 1 orange','orange zest','orange wedges','tablespoons orange juice','tbsp orange juice'],
  // Cilantro and parsley LOOK alike but taste nothing alike. Cilantro has
  // a citrus-soapy note; parsley is grassy. Substituting changes the dish.
  // Basil is a third totally different herb. No aliases.
  'cilantro': [],
  'lettuce':            ['romaine','iceberg','butter lettuce','bibb lettuce','red leaf lettuce','green leaf lettuce','mixed greens','spring mix'],
  'romaine':            ['lettuce','iceberg','butter lettuce','green leaf lettuce','red leaf lettuce','mixed greens'],
  'iceberg':            ['lettuce','romaine','butter lettuce','green leaf lettuce','red leaf lettuce'],
  'butter lettuce':     ['lettuce','romaine','iceberg','bibb lettuce','green leaf lettuce','red leaf lettuce'],
  'red leaf lettuce':   ['lettuce','romaine','iceberg','green leaf lettuce','butter lettuce','mixed greens'],
  'green leaf lettuce': ['lettuce','romaine','iceberg','red leaf lettuce','butter lettuce','mixed greens'],
  // Mixed greens packages typically contain multiple lettuce types and
  // sometimes baby spinach/arugula — keep the broad expansion since the
  // user explicitly bought "a mix."
  'mixed greens':       ['lettuce','romaine','spring mix','mesclun','arugula','spinach','baby spinach'],
  // Arugula is its own peppery thing — not interchangeable with spinach
  // or generic lettuce in dishes where the flavor matters.
  'arugula':            [],
  // Fresh ginger and ground ginger powder are NOT 1:1 substitutes —
  // ratio is roughly 1 tsp grated fresh = 1/4 tsp powdered. Different
  // intensity, different flavor (fresh is brighter, powder is mellower).
  // Recipes calling for one specifically want it. Only alias the
  // synonymous "ginger root" forms.
  'fresh ginger': ['ginger root','fresh ginger root','minced ginger','grated ginger'],
  'ginger': ['ginger root','minced ginger','grated ginger'],
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
  'GF bread': ['bread','sandwich bread','sourdough bread','white bread','whole wheat bread','pita bread','baguette','thick bread'],
  'GF breadcrumbs': ['breadcrumbs','panko','panko breadcrumbs','bread crumbs'],
  'GF tortillas': ['flour tortillas','tortillas','wraps'],
  'glass noodles': ['noodles','cellophane noodles','bean thread noodles','mung bean noodles','sweet potato noodles'],
  'sea salt': ['kosher salt','fine salt','salt','coarse salt','fine sea salt','flaky salt','table salt'],
  'bay leaves': ['bay leaf'],
  'bell peppers (any)': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','red pepper','green pepper'],
  'bell peppers': ['bell pepper','red bell pepper','green bell pepper','yellow bell pepper','orange bell pepper','red pepper','green pepper'],
  // 'miso paste' bidirectional alias is now in INGREDIENT_ALIASES above.
  // Red/dark miso intentionally NOT in the default group (saltier, bolder).
  // 'red pepper flakes' and 'white beans' duplicates removed — full aliases earlier
  'tapioca flour': ['tapioca starch','arrowroot powder','arrowroot starch','arrowroot','tapioca','potato starch'],
  'jalapeño': ['jalapeno','jalapeños','jalapenos'],
  'balsamic vinegar': ['balsamic glaze','balsamic reduction'],

  // ── Proteins / Beans ──
  // Chickpeas (garbanzo beans) are a DIFFERENT species from white beans
  // — different shape, color, texture, flavor. Not interchangeable.
  'chickpeas': [],
  // Black/pinto/kidney beans are different beans with different colors and
  // mild flavor differences. They DO substitute well in chilis, soups, and
  // burrito bowls — so keep these soft subs. If users want strict, they
  // can add the specific bean they have.
  'black beans': ['pinto beans','kidney beans','red beans'],
  'pinto beans': ['black beans','kidney beans','red beans'],
  'kidney beans': ['black beans','pinto beans','red beans'],
  // Tofu firmness levels are interchangeable as a product family;
  // tempeh is a DIFFERENT product (fermented whole soybeans, dense
  // texture, nutty flavor) — not an honest substitute for tofu.
  'extra-firm tofu': ['firm tofu','super-firm tofu'],
  'firm tofu': ['extra-firm tofu','super-firm tofu'],
  'silken tofu': ['soft tofu'],
  'soft tofu': ['silken tofu'],
  'tempeh': ['soy curls'],
  // Lentil types behave differently:
  //   - Red/yellow lentils dissolve into mush (good for dal, soups)
  //   - Green/brown/french lentils HOLD their shape (good for salads)
  // Cross-substituting changes the dish texture significantly. Only group
  // the truly-equivalent same-color types.
  'green lentils': ['french lentils','french green lentils','du puy lentils'],
  'brown lentils': [],
  'red lentils': ['yellow lentils','split red lentils','masoor dal'],

  // ── Grains / Pasta ──
  // Grains are NOT freely substitutable. Quinoa is a seed (gluten-free,
  // protein-rich, fluffy); couscous is wheat pasta (chewy); farro is wheat
  // berry (chewy, nutty); millet is a grain (mild). Cooking times differ.
  // Subbing changes texture and dietary profile (gluten content matters).
  'quinoa': ['white quinoa','red quinoa','black quinoa','tri-color quinoa'],
  'farro': ['pearled farro','semi-pearled farro'],
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
  // Almonds are tree nuts; peanuts are legumes. Completely different
  // ingredients with allergen implications. Never alias.
  'almonds': [],
  'peanuts': [],
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
  'vegan mayo': ['vegan sour cream'],
  // Wine vinegars are NOT all interchangeable. Red wine vinegar is fruity
  // and bold; white wine is milder; sherry is nutty/sweet; champagne is
  // delicate. Subbing changes the dish notably. Only keep same-category
  // synonyms (champagne ↔ white wine vinegar are very close).
  'red wine vinegar': [],
  'sherry vinegar': ['sherry wine vinegar'],
  'white wine vinegar': ['champagne vinegar'],

  // ── Vegetables ──
  'zucchini': ['yellow squash','summer squash','eggplant'],
  // Sweet potato, pumpkin, butternut squash are ALL different plants with
  // different flavor profiles, water content, and cooking times. They're
  // sometimes substitutable in roasts/soups but the matcher should be
  // honest: if a recipe calls for pumpkin and you only have sweet potato,
  // that's a substitution decision the cook makes — not a 100% match.
  'sweet potato': ['sweet potatoes'],
  'sweet potatoes': ['sweet potato'],
  'butternut squash': ['kabocha squash'],
  // Broccoli and cauliflower are different vegetables. They sometimes
  // cross-substitute in roasted-veg dishes, but they have different flavors,
  // textures, and cooking times. Keep only same-plant variants.
  'cauliflower': ['cauliflower florets'],
  'broccoli': ['broccolini','broccoli florets'],
  // Eggplant is a nightshade; mushrooms are fungi; zucchini is a squash.
  // Three completely different ingredients. Removing cross-aliases.
  'eggplant': [],
  'mushrooms': ['cremini mushrooms','shiitake mushrooms','baby bella mushrooms','portobello mushrooms','white button mushrooms','oyster mushrooms'],
  'cremini mushrooms': ['baby bella mushrooms','white button mushrooms','mushrooms','shiitake mushrooms'],
  'shiitake mushrooms': ['cremini mushrooms','oyster mushrooms','king oyster mushrooms','mushrooms'],
  'celery': ['fennel bulb','celery ribs'],
  'shallot': ['shallots','red onion'],
  'shallots': ['shallot','red onion'],
  // Scallions / green onions / spring onions are the same thing.
  // Bidirectional handled in INGREDIENT_ALIASES above (search for 'green onions').
  // Removed from INGREDIENT_SUBS to avoid one-way coverage gaps.

  // ── Dairy Alternatives ──
  'vegan yogurt': ['coconut yogurt','soy yogurt','cashew yogurt','plant-based yogurt'],
  'vegan cheese': ['nutritional yeast','vegan cheddar','vegan mozzarella'],
  'vegan parmesan': ['nutritional yeast','vegan cheese'],
  'vegan cream cheese': ['cashew cream cheese','vegan cream','vegan sour cream'],
  'vegan sour cream': ['vegan yogurt','cashew cream','vegan cream cheese'],
  // Vegan butter is purpose-built to behave like dairy butter (creamy,
  // solid at room temp, similar fat ratio). It does NOT substitute for
  // liquid oils (olive, avocado) or vice versa. Even coconut oil — which
  // also solidifies — has a different flavor and consistency than vegan
  // butter, so we keep them separate.
  'vegan butter': ['plant butter','plant-based butter','dairy-free butter','vegan margarine'],
  'nutritional yeast': ['vegan parmesan','vegan cheese'],
  'coconut milk': ['coconut cream'],

  // ── Sweeteners (gaps) ──
  'coconut sugar': ['brown sugar','maple syrup','date sugar','raw sugar'],
  'brown sugar': ['coconut sugar','maple syrup','date sugar','muscovado sugar'],
  'powdered sugar': ['blended coconut sugar','powdered monk fruit'],
  'date syrup': ['maple syrup','agave','brown rice syrup','molasses'],
  'medjool dates': ['dates','date paste','date syrup','prunes'],

  // ── Oils (gaps) ──
  // Sesame oil has a distinct nutty flavor — it's NOT a substitute for
  // neutral cooking oils. Toasted sesame is even more distinct (used as
  // finisher/condiment). Peanut oil has its own flavor and is an allergen.
  // Each stays standalone except for the same-product pair.
  'sesame oil': ['untoasted sesame oil'],
  'toasted sesame oil': [],
  // Avocado oil is a liquid neutral oil — interchangeable with other liquid
  // neutral oils for cooking. NOT interchangeable with coconut oil (which
  // solidifies and is needed for set-firm baking).
  'avocado oil': ['vegetable oil','grapeseed oil','canola oil','sunflower oil','light oil','neutral oil'],
  'vegetable oil': ['canola oil','grapeseed oil','sunflower oil','avocado oil','neutral oil'],
  'sunflower oil': ['vegetable oil','grapeseed oil','canola oil','avocado oil'],
  'grapeseed oil': ['sunflower oil','vegetable oil','avocado oil','canola oil'],

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
  'flax seeds': ['flax egg'],   // flax egg is just ground flax + water
  'aquafaba': ['chia egg'],
};

/**
 * Gluten-free swaps — shown inline on recipe cards when GF filter is active.
 */
export const GF_SWAPS = {
  'soy sauce':'tamari or coconut aminos','flour tortillas':'corn or GF tortillas (e.g. Siete)','noodles':'rice noodles',
  'ramen noodles':'rice ramen or GF ramen (e.g. Lotus Foods)','pasta':'GF pasta (e.g. Banza or Barilla GF)','elbow macaroni':'GF elbow pasta (e.g. Barilla GF)',
  'penne pasta':'GF penne (e.g. Barilla GF)','spaghetti':'GF spaghetti (e.g. Banza or Barilla GF)','linguine':'GF linguine (e.g. Barilla GF)',
  'jumbo pasta shells':'GF pasta shells','egg noodles':'rice noodles',
  'breadcrumbs':'GF breadcrumbs (e.g. 4C GF)','panko breadcrumbs':'GF panko (e.g. Jeff Nathan)',
  'all-purpose flour':'1:1 GF flour blend (e.g. Bob\'s Red Mill 1-to-1)',
  'plain flour':'1:1 GF flour blend (e.g. Bob\'s Red Mill 1-to-1)',
  'flour':'1:1 GF flour blend (e.g. Bob\'s Red Mill 1-to-1)',
  'wheat flour':'1:1 GF flour blend (e.g. Bob\'s Red Mill 1-to-1)',
  'spelt flour':'1:1 GF flour blend (e.g. Bob\'s Red Mill 1-to-1)',
  'whole wheat flour':'GF whole wheat-style blend (e.g. King Arthur Measure for Measure)',
  'bread flour':'GF bread flour + xanthan gum (e.g. King Arthur GF)',
  'self-rising flour':'GF self-rising flour (e.g. Bob\'s Red Mill GF Self-Rising)',
  'pastry flour':'GF pastry flour (e.g. Cup4Cup)',
  'whole wheat pastry flour':'GF pastry flour (e.g. Cup4Cup)',
  'bread':'GF bread (e.g. Canyon Bakehouse)','wheat bread':'GF bread (e.g. Canyon Bakehouse)','white bread':'GF bread (e.g. Canyon Bakehouse)',
  'whole wheat bread':'GF bread (e.g. Canyon Bakehouse)','sandwich bread':'GF bread (e.g. Canyon Bakehouse)',
  'naan':'GF naan (e.g. Against the Grain)','flatbread':'GF flatbread (e.g. Schar)','ciabatta':'GF ciabatta (e.g. Schar)',
  'focaccia':'GF focaccia','croutons':'GF croutons (e.g. Olivia\'s Croutons GF)','dinner rolls':'GF dinner rolls (e.g. Schar)',
  'hamburger buns':'GF burger buns (e.g. Canyon Bakehouse)','hot dog buns':'GF hot dog buns (e.g. Canyon Bakehouse)',
  'burger buns':'GF burger buns (e.g. Canyon Bakehouse)','baguette':'GF baguette (e.g. Schar)','sourdough bread':'GF sourdough (e.g. Canyon Bakehouse)',
  'thick bread':'GF bread (e.g. Canyon Bakehouse)','pita bread':'GF pita (e.g. Schar)','gyoza wrappers':'rice paper wrappers',
  'dumpling wrappers':'rice paper wrappers','ladyfinger biscuits':'GF ladyfingers',
  'phyllo dough':'GF phyllo dough','seitan':'extra firm tofu','couscous':'quinoa','barley':'brown rice or millet',
  'penne':'GF penne (e.g. Barilla GF)','fusilli':'GF fusilli (e.g. Barilla GF)','fettuccine':'GF fettuccine (e.g. Barilla GF)',
  'udon noodles':'rice noodles or GF udon (e.g. Lotus Foods)','udon':'rice noodles or GF udon','soba noodles':'100% buckwheat soba (e.g. King Soba)','soba':'100% buckwheat soba (e.g. King Soba)',
  'panko':'GF panko (e.g. Jeff Nathan)','pie crust':'GF pie crust (e.g. Wholly Wholesome)','pizza dough':'GF pizza dough (e.g. Simple Mills)','pastry':'GF pastry',
  'ramen':'rice ramen (e.g. Lotus Foods)','orzo':'GF orzo (e.g. DeLallo GF)',
  'farro':'quinoa or brown rice',
  // Macaroni / pasta variants — must always trigger purple GF swap chip
  'macaroni':'GF macaroni (e.g. Banza or Barilla GF)','wheat macaroni':'GF macaroni (e.g. Banza or Barilla GF)','whole wheat macaroni':'GF macaroni (e.g. Banza or Barilla GF)',
  'wheat pasta':'GF pasta (e.g. Banza or Barilla GF)','whole wheat pasta':'GF pasta (e.g. Banza or Barilla GF)',
  'wheat penne':'GF penne (e.g. Barilla GF)','whole wheat penne':'GF penne (e.g. Barilla GF)',
  'wheat spaghetti':'GF spaghetti (e.g. Banza or Barilla GF)','whole wheat spaghetti':'GF spaghetti (e.g. Banza or Barilla GF)',
  'wheat noodles':'rice noodles or GF noodles','whole wheat noodles':'rice noodles or GF noodles',
  'wheat tortillas':'GF or corn tortillas (e.g. Siete)','whole wheat tortillas':'GF or corn tortillas (e.g. Siete)',
  'lasagne':'GF lasagne (e.g. Barilla GF)','lasagne sheets':'GF lasagne sheets',
  'tagliatelle':'GF tagliatelle (e.g. Le Veneziane)','pappardelle':'GF pappardelle','rigatoni':'GF rigatoni (e.g. Barilla GF)','rotini':'GF rotini (e.g. Barilla GF)',
  'angel hair':'GF angel hair (e.g. Barilla GF)','farfalle':'GF farfalle (e.g. Barilla GF)','ditalini':'GF ditalini',
  'gnocchi':'GF gnocchi (e.g. Cappello\'s) or potato gnocchi',
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
  'agave':'allulose syrup',
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
 * Hard-gluten ingredient regex — matches structural gluten ingredients with no
 * viable GF substitute. Recipes containing any of these are excluded from
 * results because HARVEST is gluten-free by default.
 *
 * EXCLUDED from filter (these have working GF substitutes via _GF_MATCH_SWAPS):
 *   spelt flour, all-purpose flour, whole wheat flour, bread flour, etc.
 *   pasta variants (penne, fusilli, tagliatelle, orzo, etc.)
 *   bread, breadcrumbs, panko, tortillas, pita
 *   noodles (ramen, udon, soba)
 *
 * INCLUDED in filter (no viable GF version, OR substitution changes the dish):
 *   farro, bulgur, barley, wheat berries, freekeh, kamut, einkorn
 *   couscous (all variants), seitan, vital wheat gluten
 *   semolina, durum, rye, spelt berries
 *   shaoxing wine, beer/lager/ale/stout/pilsner/ipa, malt
 */
export const HARD_GLUTEN_REGEX = (() => {
  const terms = [
    'farro', 'pearled farro',
    'bulgur', 'bulgur wheat', 'cracked wheat',
    'barley', 'pearl barley', 'pearled barley',
    'wheat berries', 'wheat berry', 'hard wheat', 'soft wheat',
    'freekeh', 'kamut', 'einkorn',
    'couscous', 'whole wheat couscous', 'pearl couscous', 'israeli couscous', 'moroccan couscous',
    'seitan', 'vital wheat gluten', 'wheat gluten',
    'semolina', 'durum wheat', 'durum flour',
    'spelt berries', 'spelt grain',
    'rye flour', 'rye bread', 'rye berries', 'rye',
    'shaoxing wine', 'shaoxing rice wine', 'shaoxing cooking wine', 'chinese cooking wine', 'rice cooking wine',
    'wheat starch', 'wheat flakes',
    'beer', 'lager', 'stout', 'pilsner',
    'malt extract', 'malt syrup', 'malted barley',
  ];
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = [
    ...terms.map(t => `\\b${escape(t)}\\b`),
    // Bare "spelt" only when NOT followed by "flour" (spelt flour swaps fine)
    String.raw`\bspelt\b(?!\s+flour)`,
    // "ale" but not "ginger ale" (soda, no gluten)
    String.raw`(?<!ginger\s)\bale\b`,
    // "ipa" beer
    String.raw`\bipa\b`,
    // bare "malt" but not "malt vinegar" (vinegar is GF in practice)
    String.raw`\bmalt\b(?!\s+vinegar)`,
  ];
  return new RegExp(parts.join('|'), 'i');
})();

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
  'gluten':     ['flour','all-purpose flour','wheat flour','whole wheat flour','bread flour','spelt flour','self-rising flour','pasta','spaghetti','penne','fusilli','fettuccine','linguine','noodles','ramen','udon','soba','couscous','barley','breadcrumbs','panko','pita bread','flour tortillas','pie crust','pizza dough','pastry'],
};

/**
 * Quick-add ingredient panels — staples organized by category.
 */
export const QA_ITEMS = [
  {cat:'🫘 Beans & Legumes',     items:['chickpeas','black beans','lentils','kidney beans','cannellini beans','great northern beans','navy beans','butter beans','lima beans','pinto beans','mung beans','split peas','black-eyed peas','firm tofu','extra-firm tofu','soft tofu','silken tofu','tempeh','edamame','jackfruit','TVP','soy curls']},
  {cat:'🌾 Grains & Starches',  items:['GF pasta (any)','rice (any)','quinoa','oats','millet','sweet potatoes','potatoes','corn tortillas','polenta','cornmeal','masa harina','buckwheat','rice noodles','glass noodles','nori','gnocchi','GF bread','GF breadcrumbs','GF tortillas']},
  {cat:'🥦 Vegetables',         items:['garlic','yellow onion','white onion','red onion','fresh ginger','spinach','kale','carrots','celery','broccoli','cauliflower','bell peppers','mushrooms (any)','tomatoes','cherry tomatoes','avocado','zucchini','corn','cucumber','green onions','eggplant','cabbage','butternut squash','pumpkin','pumpkin puree','arugula','leeks','collard greens','lettuce (any)','green beans','asparagus','green peas','brussels sprouts','parsnips','swiss chard','bok choy','turnip','pickles','okra','jicama','kimchi','jalapeño','green chili','beets','radishes','artichoke hearts','bean sprouts','bamboo shoots','shallots']},
  {cat:'🍋 Fruits',             items:['lemon','lime','banana','berries (any)','cranberries','cherries','mango','apple','oranges','orange juice','pineapple','peaches','pears','kiwi','papaya','pomegranate','plantain','figs','grapes','watermelon','coconut','dates','raisins','dried apricots','date paste']},
  {cat:'🥜 Nuts & Seeds',       items:['nut butter (any)','cashews','almonds','walnuts','pecans','brazil nuts','macadamia nuts','hazelnuts','pistachio','peanuts','sesame seeds','pine nuts','tahini','hemp seeds','chia seeds','flax seeds','pumpkin seeds','sunflower seeds','protein powder']},
  {cat:'🥛 Plant-Based Dairy',  items:['almond milk','soy milk','rice milk','hemp milk','macadamia milk','pistachio milk','oat milk','cashew milk','vegan yogurt','vegan cream cheese','vegan parmesan','vegan feta','vegan cheese','nutritional yeast']},
  {cat:'🫒 Oils & Fats',         items:['olive oil','coconut oil','avocado oil','sesame oil','chili oil','vegan butter','vegetable oil','toasted sesame oil','sunflower oil','grapeseed oil','peanut oil']},
  {cat:'🥫 Canned & Jarred',    items:['canned tomatoes (any)','tomato sauce','tomato paste','vegetable broth',{name:'coconut milk',hint:'the canned kind, for curries & sauces'},'olives','artichoke hearts','roasted red peppers','sun-dried tomatoes','capers','salsa','hummus','sauerkraut','instant coffee','cooking spray','hearts of palm','yellow cornmeal']},
  {cat:'🫙 Sauces & Condiments', items:['tamari / coconut aminos','miso paste','vegan mayo','ketchup','yellow mustard','dijon mustard','BBQ sauce','hoisin sauce','vegan worcestershire','tamarind paste','harissa paste','gochujang','sriracha / hot sauce','sambal oelek','curry paste','liquid smoke','vegan sour cream','nutritional yeast','tahini','nut butter (any)','cornstarch','arrowroot powder']},
  {cat:'🍯 Sweeteners & Vinegars', items:['maple syrup','natural sweetener (any)','agave nectar','coconut sugar','brown sugar','cane sugar','powdered sugar','date syrup','molasses','coconut nectar','allulose','stevia / monk fruit','apple cider vinegar','rice vinegar','balsamic vinegar','white vinegar','red wine vinegar','white wine vinegar','sherry vinegar','red wine','white wine']},
  {cat:'🧂 Baking & Flours',    items:['baking soda','baking powder','cornstarch','arrowroot powder','gluten-free flour','almond flour','coconut flour','oat flour','tapioca flour','brown rice flour','chickpea flour','cassava flour','flaxseed meal','applesauce','aquafaba','agar powder','psyllium husk','xanthan gum','almond extract','vanilla extract','cocoa powder','coconut oil','vegan butter','matcha','cream of tartar','active dry yeast','protein powder']},
  {cat:'🌿 Spices & Herbs',     items:['turmeric','cumin','smoked paprika','cinnamon','chili powder','ginger','curry powder','black pepper','white pepper','garlic powder','onion powder','oregano','basil','thyme','sage','coriander','cayenne','cilantro','parsley','cardamom','cloves','allspice','bay leaves','five spice','nutmeg','sea salt','garam masala','lemongrass','star anise','dill','mint','chives','rosemary','red pepper flakes','fennel seeds','cumin seeds','coriander seeds','mustard seeds','poppy seeds','caraway seeds','poultry seasoning','saffron','za\'atar','berbere','sumac','italian seasoning','pumpkin pie spice','taco seasoning']},
  {cat:'🍨 Dessert Pantry',     items:['vanilla extract','almond extract','cocoa powder','chocolate chips (any)','white chocolate chips','dark chocolate','cacao nibs','cacao butter',{name:'coconut milk',hint:'the canned kind, for puddings, ice cream & baking'},{name:'coconut cream',hint:'thicker than coconut milk, for whipped toppings & rich desserts'},'coconut oil','shredded coconut','almond flour','maple syrup','dates','brown sugar','molasses','cinnamon','nutmeg','date sugar','allulose','stevia / monk fruit']},
  {cat:'🍱 Asian Specialty',    items:['mirin','gochugaru','vegan oyster sauce','shichimi togarashi','furikake','kombu','kala namak','curry leaves','galangal','fenugreek','fenugreek seeds','chana dal','gochujang paste','wasabi','vegan fish sauce','daikon','yuzu','wakame','rice paper']},
];

/**
 * Perishable ingredients — shown in the "Fresh This Week" quick-add panel.
 */
export const PERISHABLES = [
  {cat:'🥬 Leafy Greens', items:['spinach','baby spinach','kale','arugula','mixed greens','romaine','bok choy','collard greens','chard']},
  {cat:'🥒 Vegetables', items:['cucumber','bell peppers (any)','fresh tomatoes','cherry tomatoes','zucchini','broccoli','cauliflower','asparagus','celery','fresh carrots','red cabbage','fresh green beans','fresh corn','eggplant','fresh mushrooms','bean sprouts','snap peas','fresh jalapeño']},
  {cat:'🧅 Onions', items:['red onion','yellow onion','white onion','spring onion','scallions','shallots','leeks']},
  {cat:'🍓 Fruits', items:['berries (any)','fresh mango','banana','fresh apple','fresh peaches','fresh pears','grapes','lemon','lime','avocado']},
];
