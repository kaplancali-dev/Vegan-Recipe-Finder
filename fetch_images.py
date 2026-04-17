#!/usr/bin/env python3
"""
Fetch og:image URLs for all HARVEST recipes that are missing images.
Run this on your Mac: python3 fetch_images.py
It will create a file called 'image_results.txt' with ID|IMAGE_URL pairs.
"""

import re
import json
import time
import sys

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing beautifulsoup4...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"])
    from bs4 import BeautifulSoup

# All 234 recipes missing images: (id, title, url)
RECIPES = [
    (248, "Roasted Beet and Lentil Salad", "https://www.washingtonpost.com/recipes/roasted-beet-and-lentil-salad/"),
    (254, "Spiced Sweet Potato Bowl", "https://cookingforconnections.com/warm-moroccan-spiced-sweet-potato-bowl/"),
    (255, "Beetroot Soup with Coconut", "https://wordsmithkaur.com/vegan-beetroot-soup-with-coconut-milk/"),
    (258, "Roasted Carrot and Lentil Salad", "https://ourkitchenrecipe.com/roasted-carrot-and-lentil-salad/"),
    (259, "Spiced Chickpea Stew", "https://www.veggieinspired.com/spiced-chickpea-stew/"),
    (279, "Jackfruit Rendang", "https://mygreenpassion.com/vegan-jackfruit-rendang/"),
    (282, "Vegan Moussaka", "https://minimalistbaker.com/easy-vegan-moussaka/"),
    (288, "Lentil Power Bowl", "https://greenletes.com/greek-lentil-power-bowl-3/"),
    (291, "Crispy Chickpea Buddha Bowl", "https://southerndishes.com/crispy-chickpea-buddha-bowl-nutritious-delight/"),
    (292, "Sweet Potato Buddha Bowl", "https://betterhomerecipes.com/easy-sweet-potato-buddha-bowl-that-will-boost-your-energy/"),
    (293, "Vegan Thai Curry", "https://nosweatvegan.com/vegan-thai-curry-recipe/"),
    (294, "Mushroom and Spinach Pasta", "https://flavorfulside.com/creamy-mushroom-and-spinach-pasta/"),
    (296, "Quinoa Power Bowl", "https://pigsaresmart.com/recipes/quinoa-power-bowl/"),
    (297, "Green Curry Noodles", "https://www.skinnytaste.com/green-curry-noodles/"),
    (302, "Cashew Queso Dip", "https://thenessykitchen.com/cashew-queso/"),
    (303, "Lemon Tahini Sauce", "https://minimalistbaker.com/gingery-lemon-tahini-sauce/"),
    (304, "5-Minute Guacamole", "https://kitrusy.com/5-minute-guacamole/"),
    (305, "Easy Marinara Sauce", "https://www.simplejoy.com/easy-marinara-sauce-recipe/"),
    (306, "Vegan Ranch Dressing", "https://minimalistbaker.com/easy-vegan-ranch-dressing-oil-free/"),
    (307, "Peanut Sauce", "https://minimalistbaker.com/5-ingredient-peanut-sauce/"),
    (308, "Vegan Tzatziki", "https://minimalistbaker.com/6-ingredient-vegan-tzatziki/"),
    (309, "Chipotle Mayo", "https://www.tastingtable.com/1826738/chipotle-mayo-recipe/"),
    (3001, "1-Bowl Vegan Gluten-Free Banana Bread", "https://minimalistbaker.com/1-bowl-vegan-gluten-free-banana-bread/"),
    (3002, "Gluten-Free Vegan Banana Bread", "https://www.noracooks.com/gluten-free-vegan-banana-bread/"),
    (3003, "Fluffy Vegan Banana Bread", "https://frommybowl.com/fluffy-banana-bread/"),
    (3004, "Best Vegan Gluten-Free Zucchini Bread", "https://minimalistbaker.com/best-vegan-gluten-free-zucchini-bread/"),
    (3005, "1-Bowl Vegan Gluten-Free Pumpkin Bread", "https://minimalistbaker.com/1-bowl-pumpkin-bread-v-gf/"),
    (3006, "1-Bowl Fudgy Banana Chocolate Chip Muffins", "https://minimalistbaker.com/1-bowl-fudgy-banana-chocolate-chip-muffins-vegan-gf/"),
    (3007, "Vegan Meyer Lemon Poppy Seed Muffins", "https://minimalistbaker.com/vegan-meyer-lemon-poppy-seed-muffins/"),
    (3008, "Vegan Gluten-Free Cornbread", "https://minimalistbaker.com/the-best-vegan-gluten-free-cornbread/"),
    (3009, "Gluten-Free Jalapeno Cornbread Muffins", "https://minimalistbaker.com/gluten-free-jalapeno-cornbread-muffins/"),
    (3010, "Best Gluten-Free Bread", "https://minimalistbaker.com/the-best-gluten-free-bread-no-knead/"),
    (3011, "Crusty Vegan Gluten-Free Artisan Bread", "https://minimalistbaker.com/crusty-gluten-free-artisan-bread/"),
    (3012, "Easy Gluten-Free Sandwich Bread", "https://theloopywhisk.com/2019/10/05/best-gluten-free-bread/"),
    (3013, "Ultimate Vegan Gluten-Free Bagels", "https://minimalistbaker.com/the-ultimate-gluten-free-bagels-vegan/"),
    (3014, "Easy Vegan Gluten-Free Biscuits", "https://minimalistbaker.com/easy-vegan-gluten-free-biscuits/"),
    (3015, "Blueberry Gluten-Free Vegan Scones", "https://minimalistbaker.com/blueberry-gluten-free-scones/"),
    (3016, "1-Bowl Cranberry Orange Scones", "https://minimalistbaker.com/cranberry-orange-scones-vegan-gf/"),
    (3017, "Artisan Gluten-Free Dinner Rolls", "https://minimalistbaker.com/artisan-gluten-free-dinner-rolls/"),
    (3018, "Gluten-Free Hamburger Buns", "https://minimalistbaker.com/gluten-free-hamburger-buns-vegan/"),
    (3019, "Gluten-Free Cinnamon Rolls", "https://minimalistbaker.com/vegan-gluten-free-cinnamon-rolls/"),
    (3020, "Vegan Gluten-Free English Muffins", "https://minimalistbaker.com/vegan-gluten-free-english-muffins/"),
    (3021, "Fluffy Gluten-Free Naan", "https://minimalistbaker.com/fluffy-gluten-free-naan/"),
    (3022, "3-Ingredient Cassava Flour Tortillas", "https://minimalistbaker.com/cassava-flour-tortillas-grain-free/"),
    (3023, "Fluffy Gluten-Free Focaccia Bread", "https://minimalistbaker.com/fluffy-gluten-free-focaccia-bread/"),
    (3024, "1-Bowl Vegan Gluten-Free Crackers", "https://minimalistbaker.com/1-bowl-vegan-gluten-free-crackers/"),
    (3025, "Gluten-Free Vegan Flatbread", "https://minimalistbaker.com/gluten-free-flatbread-1-bowl-20-minutes/"),
    (3026, "Sheet Pan Meal Curried Sweet Potato", "https://minimalistbaker.com/sheet-pan-meal-curried-sweet-potato-chickpeas/"),
    (3027, "Vegan Burrito Bowl Meal Prep", "https://rainbowplantlife.com/vegan-burrito-bowl/"),
    (3028, "One-Pot Tomato Chickpea Stew", "https://www.pickuplimes.com/recipe/one-pot-tomato-chickpea-stew-35"),
    (3029, "Sweet Potato Chickpea Buddha Bowl", "https://minimalistbaker.com/sweet-potato-chickpea-buddha-bowl/"),
    (3030, "Vegan Meal Prep Taco Bowls", "https://www.eatingbirdfood.com/vegan-taco-meal-prep/"),
    (3031, "Mediterranean Cucumber Chickpea Salad", "https://minimalistbaker.com/mediterranean-inspired-cucumber-chickpea-salad/"),
    (3033, "Vegan Sushi Bowl Meal Prep", "https://www.pickuplimes.com/recipe/deconstructed-sushi-bowl-with-sweet-sesame-dressing-231"),
    (3034, "Lentil Meal Prep Power Bowl", "https://rainbowplantlife.com/mediterranean-lentil-and-grain-bowls/"),
    (3036, "Chana Dal Sweet Potato Chowder", "https://simple-veganista.com/chana-dal-sweet-potato-chowder/"),
    (3037, "Crispy Baked Tofu", "https://www.noracooks.com/crispy-baked-tofu/"),
    (3038, "Black Bean Quinoa Meal Prep", "https://www.eatingbirdfood.com/southwestern-quinoa-salad/"),
    (3039, "Vegan Freezer Breakfast Burritos", "https://frommybowl.com/sheet-pan-vegan-breakfast-burritos/"),
    (3041, "Vegan Chickpea Salad", "https://lovingitvegan.com/vegan-chickpea-salad/"),
    (3042, "Vegan BLT Sandwich", "https://www.noracooks.com/vegan-blt/"),
    (3046, "Vegan Sloppy Joes", "https://lovingitvegan.com/vegan-sloppy-joes/"),
    (3047, "Chickpea Chopped Kale Salad", "https://minimalistbaker.com/chickpea-chopped-kale-salad-with-adobo-dressing/"),
    (3048, "Vegan Pulled Mushroom Sandwiches", "https://jessicainthekitchen.com/vegan-pulled-pork-sandwiches/"),
    (3049, "Cauliflower Vegan Banh Mi Sandwich", "https://minimalistbaker.com/cauliflower-banh-mi/"),
    (3052, "Vegan Spinach Artichoke Dip", "https://minimalistbaker.com/cheesy-vegan-spinach-artichoke-dip/"),
    (3053, "Vegan Stuffed Mushrooms", "https://www.noracooks.com/stuffed-mushrooms/"),
    (3054, "Crispy Buffalo Cauliflower Wings", "https://minimalistbaker.com/crispy-breaded-cauliflower-wings/"),
    (3055, "Easy Vegan Queso", "https://minimalistbaker.com/5-minute-vegan-cashew-queso/"),
    (3056, "Vegan Summer Rolls", "https://lovingitvegan.com/vegan-spring-rolls/"),
    (3057, "Vegan Fresh Spring Rolls", "https://www.pickuplimes.com/recipe/rainbow-summer-rolls-with-a-tangy-nut-free-dipping-sauce-236"),
    (3058, "Vegan Jalapeno Poppers", "https://www.noracooks.com/vegan-jalapeno-poppers/"),
    (3059, "Vegan Meatballs", "https://minimalistbaker.com/easy-lentil-meatballs/"),
    (3060, "How to Make Hummus from Scratch", "https://minimalistbaker.com/how-to-make-hummus-from-scratch/"),
    (3061, "Vegan Nachos Supreme", "https://rainbowplantlife.com/vegan-nachos/"),
    (3062, "Vegan 7-Layer Dip", "https://www.noracooks.com/vegan-7-layer-dip/"),
    (3063, "Roasted Curry Cauliflower", "https://frommybowl.com/roasted-curry-cauliflower-recipe/"),
    (3064, "Easy Seitan Steaks", "https://www.noracooks.com/vegan-steak/"),
    (3065, "Vegan Chicken Nuggets", "https://lovingitvegan.com/vegan-chicken-nuggets/"),
    (3066, "Vegan Shepherds Pie", "https://www.noracooks.com/vegan-shepherds-pie-meaty/"),
    (3067, "Jackfruit Pulled Pork", "https://minimalistbaker.com/bbq-jackfruit-sandwiches-with-avocado-slaw/"),
    (3068, "Sausage Fennel Pasta", "https://rainbowplantlife.com/sausage-fennel-pasta-with-crushed-tomato-sauce/"),
    (3069, "Tofu Scramble", "https://minimalistbaker.com/southwest-tofu-scramble/"),
    (3070, "Vegan Meatloaf", "https://www.noracooks.com/vegan-meatloaf/"),
    (3071, "Vegan Salami", "https://lovingitvegan.com/vegan-salami/"),
    (3072, "Tempeh Bacon", "https://minimalistbaker.com/easy-tempeh-bacon/"),
    (3073, "Sausage Fennel Pasta 2", "https://rainbowplantlife.com/sausage-fennel-pasta-with-crushed-tomato-sauce/"),
    (3074, "Buffalo Cauliflower Chickpea Casserole", "https://frommybowl.com/buffalo-cauliflower-chickpea-casserole/"),
    (3075, "Shiitake Mushroom Bacon", "https://minimalistbaker.com/quick-crispy-shiitake-bacon/"),
    (3076, "Crispy BBQ Tofu", "https://lovingitvegan.com/bbq-tofu/"),
    (3080, "Gingery Smashed Cucumber Salad", "https://minimalistbaker.com/gingery-smashed-cucumber-salad-asian-inspired/"),
    (3083, "Vegetable Korean Pancakes", "https://www.barrelleaf.com/en/vegetable-korean-pancake"),
    (3084, "Vegan Crispy Korean BBQ Tofu", "https://www.rabbitandwolves.com/vegan-crispy-korean-bbq-tofu/"),
    (3085, "Vegan Sundubu Jjigae", "https://thecheaplazyvegan.com/vegan-sundubu-jjigae/"),
    (3086, "Vegan Bacon", "https://lovingitvegan.com/vegan-bacon/"),
    (3087, "Green Smoothie", "https://minimalistbaker.com/the-easiest-green-smoothie/"),
    (3088, "Golden Milk Latte", "https://minimalistbaker.com/5-minute-vegan-golden-milk/"),
    (3089, "Vegan Hot Chocolate", "https://lovingitvegan.com/vegan-hot-chocolate/"),
    (3090, "Chocolate Peanut Butter Smoothie", "https://www.noracooks.com/chocolate-peanut-butter-smoothie/"),
    (3091, "Peach Bubble Tea", "https://www.frommybowl.com/peach-bubble-tea-recipe-boba/"),
    (3092, "Easy Vegan Curry", "https://lovingitvegan.com/vegan-curry/"),
    (3093, "Berry Beet Smoothie", "https://minimalistbaker.com/beet-berry-smoothie/"),
    (3094, "Coconut Matcha Latte", "https://www.pickuplimes.com/recipe/coconut-matcha-latte-235"),
    (3095, "How to Make the Perfect Smoothie", "https://rainbowplantlife.com/how-to-make-the-perfect-smoothie/"),
    (3096, "Vegan Pumpkin Spice Latte", "https://minimalistbaker.com/vegan-pumpkin-spice-latte/"),
    (3097, "Tropical Green Smoothie", "https://jessicainthekitchen.com/tropical-green-smoothie/"),
    (3098, "Coconut Bacon", "https://minimalistbaker.com/coconut-bacon/"),
    (3101, "Tempeh Bacon", "https://rainbowplantlife.com/tempeh-bacon/"),
    (3103, "Seitan Bacon Strips", "https://lovingitvegan.com/vegan-seitan-bacon/"),
    (3104, "Vegan Bacon Rice Paper", "https://jessicainthekitchen.com/rice-paper-bacon/"),
    (3105, "Cashew Mozzarella", "https://minimalistbaker.com/cashew-mozzarella/"),
    (3106, "Vegan Ricotta", "https://www.noracooks.com/vegan-ricotta/"),
    (3107, "Vegan Feta Cheese", "https://lovingitvegan.com/vegan-feta-cheese/"),
    (3108, "Vegan Parmesan", "https://minimalistbaker.com/vegan-parmesan-cheese/"),
    (3109, "Fermented Cashew Cheese", "https://rainbowplantlife.com/fermented-cashew-cheese/"),
    (3110, "Vegan Cream Cheese", "https://jessicainthekitchen.com/the-best-vegan-cream-cheese/"),
    (3111, "Vegan Pho", "https://rainbowplantlife.com/vegan-pho/"),
    (3113, "Easy Vegan Thai Red Curry With Tofu", "https://jessicainthekitchen.com/vegan-thai-red-curry-with-tofu/"),
    (3114, "Easy Vegan Curry", "https://lovingitvegan.com/vegan-curry/"),
    (3116, "Vegan Mac and Cheese", "https://www.noracooks.com/vegan-mac-and-cheese/"),
    (3119, "Vegan Miso Soup", "https://minimalistbaker.com/10-minute-miso-soup/"),
    (3120, "Vegan Teriyaki Tofu", "https://lovingitvegan.com/vegan-teriyaki-tofu/"),
    (3122, "Vegan Thai Green Curry", "https://minimalistbaker.com/thai-green-curry/"),
    (3124, "Chickpea Shawarma Sandwich", "https://minimalistbaker.com/chickpea-shawarma-sandwich/"),
    (3125, "Crispy Tofu Sandwich", "https://rainbowplantlife.com/tofu-sandwich/"),
    (3126, "Chickpea Salad Sandwich", "https://rainbowplantlife.com/chickpea-salad-sandwich/"),
    (3127, "Smoky Chipotle Tofu Sandwich", "https://simple-veganista.com/smoky-chipolte-maple-tofu-sandwic/"),
    (3128, "Best Veggie Hummus Sandwich", "https://simple-veganista.com/favorite-summer-sandwic/"),
    (3129, "Vegan Kimchi Fried Rice", "https://thekoreanvegan.com/vegan-kimchi-fried-rice/"),
    (3130, "Vegan Japchae", "https://thekoreanvegan.com/health-and-easy-vegan-japchae/"),
    (3131, "Vegan Doenjang Jjigae", "https://thekoreanvegan.com/best-doenjang-jjigae-spicy-and-delicious/"),
    (3132, "Vegan Bibimbap with Crispy Gochujang Cauliflower", "https://www.hotforfoodblog.com/recipes/2018/09/18/vegan-bibimbap-with-crispy-gochujang-cauliflower/"),
    (3133, "Vegan Fried Chicken", "https://www.noracooks.com/vegan-fried-chicken/"),
    (3134, "Vegan Jambalaya", "https://www.noracooks.com/vegan-jambalaya/"),
    (3135, "Vegan Cornbread", "https://www.noracooks.com/the-best-vegan-cornbread/"),
    (3136, "Tempeh Bacon", "https://www.eatingbirdfood.com/tempeh-bacon/"),
    (3137, "Lemongrass Tofu", "https://frommybowl.com/lemongrass-tofu-vegan/"),
    (3138, "Vegan Summer Rolls with Braised Tofu", "https://frommybowl.com/vegan-summer-rolls-recipe/"),
    (3139, "Ultimate Mediterranean Bowl", "https://minimalistbaker.com/the-ultimate-mediterranean-bowl/"),
    (3140, "Vegan Thai Red Curry", "https://www.noracooks.com/red-thai-curry-vegetables/"),
    (3141, "20 Minute High Protein Vegan Meals", "https://rainbowplantlife.com/20-minute-high-protein-vegan-meals/"),
    (3142, "Vegan Chicken Salad", "https://lovingitvegan.com/vegan-chicken-salad/"),
    (3143, "AMAZING Vegan Fried Chicken Recipe", "https://thekoreanvegan.com/amazing-vegan-fried-chicken-recipe/"),
    (3144, "Red Beans and Rice", "https://www.mississippivegan.com/red-beans-and-rice/"),
    (3145, "Eggplant Bacon", "https://www.veganblueberry.com/eggplant-bacon/"),
    (3146, "Carrot Bacon", "https://www.theedgyveg.com/2020/05/05/carrot-bacon/"),
    (4001, "Vegan Moussaka", "https://www.lazycatkitchen.com/vegan-moussaka/"),
    (4002, "Vegan Spanakopita", "https://schoolnightvegan.com/home/vegan-spanakopita/"),
    (4003, "Vegan Souvlaki", "https://myveganminimalist.com/vegan-souvlaki/"),
    (4004, "Vegan Gyros", "https://www.lazycatkitchen.com/vegan-gyros/"),
    (4005, "Greek Salad with Vegan Feta", "https://www.lazycatkitchen.com/greek-salad-vegan-feta/"),
    (4006, "Vegan Baklava", "https://cardamomandtea.com/12572/vegan-baklava-the-easy-way/"),
    (4007, "Vegan Pastitsio", "https://www.lazycatkitchen.com/vegan-pastitsio-greek-lasagna/"),
    (4008, "Vegan Tzatziki", "https://minimalistbaker.com/6-ingredient-vegan-tzatziki/"),
    (4009, "Greek Lemon Potatoes", "https://holycowvegan.net/lemony-greek-potatoes/"),
    (4010, "Gigantes Plaki", "https://www.lazycatkitchen.com/gigantes-plaki/"),
    (4011, "Fasolada", "https://holycowvegan.net/fasolada-greek-bean-soup/"),
    (4012, "Vegan Avgolemono Soup", "https://vegancocotte.com/vegan-avgolemono-soup/"),
    (4013, "Briam", "https://www.themediterraneandish.com/briam-greek-roasted-vegetables/"),
    (4014, "Greek Orzo Salad", "https://simple-veganista.com/mediterranean-orzo-salad/"),
    (4015, "Vegan Dolmades", "https://thegreekvegan.com/stuffed-grape-leaves-dolmades/"),
    (4016, "Fakes", "https://miakouppa.com/fakies-lentil-soup/"),
    (4017, "Revithada", "https://www.lazycatkitchen.com/greek-inspired-chickpea-stew/"),
    (4018, "Spanakorizo", "https://www.plantbasedredhead.com/en/spanakorizo-greek-spinach-rice/"),
    (4019, "Vegan Greek Lemon Roasted Cauliflower", "https://www.vegkit.com/recipes/vegan-main-meals/freshly-picked-greek-roasted-cauliflower/"),
    (4020, "Imam Bayildi", "https://toriavey.com/imam-bayildi-roasted-stuffed-eggplant/"),
    (4021, "Vegan Keftedes", "https://www.themediterraneandish.com/greek-meatballs-recipe-keftedes-lemon-sauce/"),
    (4022, "Greek Gigantes with Tomato Sauce", "https://holycowvegan.net/greek-style-baked-lima-beans/"),
    (4023, "Vegan Skordalia", "https://vegancocotte.com/skordalia-recipe-greek-garlic-dip/"),
    (4024, "Melitzanosalata", "https://www.themediterraneandish.com/melitzanosalata-recipe/"),
    (4025, "Vegan Katsu Curry", "https://lovingitvegan.com/vegan-katsu-curry/"),
    (4026, "Vegan Okonomiyaki", "https://www.onegreenplanet.org/vegan-recipe/vegan-okonomiyaki-japanese-omelet-or-pancake/"),
    (4027, "Vegan Onigiri", "https://www.myplantifulcooking.com/vegan-onigiri/"),
    (4028, "Vegan Gyoza Dumplings", "https://biancazapatka.com/en/vegetable-dumplings-vegan-gyoza/"),
    (4029, "Vegan Teriyaki Tofu Bowl", "https://sweetsimplevegan.com/restaurant-style-teriyaki-tofu-bowls/"),
    (4030, "Vegan Udon Noodle Soup", "https://veganrecipebowl.com/vegan-udon-noodle-soup-mushrooms-crispy-tofu/"),
    (4031, "Japanese Curry Rice", "https://www.okonomikitchen.com/vegan-japanese-curry/"),
    (4032, "Vegan Edamame Rice Bowl", "https://minimalistbaker.com/rainbow-vegetable-edamame-bowls-with-teriyaki-sauce/"),
    (4033, "Vegan Tempura Vegetables", "https://www.lazycatkitchen.com/vegan-tempura/"),
    (4034, "Vegan Japanese Fried Rice", "https://thefoodietakesflight.com/japanese-chahan-or-fried-rice-vegan-recipe/"),
    (4035, "Vegan Bibimbap", "https://itdoesnttastelikechicken.com/vegan-korean-bibimbap/"),
    (4036, "Vegan Japchae", "https://thekoreanvegan.com/health-and-easy-vegan-japchae/"),
    (4037, "Vegan Tteokbokki", "https://frommybowl.com/vegan-tteokbokki/"),
    (4038, "Vegan Kimchi Fried Rice", "https://thekoreanvegan.com/vegan-kimchi-fried-rice/"),
    (4039, "Vegan Korean BBQ Tacos", "https://theveganatlas.com/vegan-korean-bbq-tacos-with-seitan-kimchee/"),
    (4040, "Vegan Bulgogi", "https://pickledplum.com/vegan-bulgogi/"),
    (4041, "Korean Tofu Stew", "https://thekoreanvegan.com/one-box-soon-tofu-stew/"),
    (4042, "Vegan Kimbap", "https://thekoreanvegan.com/4-korean-kimbap-recipes-easy-to-fancy/"),
    (4043, "Vegan Korean Pancakes", "https://thefoodietakesflight.com/korean-scallion-pancakes-pajeon/"),
    (4044, "Vegan Kimchi Jjigae", "https://thekoreanvegan.com/vegan-kimchi-jjigae-reigns-supreme/"),
    (4045, "Vegan Pad Thai", "https://hot-thai-kitchen.com/vegan-pad-thai/"),
    (4046, "Vegan Green Curry", "https://rainbowplantlife.com/vegan-thai-green-curry/"),
    (4047, "Vegan Massaman Curry", "https://minimalistbaker.com/easy-1-pot-massaman-curry/"),
    (4048, "Vegan Tom Kha", "https://wellvegan.com/vegan-tom-kha-thai-coconut-soup"),
    (4049, "Vegan Larb", "https://www.delishknowledge.com/vegan-thai-larb-lettuce-wraps/"),
    (4050, "Vegan Mango Sticky Rice", "https://elavegan.com/mango-sticky-rice-recipe/"),
    (4051, "Vegan Thai Basil Stir Fry", "https://drivemehungry.com/15-minute-thai-basil-tofu-stir-fry-pad-krapow/"),
    (4052, "Vegan Thai Peanut Noodles", "https://lovingitvegan.com/vegan-thai-peanut-noodles/"),
    (4053, "Vegan Som Tum", "https://minimalistbaker.com/vegan-papaya-salad/"),
    (4054, "Vegan Panang Curry", "https://runningonrealfood.com/vegan-panang-curry-tofu/"),
    (4055, "Vegan Pho Bo", "https://thevietvegan.com/homemade-vegan-vietnamese-pho/"),
    (4056, "Vegan Banh Mi", "https://cinnamonsnail.com/vegan-banh-mi-recipe/"),
    (4057, "Vegan Vietnamese Spring Rolls", "https://minimalistbaker.com/vietnamese-spring-rolls-with-crispy-tofu/"),
    (4058, "Vegan Bun Cha", "https://veggieanh.com/vegan-bun-cha/"),
    (4059, "Vegan Vietnamese Lemongrass Tofu", "https://thevietvegan.com/lemongrass-tofu/"),
    (4060, "Vegan Cao Lau", "https://food.nomadicboys.com/recipe-for-vietnamese-cao-lau/"),
    (4061, "Vegan Banh Xeo", "https://thevietvegan.com/vegan-banh-xeo/"),
    (4062, "Vegan Vietnamese Noodle Salad", "https://schoolnightvegan.com/home/bun-chay-vegan-vietnamese-noodle-salad/"),
    (4063, "Vegan Vietnamese Curry", "https://fullofplants.com/easy-vegan-vietnamese-curry/"),
    (4064, "Vegan Vietnamese Coffee Panna Cotta", "https://www.zoebakes.com/2012/06/27/vietnamese-ice-coffee-panna-cotta/"),
    (4065, "Vegan Mapo Tofu", "https://pickledplum.com/vegan-mapo-tofu-recipe/"),
    (4066, "Vegan Kung Pao Tofu", "https://frommybowl.com/vegan-kung-pao-tofu/"),
    (4067, "Vegan Chinese Scallion Pancakes", "https://schoolnightvegan.com/home/vegan-scallion-pancakes/"),
    (4068, "Vegan Dan Dan Noodles", "https://pickledplum.com/vegan-dan-dan-noodles/"),
    (4069, "Vegan Chinese Eggplant", "https://thewoksoflife.com/chinese-eggplant-garlic-sauce/"),
    (4070, "Vegan Hot and Sour Soup", "https://thestingyvegan.com/vegan-hot-and-sour-soup/"),
    (4071, "Vegan Chinese Dumplings", "https://avegtastefromatoz.com/vegan-chinese-dumplings-jiaozi/"),
    (4072, "Vegan Lasagna", "https://minimalistbaker.com/easy-vegan-lasagna/"),
    (4073, "Vegan Mushroom Risotto", "https://www.lazycatkitchen.com/vegan-mushroom-risotto/"),
    (4074, "Vegan Eggplant Parmesan", "https://lovingitvegan.com/vegan-eggplant-parmesan/"),
    (4075, "Vegan Minestrone Soup", "https://www.noracooks.com/vegan-minestrone-soup/"),
    (4076, "Vegan Pesto Pasta", "https://cookieandkate.com/pesto-pasta/"),
    (4077, "Vegan Bruschetta", "https://www.theedgyveg.com/2021/07/07/vegan-bruschetta-recipe/"),
    (4078, "Vegan Tiramisu", "https://www.lazycatkitchen.com/vegan-tiramisu-2/"),
    (4079, "Vegan Falafel", "https://www.veganricha.com/easy-vegan-falafel-burger/"),
    (4080, "Vegan Hummus", "https://feelgoodfoodie.net/recipe/mediterranean-hummus-bowl/"),
    (4081, "Vegan Baba Ganoush", "https://minimalistbaker.com/simple-baba-ganoush/"),
    (4082, "Vegan Shakshuka", "https://jessicainthekitchen.com/vegan-shakshuka/"),
    (4083, "Vegan Tabbouleh", "https://www.supergoldenbakes.com/lebanese-tabbouleh-salad-vegan/"),
    (4084, "Vegan Mujaddara", "https://feelgoodfoodie.net/recipe/mujadara/"),
    (4085, "Vegan Fattoush Salad", "https://elavegan.com/fattoush-salad/"),
    (4086, "Vegan Muhammara", "https://rainbowplantlife.com/muhammara/"),
    (4087, "Vegan Stuffed Bell Peppers", "https://foolproofliving.com/middle-eastern-inspired-stuffed-peppers/"),
    (4088, "Vegan Koshari", "https://thematbakh.com/egyptian-recipe-for-koshari/"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_og_image(url):
    """Try to get the og:image from a recipe page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Try og:image first
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]

        # Try twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            return tw["content"]

        # Try the first large image in the content
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if src and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                if "logo" not in src.lower() and "icon" not in src.lower() and "avatar" not in src.lower():
                    return src

        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None

def main():
    results = []
    failed = []
    total = len(RECIPES)

    print(f"Fetching images for {total} recipes...\n")

    for i, (rid, title, url) in enumerate(RECIPES):
        print(f"[{i+1}/{total}] {title}...", end=" ", flush=True)
        img_url = get_og_image(url)

        if img_url:
            results.append(f"{rid}|{img_url}")
            print(f"OK")
        else:
            failed.append((rid, title, url))
            print(f"FAILED")

        # Be polite to servers
        if i % 5 == 4:
            time.sleep(0.5)

    # Write results
    with open("image_results.txt", "w") as f:
        f.write("\n".join(results))

    print(f"\n{'='*50}")
    print(f"Done! Found images for {len(results)} of {total} recipes.")
    print(f"Failed: {len(failed)}")
    print(f"Results saved to image_results.txt")

    if failed:
        print(f"\nFailed recipes:")
        for rid, title, url in failed:
            print(f"  {rid}: {title} ({url})")

if __name__ == "__main__":
    main()
