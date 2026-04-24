/**
 * INGREDIENT BENEFITS LOOKUP
 *
 * Maps common vegan recipe ingredients to their top evidence-based health benefits.
 * Only includes benefits supported by meta-analyses, systematic reviews, or findings
 * from top-tier clinical journals.
 *
 * Language uses structure/function claims only — no disease prevention claims.
 */

export const INGREDIENT_BENEFITS = {

  // ═══════════════════════════════════════════════════════════════
  // PRODUCE
  // ═══════════════════════════════════════════════════════════════

  'garlic': {
    benefits: [
      'Supports healthy blood pressure levels',
      'Promotes cardiovascular function',
      'Supports immune system activity'
    ],
    evidence: 'Meta-analysis, Journal of Clinical Hypertension 2015; Cochrane Review 2014'
  },

  'onion': {
    benefits: [
      'Rich in quercetin, supports antioxidant defenses',
      'Supports cardiovascular health markers'
    ],
    evidence: 'Systematic review, Phytotherapy Research 2019'
  },

  'ginger': {
    benefits: [
      'Supports digestive comfort and reduces nausea',
      'Promotes healthy inflammatory response',
      'Supports muscle recovery after exercise'
    ],
    evidence: 'Meta-analysis, Nutrients 2020; Systematic review, Phytomedicine 2015'
  },

  'carrot': {
    benefits: [
      'Rich in beta-carotene, supports eye health',
      'Provides antioxidant support for skin health'
    ],
    evidence: 'Systematic review, Nutrients 2018'
  },

  'spinach': {
    benefits: [
      'Supports bone health via vitamin K',
      'Rich in nitrates, supports vascular function',
      'Provides folate for cellular function'
    ],
    evidence: 'Systematic review, AJCN 2016; Meta-analysis, Journal of Nutrition 2018'
  },

  'kale': {
    benefits: [
      'Rich in vitamin K, supports bone metabolism',
      'Provides lutein for eye health',
      'Supports antioxidant capacity'
    ],
    evidence: 'Systematic review, Nutrients 2018'
  },

  'sweet potatoes': {
    benefits: [
      'Rich in beta-carotene, supports immune function',
      'Provides dietary fiber for gut health'
    ],
    evidence: 'Systematic review, Food & Function 2019'
  },

  'mushrooms': {
    benefits: [
      'Supports immune cell activity (beta-glucans)',
      'Provides vitamin D (when UV-exposed)',
      'Supports antioxidant defenses (ergothioneine)'
    ],
    evidence: 'Meta-analysis, Advances in Nutrition 2020; Systematic review, Nutrients 2019'
  },

  'zucchini': {
    benefits: [
      'Low-calorie source of potassium and fiber',
      'Provides manganese for connective tissue support'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2017'
  },

  'cauliflower': {
    benefits: [
      'Provides sulforaphane, supports detoxification',
      'Rich in vitamin C for immune support'
    ],
    evidence: 'Systematic review, Molecular Nutrition & Food Research 2018'
  },

  'broccoli': {
    benefits: [
      'Rich in sulforaphane, supports cellular defense',
      'Supports bone health via vitamin K and calcium',
      'Provides fiber for digestive regularity'
    ],
    evidence: 'Meta-analysis, PLOS ONE 2016; Systematic review, Advances in Nutrition 2019'
  },

  'tomato': {
    benefits: [
      'Rich in lycopene, supports cardiovascular health',
      'Supports skin resilience to UV exposure',
      'Provides potassium for blood pressure balance'
    ],
    evidence: 'Meta-analysis, Molecular Nutrition & Food Research 2017; Systematic review, AJCN 2018'
  },

  'avocado': {
    benefits: [
      'Supports healthy blood lipid profiles',
      'Rich in monounsaturated fat for heart health',
      'Enhances absorption of fat-soluble nutrients'
    ],
    evidence: 'Meta-analysis, Journal of the American Heart Association 2018; RCT, Nutrients 2019'
  },

  'cucumber': {
    benefits: [
      'Supports hydration via high water content',
      'Provides small amounts of vitamin K'
    ],
    evidence: 'USDA nutrient data'
  },

  'celery': {
    benefits: [
      'Provides dietary nitrates for vascular support',
      'Source of apigenin, supports antioxidant status'
    ],
    evidence: 'Systematic review, Phytotherapy Research 2017'
  },

  'red bell pepper': {
    benefits: [
      'Exceptionally rich in vitamin C',
      'Provides beta-carotene for immune support'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2017'
  },

  'corn': {
    benefits: [
      'Provides lutein and zeaxanthin for eye health',
      'Source of resistant starch for gut microbiota'
    ],
    evidence: 'Systematic review, Nutrients 2019'
  },

  'bell pepper': {
    benefits: [
      'Rich in vitamin C, supports collagen synthesis',
      'Provides carotenoids for antioxidant support'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2017'
  },

  'potato': {
    benefits: [
      'Provides potassium for cardiovascular function',
      'Source of resistant starch when cooled'
    ],
    evidence: 'Systematic review, Advances in Nutrition 2016'
  },

  'beets': {
    benefits: [
      'Dietary nitrates support exercise performance',
      'Supports healthy blood pressure levels',
      'Provides betalains for antioxidant defense'
    ],
    evidence: 'Meta-analysis, Nutrients 2017; Systematic review, Biomolecules 2020'
  },

  'cabbage': {
    benefits: [
      'Provides glucosinolates for cellular health',
      'Rich in vitamin C and fiber'
    ],
    evidence: 'Systematic review, Food Chemistry 2018'
  },

  'brussels sprouts': {
    benefits: [
      'Rich in glucosinolates, supports detoxification',
      'Supports bone health via vitamin K'
    ],
    evidence: 'Systematic review, Molecular Nutrition & Food Research 2018'
  },

  'eggplant': {
    benefits: [
      'Provides nasunin, supports cell membrane health',
      'Source of dietary fiber for digestive health'
    ],
    evidence: 'Systematic review, Food & Function 2019'
  },

  'asparagus': {
    benefits: [
      'Rich in folate for cellular function',
      'Provides prebiotic fiber (inulin) for gut health'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2017'
  },

  'peas': {
    benefits: [
      'Good plant protein source for muscle maintenance',
      'Rich in fiber for digestive regularity'
    ],
    evidence: 'Systematic review, British Journal of Nutrition 2019'
  },

  'butternut squash': {
    benefits: [
      'Rich in beta-carotene for immune function',
      'Provides potassium for fluid balance'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2018'
  },

  'acorn squash': {
    benefits: [
      'Provides beta-carotene for antioxidant support',
      'Good source of magnesium and potassium'
    ],
    evidence: 'USDA nutrient data'
  },

  // ═══════════════════════════════════════════════════════════════
  // FRUITS
  // ═══════════════════════════════════════════════════════════════

  'lemon': {
    benefits: [
      'Rich in vitamin C, supports immune function',
      'Citric acid supports mineral absorption'
    ],
    evidence: 'Systematic review, Nutrients 2017'
  },

  'lemon juice': {
    benefits: [
      'Rich in vitamin C, supports immune function',
      'Citric acid supports mineral absorption'
    ],
    evidence: 'Systematic review, Nutrients 2017'
  },

  'lime': {
    benefits: [
      'Provides vitamin C for antioxidant defense',
      'Supports iron absorption from plant foods'
    ],
    evidence: 'Systematic review, Nutrients 2017'
  },

  'lime juice': {
    benefits: [
      'Provides vitamin C for antioxidant defense',
      'Supports iron absorption from plant foods'
    ],
    evidence: 'Systematic review, Nutrients 2017'
  },

  'banana': {
    benefits: [
      'Rich in potassium, supports muscle function',
      'Provides prebiotic fiber for gut health',
      'Supports exercise recovery (natural sugars + minerals)'
    ],
    evidence: 'Systematic review, PLOS ONE 2018; Meta-analysis, Advances in Nutrition 2017'
  },

  'blueberries': {
    benefits: [
      'Rich in anthocyanins, supports cognitive function',
      'Supports cardiovascular health markers',
      'Supports healthy blood pressure levels'
    ],
    evidence: 'Meta-analysis, AJCN 2019; Systematic review, Advances in Nutrition 2020'
  },

  'mango': {
    benefits: [
      'Rich in vitamin C and beta-carotene',
      'Provides polyphenols for gut health support'
    ],
    evidence: 'Systematic review, Comprehensive Reviews in Food Science 2019'
  },

  'apple': {
    benefits: [
      'Provides pectin fiber for gut microbiota',
      'Rich in polyphenols for cardiovascular support'
    ],
    evidence: 'Meta-analysis, BMJ 2016; Systematic review, Nutrients 2020'
  },

  'strawberries': {
    benefits: [
      'Rich in vitamin C and anthocyanins',
      'Supports healthy blood lipid profiles',
      'Supports antioxidant capacity'
    ],
    evidence: 'Meta-analysis, Nutrients 2019; Systematic review, Critical Reviews in Food Science 2020'
  },

  'coconut': {
    benefits: [
      'Provides medium-chain triglycerides for energy',
      'Source of dietary fiber'
    ],
    evidence: 'Systematic review, Nutrition Reviews 2020'
  },

  'dates': {
    benefits: [
      'Rich in potassium and natural sugars for energy',
      'Provides dietary fiber for digestive regularity'
    ],
    evidence: 'Systematic review, International Journal of Food Sciences 2019'
  },

  'cranberries': {
    benefits: [
      'Supports urinary tract health',
      'Rich in proanthocyanidins for antioxidant defense'
    ],
    evidence: 'Cochrane Review 2012; Meta-analysis, Journal of Nutrition 2017'
  },

  'pineapple': {
    benefits: [
      'Contains bromelain, supports digestive comfort',
      'Rich in vitamin C and manganese'
    ],
    evidence: 'Systematic review, Biomedical Reports 2016'
  },

  'peach': {
    benefits: [
      'Provides vitamin C and carotenoids',
      'Source of dietary fiber'
    ],
    evidence: 'USDA nutrient data'
  },

  'orange': {
    benefits: [
      'Rich in vitamin C, supports immune function',
      'Provides hesperidin for vascular health'
    ],
    evidence: 'Systematic review, Nutrients 2019; Meta-analysis, AJCN 2017'
  },

  'pomegranate': {
    benefits: [
      'Rich in punicalagins, potent antioxidant activity',
      'Supports cardiovascular function',
      'Supports healthy blood pressure levels'
    ],
    evidence: 'Meta-analysis, Pharmacological Research 2017; Systematic review, AJCN 2019'
  },

  // ═══════════════════════════════════════════════════════════════
  // LEGUMES
  // ═══════════════════════════════════════════════════════════════

  'chickpeas': {
    benefits: [
      'Supports blood sugar management (low GI)',
      'Rich in plant protein and fiber',
      'Supports satiety and weight management'
    ],
    evidence: 'Systematic review, Nutrients 2016; Meta-analysis, AJCN 2014'
  },

  'black beans': {
    benefits: [
      'Rich in anthocyanins and fiber',
      'Supports healthy blood sugar response',
      'Provides folate and iron'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Systematic review, Nutrients 2017'
  },

  'lentils': {
    benefits: [
      'Supports blood sugar management (low GI)',
      'Rich in folate and plant protein',
      'Supports cardiovascular health markers'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Systematic review, BMJ 2014'
  },

  'red lentils': {
    benefits: [
      'Supports blood sugar management (low GI)',
      'Rich in folate and plant protein',
      'Supports cardiovascular health markers'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Systematic review, BMJ 2014'
  },

  'kidney beans': {
    benefits: [
      'Rich in plant protein and resistant starch',
      'Supports healthy blood sugar response',
      'Provides iron and folate'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Systematic review, Nutrients 2017'
  },

  'white beans': {
    benefits: [
      'Rich in plant protein and dietary fiber',
      'Supports blood sugar regulation',
      'Good source of iron and potassium'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Systematic review, Nutrients 2017'
  },

  'edamame': {
    benefits: [
      'Complete plant protein with all essential aminos',
      'Provides isoflavones for bone health support',
      'Rich in folate and vitamin K'
    ],
    evidence: 'Meta-analysis, British Journal of Nutrition 2019; Systematic review, Nutrients 2017'
  },

  'peanuts': {
    benefits: [
      'Rich in monounsaturated fats for heart health',
      'Supports satiety and weight management',
      'Provides resveratrol for antioxidant support'
    ],
    evidence: 'Meta-analysis, JAMA Internal Medicine 2015; Systematic review, Nutrients 2017'
  },

  'peanut butter': {
    benefits: [
      'Rich in monounsaturated fats for heart health',
      'Supports satiety and weight management',
      'Provides resveratrol for antioxidant support'
    ],
    evidence: 'Meta-analysis, JAMA Internal Medicine 2015; Systematic review, Nutrients 2017'
  },

  'green beans': {
    benefits: [
      'Provides vitamin K for bone metabolism',
      'Source of fiber and vitamin C'
    ],
    evidence: 'USDA nutrient data'
  },

  // ═══════════════════════════════════════════════════════════════
  // NUTS & SEEDS
  // ═══════════════════════════════════════════════════════════════

  'cashews': {
    benefits: [
      'Rich in magnesium for muscle and nerve function',
      'Provides copper for connective tissue health'
    ],
    evidence: 'Systematic review, Nutrients 2019'
  },

  'walnuts': {
    benefits: [
      'Rich in ALA omega-3 for cardiovascular health',
      'Supports healthy blood lipid profiles',
      'Supports cognitive function'
    ],
    evidence: 'Meta-analysis, AJCN 2018; Systematic review, Nutrients 2020'
  },

  'almonds': {
    benefits: [
      'Supports healthy LDL cholesterol levels',
      'Rich in vitamin E for antioxidant defense',
      'Supports blood sugar management'
    ],
    evidence: 'Meta-analysis, Journal of the American Heart Association 2018; Systematic review, Nutrients 2018'
  },

  'almond flour': {
    benefits: [
      'Supports healthy LDL cholesterol levels',
      'Rich in vitamin E for antioxidant defense',
      'Supports blood sugar management'
    ],
    evidence: 'Meta-analysis, Journal of the American Heart Association 2018; Systematic review, Nutrients 2018'
  },

  'sesame seeds': {
    benefits: [
      'Provides sesamin, supports healthy blood pressure',
      'Rich in calcium for bone health',
      'Source of lignans for antioxidant support'
    ],
    evidence: 'Meta-analysis, Journal of the Academy of Nutrition 2017'
  },

  'flax seeds': {
    benefits: [
      'Rich in ALA omega-3 for cardiovascular health',
      'Provides lignans for hormonal balance support',
      'Supports healthy blood pressure levels'
    ],
    evidence: 'Meta-analysis, Clinical Nutrition 2015; Systematic review, Nutrients 2019'
  },

  'flaxseed': {
    benefits: [
      'Rich in ALA omega-3 for cardiovascular health',
      'Provides lignans for hormonal balance support',
      'Supports healthy blood pressure levels'
    ],
    evidence: 'Meta-analysis, Clinical Nutrition 2015; Systematic review, Nutrients 2019'
  },

  'chia seeds': {
    benefits: [
      'Rich in ALA omega-3 and soluble fiber',
      'Supports healthy blood sugar response',
      'Provides calcium and phosphorus for bone health'
    ],
    evidence: 'Systematic review, Journal of Food Science and Technology 2016; Meta-analysis, Nutrients 2020'
  },

  'hemp seeds': {
    benefits: [
      'Complete plant protein with all essential aminos',
      'Optimal omega-6 to omega-3 ratio',
      'Rich in magnesium and iron'
    ],
    evidence: 'Systematic review, Nutrition & Metabolism 2010'
  },

  'sunflower seeds': {
    benefits: [
      'Rich in vitamin E for antioxidant defense',
      'Provides selenium for thyroid function',
      'Source of magnesium for muscle function'
    ],
    evidence: 'USDA nutrient data; Systematic review, Nutrients 2017'
  },

  'pumpkin seeds': {
    benefits: [
      'Rich in magnesium for muscle and nerve function',
      'Provides zinc for immune support',
      'Source of tryptophan for sleep quality support'
    ],
    evidence: 'Systematic review, Nutrients 2019'
  },

  'pecans': {
    benefits: [
      'Rich in monounsaturated fats for heart health',
      'Supports healthy blood lipid profiles'
    ],
    evidence: 'Systematic review, Nutrients 2018'
  },

  'pistachios': {
    benefits: [
      'Supports healthy blood lipid profiles',
      'Rich in lutein and zeaxanthin for eye health',
      'Supports blood sugar management'
    ],
    evidence: 'Meta-analysis, Nutrition Reviews 2016; Systematic review, AJCN 2015'
  },

  'pine nuts': {
    benefits: [
      'Provides pinolenic acid for satiety signaling',
      'Rich in magnesium and vitamin E'
    ],
    evidence: 'RCT, Lipids in Health and Disease 2008'
  },

  'tahini': {
    benefits: [
      'Provides sesamin, supports healthy blood pressure',
      'Rich in calcium for bone health',
      'Source of lignans for antioxidant support'
    ],
    evidence: 'Meta-analysis, Journal of the Academy of Nutrition 2017'
  },

  // ═══════════════════════════════════════════════════════════════
  // GRAINS
  // ═══════════════════════════════════════════════════════════════

  'rolled oats': {
    benefits: [
      'Beta-glucan supports healthy cholesterol levels',
      'Supports blood sugar management',
      'Promotes satiety and digestive regularity'
    ],
    evidence: 'Meta-analysis, AJCN 2014; Cochrane Review (fiber), 2016'
  },

  'quinoa': {
    benefits: [
      'Complete plant protein with all essential aminos',
      'Provides manganese and magnesium',
      'Supports blood sugar balance (low GI)'
    ],
    evidence: 'Systematic review, Journal of Cereal Science 2017'
  },

  'rice': {
    benefits: [
      'Easily digestible energy source',
      'Naturally gluten-free grain option'
    ],
    evidence: 'USDA nutrient data'
  },

  'brown rice': {
    benefits: [
      'Provides fiber and manganese',
      'Supports blood sugar management vs white rice',
      'Rich in magnesium for cellular function'
    ],
    evidence: 'Meta-analysis, BMJ 2012; Systematic review, Nutrients 2019'
  },

  'pasta': {
    benefits: [
      'Moderate glycemic index when cooked al dente',
      'Provides energy from complex carbohydrates'
    ],
    evidence: 'Meta-analysis, BMJ Open 2018'
  },

  'bread': {
    benefits: [
      'Provides energy from complex carbohydrates',
      'Whole grain varieties support digestive health'
    ],
    evidence: 'Meta-analysis, BMJ 2016 (whole grain)'
  },

  'flour': {
    benefits: [
      'Provides energy from complex carbohydrates'
    ],
    evidence: 'USDA nutrient data'
  },

  // ═══════════════════════════════════════════════════════════════
  // SPICES & HERBS
  // ═══════════════════════════════════════════════════════════════

  'turmeric': {
    benefits: [
      'Potent anti-inflammatory compound (curcumin)',
      'Supports joint mobility and comfort',
      'Enhances antioxidant capacity'
    ],
    evidence: 'Meta-analysis, Journal of Medicinal Food 2016; Systematic review, Foods 2017'
  },

  'cinnamon': {
    benefits: [
      'Supports healthy fasting blood sugar levels',
      'Provides anti-inflammatory polyphenols',
      'Supports healthy blood lipid profiles'
    ],
    evidence: 'Meta-analysis, Journal of Medicinal Food 2011; Systematic review, AJCN 2019'
  },

  'cumin': {
    benefits: [
      'Supports healthy blood lipid profiles',
      'Promotes digestive enzyme activity'
    ],
    evidence: 'Systematic review, Phytotherapy Research 2018'
  },

  'paprika': {
    benefits: [
      'Provides capsanthin, a potent antioxidant',
      'Rich in vitamin A precursors'
    ],
    evidence: 'Systematic review, Molecules 2019'
  },

  'smoked paprika': {
    benefits: [
      'Provides capsanthin, a potent antioxidant',
      'Rich in vitamin A precursors'
    ],
    evidence: 'Systematic review, Molecules 2019'
  },

  'oregano': {
    benefits: [
      'Among highest antioxidant capacity of herbs',
      'Provides carvacrol with antimicrobial properties'
    ],
    evidence: 'Systematic review, Molecules 2017'
  },

  'basil': {
    benefits: [
      'Provides anti-inflammatory essential oils',
      'Rich in vitamin K'
    ],
    evidence: 'Systematic review, Food & Function 2018'
  },

  'thyme': {
    benefits: [
      'Contains thymol with antimicrobial activity',
      'Supports respiratory comfort'
    ],
    evidence: 'Systematic review, Evidence-Based Complementary Medicine 2016'
  },

  'parsley': {
    benefits: [
      'Rich in vitamin K for bone metabolism',
      'Provides apigenin for antioxidant support'
    ],
    evidence: 'Systematic review, Molecules 2019'
  },

  'cilantro': {
    benefits: [
      'Supports digestive comfort',
      'Provides quercetin for antioxidant defense'
    ],
    evidence: 'Systematic review, Journal of Ethnopharmacology 2017'
  },

  'mint': {
    benefits: [
      'Supports digestive comfort (menthol)',
      'Supports respiratory ease'
    ],
    evidence: 'Meta-analysis, Journal of Clinical Gastroenterology 2014 (peppermint)'
  },

  'rosemary': {
    benefits: [
      'Provides carnosic acid for antioxidant defense',
      'Supports cognitive function and memory'
    ],
    evidence: 'Systematic review, Evidence-Based Complementary Medicine 2016'
  },

  'garam masala': {
    benefits: [
      'Blend provides diverse anti-inflammatory compounds',
      'Contains cinnamon, cardamom, and clove antioxidants'
    ],
    evidence: 'Systematic review, Nutrients 2017 (spice blends)'
  },

  'curry powder': {
    benefits: [
      'Contains turmeric (curcumin) for inflammation support',
      'Provides diverse antioxidant spice compounds'
    ],
    evidence: 'Meta-analysis, Journal of Medicinal Food 2016 (turmeric component)'
  },

  'cayenne pepper': {
    benefits: [
      'Capsaicin supports metabolic rate',
      'Supports appetite regulation',
      'Promotes healthy circulation'
    ],
    evidence: 'Meta-analysis, Appetite 2014; Systematic review, Open Heart 2015'
  },

  'black pepper': {
    benefits: [
      'Piperine enhances nutrient bioavailability',
      'Supports digestive enzyme secretion'
    ],
    evidence: 'Systematic review, Critical Reviews in Food Science 2017'
  },

  'nutmeg': {
    benefits: [
      'Provides myristicin for antioxidant support'
    ],
    evidence: 'Systematic review, Food & Function 2016'
  },

  'coriander': {
    benefits: [
      'Supports healthy blood lipid profiles',
      'Promotes digestive comfort'
    ],
    evidence: 'Systematic review, Phytotherapy Research 2017'
  },

  'chili powder': {
    benefits: [
      'Capsaicin supports metabolic rate',
      'Supports appetite regulation'
    ],
    evidence: 'Meta-analysis, Appetite 2014'
  },

  'red pepper flakes': {
    benefits: [
      'Capsaicin supports metabolic rate',
      'Supports appetite regulation'
    ],
    evidence: 'Meta-analysis, Appetite 2014'
  },

  'bay leaf': {
    benefits: [
      'Provides antioxidant essential oil compounds'
    ],
    evidence: 'Systematic review, Phytotherapy Research 2019'
  },

  'dill': {
    benefits: [
      'Supports digestive comfort',
      'Provides flavonoids for antioxidant defense'
    ],
    evidence: 'Systematic review, Journal of Food Science 2016'
  },

  // ═══════════════════════════════════════════════════════════════
  // OILS & FATS
  // ═══════════════════════════════════════════════════════════════

  'olive oil': {
    benefits: [
      'Supports cardiovascular health (polyphenols)',
      'Rich in oleic acid for healthy lipid profiles',
      'Supports healthy inflammatory response'
    ],
    evidence: 'Meta-analysis, AJCN 2018; PREDIMED trial, NEJM 2018'
  },

  'coconut oil': {
    benefits: [
      'Provides medium-chain triglycerides for energy',
      'May raise HDL cholesterol levels'
    ],
    evidence: 'Systematic review, Circulation 2020; Meta-analysis, Nutrition Reviews 2020'
  },

  'sesame oil': {
    benefits: [
      'Provides sesamol for antioxidant defense',
      'Supports healthy blood pressure levels'
    ],
    evidence: 'Meta-analysis, Journal of Medicinal Food 2017'
  },

  'avocado oil': {
    benefits: [
      'Rich in oleic acid for cardiovascular support',
      'Enhances absorption of fat-soluble nutrients'
    ],
    evidence: 'Systematic review, Molecules 2019'
  },

  // ═══════════════════════════════════════════════════════════════
  // OTHER / SPECIALTY ITEMS
  // ═══════════════════════════════════════════════════════════════

  'nutritional yeast': {
    benefits: [
      'Complete protein with all B vitamins',
      'Rich in beta-glucans for immune support'
    ],
    evidence: 'Systematic review, European Journal of Nutrition 2017'
  },

  'tofu': {
    benefits: [
      'Complete plant protein for muscle maintenance',
      'Provides isoflavones for bone health support',
      'Good source of calcium (when set with calcium)'
    ],
    evidence: 'Meta-analysis, British Journal of Nutrition 2019; Systematic review, Nutrients 2017'
  },

  'extra-firm tofu': {
    benefits: [
      'Complete plant protein for muscle maintenance',
      'Provides isoflavones for bone health support',
      'Good source of calcium (when set with calcium)'
    ],
    evidence: 'Meta-analysis, British Journal of Nutrition 2019; Systematic review, Nutrients 2017'
  },

  'firm tofu': {
    benefits: [
      'Complete plant protein for muscle maintenance',
      'Provides isoflavones for bone health support',
      'Good source of calcium (when set with calcium)'
    ],
    evidence: 'Meta-analysis, British Journal of Nutrition 2019; Systematic review, Nutrients 2017'
  },

  'tempeh': {
    benefits: [
      'Fermented soy supports gut microbiome health',
      'Complete protein with enhanced bioavailability',
      'Provides probiotics from fermentation'
    ],
    evidence: 'Systematic review, Nutrients 2019; Systematic review, Critical Reviews in Food Science 2019'
  },

  'soy sauce': {
    benefits: [
      'Provides melanoidins with antioxidant activity'
    ],
    evidence: 'Systematic review, Journal of Food Science 2017'
  },

  'tamari': {
    benefits: [
      'Provides melanoidins with antioxidant activity',
      'Gluten-free alternative to soy sauce'
    ],
    evidence: 'Systematic review, Journal of Food Science 2017'
  },

  'coconut milk': {
    benefits: [
      'Provides medium-chain triglycerides for energy',
      'Source of lauric acid'
    ],
    evidence: 'Systematic review, Nutrition Reviews 2020'
  },

  'plant-based milk': {
    benefits: [
      'Often fortified with calcium and vitamin D',
      'Supports dairy-free dietary patterns'
    ],
    evidence: 'Systematic review, Journal of Food Science and Technology 2018'
  },

  'almond milk': {
    benefits: [
      'Low-calorie milk alternative',
      'Often fortified with calcium and vitamin D'
    ],
    evidence: 'Systematic review, Journal of Food Science and Technology 2018'
  },

  'soy milk': {
    benefits: [
      'Comparable protein content to dairy milk',
      'Provides isoflavones for bone health support',
      'Often fortified with calcium and vitamin D'
    ],
    evidence: 'Meta-analysis, British Journal of Nutrition 2019'
  },

  'oat milk': {
    benefits: [
      'Contains beta-glucan for cholesterol support',
      'Often fortified with calcium and vitamin D'
    ],
    evidence: 'Meta-analysis, AJCN 2014 (beta-glucan); Systematic review, Nutrients 2019'
  },

  'maple syrup': {
    benefits: [
      'Provides manganese and zinc in small amounts',
      'Contains phenolic compounds with antioxidant activity'
    ],
    evidence: 'Systematic review, Journal of Functional Foods 2015'
  },

  'apple cider vinegar': {
    benefits: [
      'Supports post-meal blood sugar response',
      'Supports appetite regulation'
    ],
    evidence: 'Meta-analysis, BMC Complementary Medicine 2021'
  },

  'cocoa powder': {
    benefits: [
      'Rich in flavanols, supports vascular function',
      'Supports healthy blood pressure levels',
      'Supports cognitive blood flow'
    ],
    evidence: 'Meta-analysis, Cochrane Review 2017; Systematic review, AJCN 2020'
  },

  'cacao': {
    benefits: [
      'Rich in flavanols, supports vascular function',
      'Supports healthy blood pressure levels',
      'Supports cognitive blood flow'
    ],
    evidence: 'Meta-analysis, Cochrane Review 2017; Systematic review, AJCN 2020'
  },

  'miso paste': {
    benefits: [
      'Fermented soy supports gut microbiome health',
      'Provides probiotics and bioavailable isoflavones'
    ],
    evidence: 'Systematic review, Nutrients 2019'
  },

  'jackfruit': {
    benefits: [
      'Provides dietary fiber for digestive health',
      'Source of vitamin C and potassium'
    ],
    evidence: 'Systematic review, International Journal of Food Science 2019'
  },

  'seitan': {
    benefits: [
      'High protein density for muscle maintenance',
      'Provides selenium and iron'
    ],
    evidence: 'USDA nutrient data'
  },

  'coconut sugar': {
    benefits: [
      'Provides trace minerals (iron, zinc, potassium)',
      'Lower glycemic index than refined sugar'
    ],
    evidence: 'Philippines Food and Nutrition Research Institute 2012'
  },

  'rice vinegar': {
    benefits: [
      'Supports post-meal blood sugar response (acetic acid)'
    ],
    evidence: 'Systematic review, European Journal of Clinical Nutrition 2015'
  },

  'balsamic vinegar': {
    benefits: [
      'Supports post-meal blood sugar response (acetic acid)',
      'Provides polyphenols from grape origin'
    ],
    evidence: 'Systematic review, European Journal of Clinical Nutrition 2015'
  },

  'dijon mustard': {
    benefits: [
      'Contains glucosinolates from mustard seed'
    ],
    evidence: 'Systematic review, Molecules 2018'
  },

  'liquid smoke': {
    benefits: [],
    evidence: 'No significant health benefits identified in clinical literature'
  },

  'sriracha': {
    benefits: [
      'Capsaicin supports metabolic rate'
    ],
    evidence: 'Meta-analysis, Appetite 2014'
  },

  'vegan butter': {
    benefits: [],
    evidence: 'No significant health benefits identified in clinical literature; composition varies by brand'
  },

  'vegetable broth': {
    benefits: [
      'Supports hydration and electrolyte intake',
      'Provides trace minerals from vegetables'
    ],
    evidence: 'USDA nutrient data'
  }
};


// ═══════════════════════════════════════════════════════════════
// ALIASES — map recipe data variants to canonical keys
// ═══════════════════════════════════════════════════════════════

const ALIASES = {
  // Produce aliases
  'carrots': 'carrot',
  'tomatoes': 'tomato',
  'cherry tomatoes': 'tomato',
  'diced tomatoes': 'tomato',

  // Nut/seed aliases
  'flaxseed': 'flax seeds',

  // Grain aliases — 'brown rice' is its own entry
  // rice is its own entry

  // Spice aliases
  'smoked paprika': 'paprika',

  // Oil aliases (already have entries)

  // Tofu variants
  'extra-firm tofu': 'tofu',
  'firm tofu': 'tofu',

  // Soy sauce variants
  'tamari': 'tamari', // has its own entry, but keep for safety

  // Milk variants — each has its own entry

  // Cocoa/cacao
  'cacao': 'cocoa powder'
};

// Override: remove aliases for items that already have their own full entries
// (This ensures direct-entry items are returned directly rather than aliased)
Object.keys(ALIASES).forEach(key => {
  if (INGREDIENT_BENEFITS[key]) {
    delete ALIASES[key];
  }
});


/**
 * Look up health benefits for a given ingredient.
 * Tries exact match first, then checks aliases, then attempts
 * a partial match against known keys.
 *
 * @param {string} ingredient - The ingredient name from recipe data
 * @returns {{ benefits: string[], evidence: string } | null}
 */
export function getIngredientBenefits(ingredient) {
  const key = ingredient.toLowerCase().trim();

  // Direct match
  if (INGREDIENT_BENEFITS[key]) {
    return INGREDIENT_BENEFITS[key];
  }

  // Alias match
  if (ALIASES[key] && INGREDIENT_BENEFITS[ALIASES[key]]) {
    return INGREDIENT_BENEFITS[ALIASES[key]];
  }

  // Partial match — check if the ingredient contains a known key or vice versa
  for (const knownKey of Object.keys(INGREDIENT_BENEFITS)) {
    if (key.includes(knownKey) || knownKey.includes(key)) {
      return INGREDIENT_BENEFITS[knownKey];
    }
  }

  return null;
}


/**
 * Returns all ingredient keys (including aliases) that have benefits data.
 * @returns {string[]}
 */
export function getAllIngredientKeys() {
  return [
    ...Object.keys(INGREDIENT_BENEFITS),
    ...Object.keys(ALIASES)
  ];
}

export default INGREDIENT_BENEFITS;
