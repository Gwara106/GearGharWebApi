/**
 * GearGhar product catalogue generator.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SYNTHETIC DEMO DATA. Every product, price, stock level, rating and review
 * count generated here is fabricated for the GearGhar demonstration store. The
 * brand names are those genuinely common in the South Asian motorcycle
 * aftermarket so the catalogue reads realistically, but nothing here is
 * affiliated with, endorsed by, or sourced from those manufacturers, and no
 * price or specification should be treated as a real-world quote.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Design: a small set of BLUEPRINTS (one per part category) is expanded across
 * brand × series × variant axes into several hundred products. Everything is
 * derived from a seeded PRNG keyed on the SKU, so re-running the generator
 * produces byte-identical output and the seeder stays idempotent.
 *
 * Every generated product carries the fields the assistant's retrieval,
 * explanation and comparison layers depend on: partCategory, specs, features,
 * installationDifficulty, beginnerFriendly, safetyImpact and universalFit.
 */

const { TAXONOMY } = require('./taxonomy');

// ─── Deterministic PRNG ──────────────────────────────────────────────────────
// Mulberry32 seeded from a string hash: same SKU always yields the same price,
// stock and rating, so seeding is repeatable and diffable.

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(key) {
  const rand = mulberry32(hashString(key));
  return {
    next: rand,
    int: (min, max) => min + Math.floor(rand() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    /** Picks `n` distinct members, preserving source order. */
    sample: (arr, n) => {
      const copy = arr.slice();
      const out = [];
      while (out.length < Math.min(n, arr.length)) {
        out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
      }
      return out;
    },
    chance: (p) => rand() < p,
    /** Price rounded to the nearest 9-ending retail figure. */
    price: (min, max) => {
      const raw = min + rand() * (max - min);
      const step = raw > 20000 ? 500 : raw > 5000 ? 100 : 10;
      return Math.max(min, Math.round(raw / step) * step - 1);
    },
  };
}

// ─── Shared vocabulary ───────────────────────────────────────────────────────

const COLOURS = ['Matte Black', 'Gloss Black', 'Titanium Grey', 'Racing Red', 'Metallic Blue', 'Carbon Look'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/**
 * Bike segments a model-specific part is generated for. Fitment is later
 * resolved against the real Motorcycle collection using these rules.
 */
const SEGMENTS = [
  { key: 'commuter-125', label: '100-125cc Commuter', types: ['commuter', 'scooter'], ccMin: 0, ccMax: 129 },
  { key: 'street-160', label: '150-200cc Street', types: ['naked', 'sport', 'commuter'], ccMin: 130, ccMax: 219 },
  { key: 'mid-250', label: '220-300cc', types: ['naked', 'sport', 'cruiser', 'adventure'], ccMin: 220, ccMax: 320 },
  { key: 'classic-350', label: '350cc Classic', types: ['cruiser', 'other'], ccMin: 321, ccMax: 460 },
  { key: 'performance-400', label: '390-500cc Performance', types: ['sport', 'naked', 'adventure'], ccMin: 321, ccMax: 560 },
  { key: 'big-bike', label: '600cc and above', types: ['sport', 'naked', 'adventure', 'cruiser'], ccMin: 561, ccMax: 99999 },
  { key: 'adventure', label: 'Adventure & Touring', types: ['adventure', 'offroad'], ccMin: 200, ccMax: 99999 },
];

const SEGMENT_BY_KEY = Object.fromEntries(SEGMENTS.map((s) => [s.key, s]));

/**
 * Maps our motorcycle-part taxonomy onto the Product.category enum, which the
 * existing storefront already filters on. Kept explicit so a new taxonomy slug
 * cannot silently fall outside the enum and break the shop page.
 */
const ECOMMERCE_CATEGORY = {
  helmet: 'sports',
  gloves: 'clothing',
  jacket: 'clothing',
  riding_gear: 'clothing',
  tyres: 'accessories',
  chain: 'accessories',
  sprocket: 'accessories',
  brakes: 'accessories',
  air_filter: 'accessories',
  oil_filter: 'accessories',
  spark_plug: 'accessories',
  maintenance: 'accessories',
  exhaust: 'accessories',
  handlebar: 'accessories',
  grips: 'accessories',
  mirror: 'accessories',
  crash_guard: 'accessories',
  engine_guard: 'accessories',
  frame_slider: 'accessories',
  seat: 'accessories',
  tank_pad: 'accessories',
  windshield: 'accessories',
  phone_holder: 'electronics',
  aux_light: 'electronics',
  tail_tidy: 'accessories',
  number_plate: 'accessories',
  brake_lever: 'accessories',
  clutch_lever: 'accessories',
  foot_peg: 'accessories',
  luggage: 'accessories',
  top_box: 'accessories',
  saddlebag: 'accessories',
  accessories: 'accessories',
};

/**
 * Lowercases a phrase for mid-sentence use while preserving material and
 * standards acronyms, so "ABS Thermoplastic" does not become "abs thermoplastic".
 */
const KEEP_CASE = ['ABS', 'SS', 'PU', 'TPU', 'PC', 'EPS', 'CE', 'DOT', 'ECE', 'ISI', 'UV', 'LED', 'CNC', 'MS', 'PVC', 'POM', 'SBR', 'JASO', 'API', 'YKK', 'IP', 'VRLA', 'D'];
function lc(phrase) {
  return String(phrase)
    .split(' ')
    .map((w) => (KEEP_CASE.includes(w.replace(/[^A-Za-z]/g, '')) ? w : w.toLowerCase()))
    .join(' ');
}

/** Correct indefinite article for a phrase ("a slip-on", "an ABS shell"). */
// Acronyms whose spoken form begins with a vowel sound ("an SBR", "an ABS").
const VOWEL_SOUND_ACRONYMS = ['ABS', 'SS', 'EPS', 'LED', 'MS', 'IP', 'API', 'M', 'SBR', 'XL', 'S', 'X'];
function an(phrase) {
  const s = String(phrase).trim();
  const first = s.split(' ')[0].replace(/[^A-Za-z]/g, '');
  if (VOWEL_SOUND_ACRONYMS.includes(first)) return `an ${s}`;
  return /^[aeiou]/i.test(s) ? `an ${s}` : `a ${s}`;
}

/** Deterministic placeholder image derived from the SKU. */
function imageFor(sku, partCategory) {
  const slug = partCategory.replace(/_/g, '-');
  return [
    `/images/products/${slug}/${sku.toLowerCase()}-1.jpg`,
    `/images/products/${slug}/${sku.toLowerCase()}-2.jpg`,
  ];
}

// ─── Blueprints ──────────────────────────────────────────────────────────────
// Each blueprint expands into brands × series × variants products.
//   axis: 'size' | 'colour' | 'segment' | 'plain'
//   universal: true → no fitment lookup needed (ProductCompatibility.universal)

const BLUEPRINTS = [
  // ══ Protective gear ══
  {
    partCategory: 'helmet',
    axis: 'size',
    universal: true,
    brands: ['Vega', 'Studds', 'Steelbird', 'Axor', 'LS2', 'MT Helmets', 'SMK'],
    series: ['Bolt', 'Apex Pro', 'Stratos', 'Crux DV', 'Rapid Sport'],
    priceBand: [2200, 18000],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [1250, 1750],
    tags: ['helmet', 'full face', 'protection', 'riding gear', 'safety'],
    specs: (rng, ctx) => ({
      Type: rng.pick(['Full Face', 'Full Face', 'Modular', 'Open Face']),
      'Shell Material': rng.pick(['ABS Thermoplastic', 'Polycarbonate', 'Fibreglass Composite', 'Carbon Composite']),
      Certification: rng.pick(['ISI + DOT', 'ISI + ECE 22.06', 'DOT + ECE 22.06']),
      Size: ctx.variant,
      'Visor Type': rng.pick(['Clear Anti-Scratch', 'Clear + Smoke Pinlock-ready', 'Photochromic']),
      Ventilation: `${rng.int(2, 6)}-point channel ventilation`,
      'Weight (approx)': `${ctx.weightGrams} g`,
    }),
    features: (rng) => [
      'Multi-density EPS liner for progressive impact absorption',
      'Removable and washable moisture-wicking inner lining',
      rng.pick(['Quick-release micrometric strap', 'Double-D ring retention strap']),
      'Anti-scratch, anti-fog treated visor',
      'Aerodynamic shell profile to reduce wind noise at highway speed',
    ],
    usage: 'Everyday commuting and highway riding. Choose the size that fits snugly with no pressure points.',
    describe: (b, s, ctx) =>
      `The ${b} ${s} is ${an(ctx.specs.Type.toLowerCase())} helmet built on ${an(lc(ctx.specs['Shell Material']))} shell with a multi-density EPS liner. Certified to ${ctx.specs.Certification}, it pairs ${an(ctx.specs['Visor Type'].toLowerCase())} visor with ${ctx.specs.Ventilation.toLowerCase()} to stay comfortable in traffic and at speed. Supplied in size ${ctx.variant}.`,
  },
  {
    partCategory: 'gloves',
    axis: 'size',
    universal: true,
    brands: ['Rynox', 'Viaterra', 'Solace', 'Royal Enfield', 'Aspida'],
    series: ['Storm Evo', 'Grid', 'Air GT', 'Urban Tour'],
    priceBand: [900, 6500],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'high',
    warrantyMonths: 6,
    weightRange: [180, 340],
    tags: ['gloves', 'riding gloves', 'protection', 'riding gear'],
    specs: (rng, ctx) => ({
      Size: ctx.variant,
      'Shell Material': rng.pick(['Goat Leather', 'Polyester Mesh + PU', 'Cowhide Leather']),
      'Knuckle Protection': rng.pick(['Hard TPU', 'Injected PC', 'Carbon-look TPU']),
      'Palm Protection': rng.pick(['Dual-layer PU slider', 'Suede reinforcement', 'SBR padding']),
      Season: rng.pick(['Summer / Mesh', 'All Season', 'Winter']),
      'Touchscreen Compatible': rng.pick(['Yes', 'Yes', 'No']),
      Closure: 'Adjustable wrist strap with hook-and-loop cuff',
    }),
    features: (rng) => [
      'Hard knuckle armour over the primary impact zone',
      'Reinforced palm slider to resist degloving in a slide',
      'Secure wrist retention so the glove cannot pull off',
      rng.pick(['Touchscreen-compatible index finger and thumb', 'Perforated panels for airflow']),
      'Pre-curved finger construction for a natural grip on the bars',
    ],
    usage: 'Essential daily protection. Your hands hit the ground first in almost every fall.',
    describe: (b, s, ctx) =>
      `${b} ${s} riding gloves in ${lc(ctx.specs['Shell Material'])} with ${lc(ctx.specs['Knuckle Protection'])} knuckle armour and ${an(lc(ctx.specs['Palm Protection']))}. Built for ${ctx.specs.Season.toLowerCase()} use with a secure wrist closure that keeps the glove on your hand during a slide. Size ${ctx.variant}.`,
  },
  {
    partCategory: 'jacket',
    axis: 'size',
    universal: true,
    brands: ['Rynox', 'Viaterra', 'Solace', 'Royal Enfield', 'Mototech'],
    series: ['Air GT 3', 'Fluid V3', 'Urban X', 'Tornado Pro'],
    priceBand: [4500, 22000],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [1100, 2200],
    tags: ['jacket', 'riding jacket', 'protection', 'riding gear', 'armour'],
    specs: (rng, ctx) => ({
      Size: ctx.variant,
      'Outer Shell': rng.pick(['600D Cordura', 'Poly-mesh + 500D Reinforcement', 'Ballistic Nylon']),
      'Shoulder Armour': rng.pick(['CE Level 1', 'CE Level 2']),
      'Elbow Armour': rng.pick(['CE Level 1', 'CE Level 2']),
      'Back Protector': rng.pick(['CE Level 1 included', 'Foam pad (upgradeable)', 'CE Level 2 included']),
      Liners: rng.pick(['Detachable thermal + rain liner', 'Detachable rain liner', 'Fixed mesh liner']),
      Season: rng.pick(['All Season', 'Summer / Mesh', '3-Season']),
      Reflectivity: 'Reflective piping on chest, sleeves and back',
    }),
    features: (rng) => [
      'CE-certified armour at the shoulders and elbows',
      rng.pick(['Detachable thermal and rain liners for year-round use', 'High-flow mesh panels for hot-weather riding']),
      'Reflective detailing for low-light conspicuity',
      'Adjustable waist, cuff and arm straps to keep armour over the joint',
      'Multiple internal and external pockets, including a waterproof phone pocket',
    ],
    usage: 'The core of any rider kit. Check the armour still sits over your joints when you lean forward on the bike.',
    describe: (b, s, ctx) =>
      `${b} ${s} riding jacket built from ${lc(ctx.specs['Outer Shell'])} with ${ctx.specs['Shoulder Armour']} shoulder and ${ctx.specs['Elbow Armour']} elbow armour. Back protection: ${ctx.specs['Back Protector'].toLowerCase()}. ${ctx.specs.Liners} make it suitable for ${ctx.specs.Season.toLowerCase()} riding. Size ${ctx.variant}.`,
  },
  {
    partCategory: 'riding_gear',
    axis: 'size',
    universal: true,
    brands: ['Rynox', 'Viaterra', 'Solace', 'Aspida'],
    series: ['Advento Riding Pant', 'Corbett Riding Pant', 'Stealth Boots', 'Trail Boots', 'Level 2 Back Protector'],
    priceBand: [2800, 16000],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'high',
    warrantyMonths: 12,
    weightRange: [800, 2400],
    tags: ['riding gear', 'riding pants', 'boots', 'body armour', 'protection'],
    specs: (rng, ctx) => ({
      Size: ctx.variant,
      Material: rng.pick(['600D Cordura', 'Full-grain Leather', 'Poly-mesh + PU']),
      Protection: rng.pick(['CE Level 1 knee + hip', 'CE Level 2 knee + hip', 'Ankle and shin cups']),
      Closure: rng.pick(['YKK zip + strap', 'Micro-adjust buckle', 'Hook-and-loop with side zip']),
      'Water Resistance': rng.pick(['Water-resistant', 'Fully waterproof membrane', 'Not waterproof']),
      Season: rng.pick(['All Season', 'Summer', '3-Season']),
    }),
    features: (rng) => [
      'CE-rated impact protection at the primary contact points',
      'Abrasion-resistant outer shell tested for slide performance',
      rng.pick(['Ventilation zips for hot-weather riding', 'Reinforced stitching at the stress seams']),
      'Adjustable fit so armour stays in position in the riding stance',
      'Reflective panels for night-time visibility',
    ],
    usage: 'Completes the protective kit after helmet, gloves and jacket. Prioritise fit over price.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${lc(ctx.specs.Material)} construction with ${lc(ctx.specs.Protection)} protection and ${an(lc(ctx.specs.Closure))} closure. ${ctx.specs['Water Resistance']}, suited to ${ctx.specs.Season.toLowerCase()} riding. Size ${ctx.variant}.`,
  },

  // ══ Chassis protection ══
  {
    partCategory: 'crash_guard',
    axis: 'segment',
    brands: ['ZANA', 'HJG', 'Carbon Racing', 'Vardhman', 'Bikers Choice'],
    series: ['Sturdy Crash Guard', 'Trident Leg Guard', 'Slider Guard'],
    priceBand: [1800, 9500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'medium',
    warrantyMonths: 6,
    weightRange: [2200, 5600],
    tags: ['crash guard', 'leg guard', 'protection', 'chassis'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['Mild Steel', 'Stainless Steel 304', 'Powder-coated MS']),
      'Tube Diameter': rng.pick(['22 mm', '25 mm', '28 mm']),
      'Tube Thickness': rng.pick(['2.0 mm', '2.5 mm', '3.0 mm']),
      Finish: rng.pick(['Matte Black Powder Coat', 'Chrome', 'Gloss Black']),
      Mounting: 'Model-specific brackets, bolt-on to OEM chassis points',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Wraps the engine cases and tank sides in a low-speed drop',
      'Bolts to factory chassis mounting points — no drilling or welding',
      'Powder-coated finish resists rust through monsoon riding',
      'Doubles as a mounting base for auxiliary lights',
      'Adds highway leg-rest positions on longer rides',
    ],
    usage: 'Fit before you need it — a car park drop costs more in bodywork than the guard does.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} motorcycles. Fabricated from ${ctx.specs['Tube Thickness']} ${lc(ctx.specs.Material)} in ${ctx.specs['Tube Diameter']} tube with ${an(lc(ctx.specs.Finish))} finish. Bolts to the factory chassis points to keep the engine, tank and your legs off the tarmac in a low-speed drop.`,
  },
  {
    partCategory: 'engine_guard',
    axis: 'segment',
    brands: ['ZANA', 'SW-Motech Style', 'Carbon Racing', 'Rugged Motorbike Innovations'],
    series: ['Bash Plate', 'Sump Guard', 'Skid Plate'],
    priceBand: [1600, 8500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'medium',
    warrantyMonths: 6,
    weightRange: [1400, 3800],
    tags: ['engine guard', 'bash plate', 'sump guard', 'skid plate', 'protection'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['4 mm Aluminium', '3 mm Aluminium', '2 mm Stainless Steel']),
      Coverage: rng.pick(['Sump + Headers', 'Sump only', 'Full Belly Pan']),
      Finish: rng.pick(['Anodised Black', 'Raw Brushed', 'Matte Black Powder Coat']),
      'Drain Access': 'Cut-out retained for oil drain bolt',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Shields the sump and exhaust headers from stone strikes',
      'Drain-bolt cut-out means no removal for an oil change',
      'Rubber-isolated mounts reduce transmitted vibration',
      'Vented design prevents heat soak around the engine cases',
      'Essential for gravel, trail and broken-road riding',
    ],
    usage: 'Adventure and broken-road riding. A holed sump means an engine rebuild.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${lc(ctx.specs.Material)} covering ${lc(ctx.specs.Coverage)}, finished in ${lc(ctx.specs.Finish)}. Designed for ${ctx.segment.label} machines, with the oil drain bolt left accessible so routine servicing does not require removal.`,
  },
  {
    partCategory: 'frame_slider',
    axis: 'segment',
    brands: ['Carbon Racing', 'ZANA', 'Puig Style', 'GB Racing Style'],
    series: ['No-Cut Frame Slider', 'Spool Slider Kit', 'Axle Slider Set'],
    priceBand: [1400, 7500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'medium',
    warrantyMonths: 6,
    weightRange: [400, 1200],
    tags: ['frame slider', 'crash slider', 'protection'],
    specs: (rng, ctx) => ({
      'Puck Material': rng.pick(['Delrin (POM)', 'Nylon 66', 'High-density Polyethylene']),
      'Mount Type': rng.pick(['No-Cut', 'Cut Required']),
      Hardware: 'High-tensile grade 10.9 bolts included',
      'Sold As': rng.pick(['Pair', 'Pair', 'Set of 4']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Takes the initial impact in a slide, keeping fairings off the tarmac',
      'Much lighter and less intrusive than full crash bars',
      'Supplied with high-tensile hardware — never substitute ordinary bolts',
      'Machined pucks are replaceable after a drop',
      'Popular choice for sport and naked machines',
    ],
    usage: 'Sportbike protection that keeps the bike looking standard. Reduces damage; does not eliminate it.',
    describe: (b, s, ctx) =>
      `${b} ${s} using ${ctx.specs['Puck Material']} pucks with ${an(ctx.specs['Mount Type'].toLowerCase())} mounting design for ${ctx.segment.label} motorcycles. Sold as a ${ctx.specs['Sold As'].toLowerCase()} with grade 10.9 hardware, it takes the first impact in a slide and protects the fairings and engine cases.`,
  },
  {
    partCategory: 'tail_tidy',
    axis: 'segment',
    brands: ['ZANA', 'Carbon Racing', 'Moto Torque', 'Bikers Choice'],
    series: ['Tail Tidy', 'Fender Eliminator Kit'],
    priceBand: [900, 4800],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [220, 700],
    tags: ['tail tidy', 'fender eliminator', 'styling', 'number plate'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['Powder-coated Steel', 'CNC Aluminium', 'ABS + Steel Bracket']),
      'Plate Light': rng.pick(['LED plate light included', 'Reuses OEM plate light']),
      'Indicator Mounts': rng.pick(['Integrated', 'Separate brackets included', 'Reuses OEM mounts']),
      Adjustability: rng.pick(['Fixed angle', 'Adjustable plate angle']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Removes the long factory rear mudguard overhang',
      'Relocates the number plate close to the tail for a cleaner line',
      'Includes the wiring adapters needed for the plate light',
      'Reversible — the OEM assembly can be refitted',
      'Check local plate-angle and lighting rules before fitting',
    ],
    usage: 'Cosmetic upgrade. Confirm your local number-plate regulations before buying.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} machines, made from ${lc(ctx.specs.Material)}. ${ctx.specs['Plate Light']} and ${ctx.specs['Indicator Mounts'].toLowerCase()}. Removes the bulky factory rear fender for a cleaner tail, and can be reversed back to standard at any time.`,
  },

  // ══ Engine and drivetrain ══
  {
    partCategory: 'exhaust',
    axis: 'segment',
    brands: ['Red Rooster', 'SC Project Style', 'Bombshell', 'Moto Torque', 'Dominar Performance'],
    series: ['Slip-On Silencer', 'Full System', 'Short Can', 'Megaphone'],
    priceBand: [4500, 42000],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [1800, 6500],
    tags: ['exhaust', 'silencer', 'slip-on', 'performance', 'sound'],
    specs: (rng, ctx) => ({
      Type: ctx.series.includes('Full') ? 'Full System' : 'Slip-On',
      Material: rng.pick(['SS 304 Stainless', 'Titanium-coated SS', 'Aluminium with SS Sleeve']),
      'End Cap': rng.pick(['Carbon Fibre', 'CNC Aluminium', 'Stainless Steel']),
      'DB Killer': rng.pick(['Removable DB killer included', 'Fixed baffle']),
      Finish: rng.pick(['Brushed', 'Matte Black Ceramic', 'Polished']),
      'Fits Segment': ctx.segment.label,
    }),
    features: (rng) => [
      'Noticeable weight saving over the factory silencer',
      'Deeper exhaust note without the harshness of an open pipe',
      rng.pick(['Removable DB killer for track versus road use', 'Ceramic coating resists discolouration']),
      'Bolts to the OEM header — no cutting required on slip-on variants',
      'Stainless construction resists monsoon corrosion',
    ],
    usage: 'Weight, sound and looks. A slip-on alone rarely adds meaningful power without a fuelling change.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${an(ctx.specs.Type.toLowerCase())} exhaust in ${lc(ctx.specs.Material)} with ${an(lc(ctx.specs['End Cap']))} end cap and ${lc(ctx.specs.Finish)} finish, for ${ctx.segment.label} motorcycles. ${ctx.specs['DB Killer']}. Saves weight over the OEM silencer and gives a deeper note. Check local noise regulations before road use.`,
  },
  {
    partCategory: 'air_filter',
    axis: 'segment',
    brands: ['K&N Style', 'Bosch', 'Uni Filter', 'Vardhman', 'Motorrad'],
    series: ['High-Flow Air Filter', 'OE Replacement Filter', 'Washable Cotton Filter'],
    priceBand: [350, 4500],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [120, 420],
    tags: ['air filter', 'engine', 'maintenance', 'service', 'performance'],
    specs: (rng, ctx) => ({
      'Filter Media': rng.pick(['Oiled Cotton Gauze', 'Pleated Paper', 'Foam']),
      Reusable: rng.pick(['Yes — washable and re-oilable', 'No — replace at interval']),
      'Service Interval': rng.pick(['10,000 km', '12,000 km', '15,000 km']),
      'Flow Improvement': rng.pick(['Up to 12% over OE', 'Matches OE flow', 'Up to 20% over OE']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Restores throttle response lost to a clogged filter',
      'Direct drop-in replacement for the OEM airbox',
      'Multi-layer media traps fine dust without choking airflow',
      'Improves fuel economy compared with a neglected filter',
      'Inspect more often in dusty conditions than the stated interval',
    ],
    usage: 'Replace or clean at the service interval. A clogged filter costs both power and fuel economy.',
    describe: (b, s, ctx) =>
      `${b} ${s} using ${lc(ctx.specs['Filter Media'])} media, sized for ${ctx.segment.label} machines. ${ctx.specs.Reusable}. Rated for a ${ctx.specs['Service Interval']} service interval with ${ctx.specs['Flow Improvement'].toLowerCase()} airflow. Drops straight into the OEM airbox.`,
  },
  {
    partCategory: 'oil_filter',
    axis: 'segment',
    brands: ['Bosch', 'Motorrad', 'Vardhman', 'Purolator Style'],
    series: ['Spin-On Oil Filter', 'Cartridge Oil Filter'],
    priceBand: [180, 1400],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'medium',
    warrantyMonths: 6,
    weightRange: [90, 260],
    tags: ['oil filter', 'engine', 'maintenance', 'service'],
    specs: (rng, ctx) => ({
      Type: ctx.series.includes('Spin') ? 'Spin-On' : 'Cartridge',
      'Filter Media': rng.pick(['Synthetic Blend', 'Cellulose', 'Micro-glass']),
      'Filtration Rating': rng.pick(['20 micron', '25 micron', '15 micron']),
      'Bypass Valve': rng.pick(['Integrated', 'Not fitted (engine-side bypass)']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Traps combustion by-products and metal particles',
      'Anti-drainback valve keeps oil at the top end on start-up',
      'Replace with every oil change — cheap insurance for the engine',
      'Nitrile seal supplied ready-lubricated',
      'Meets or exceeds OE filtration specification',
    ],
    usage: 'Always replaced with the engine oil. Smear fresh oil on the seal before fitting.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${an(ctx.specs.Type.toLowerCase())} filter with ${lc(ctx.specs['Filter Media'])} media rated at ${ctx.specs['Filtration Rating']}, for ${ctx.segment.label} engines. ${ctx.specs['Bypass Valve']} bypass valve. Fit with every oil change and never overtighten.`,
  },
  {
    partCategory: 'maintenance',
    axis: 'plain',
    universal: true,
    brands: ['Motul', 'Castrol', 'Liqui Moly', 'Shell', 'Gulf', 'Elf'],
    series: [
      '10W-40 Semi-Synthetic Engine Oil 1L',
      '10W-50 Fully Synthetic Engine Oil 1L',
      '20W-50 Mineral Engine Oil 1L',
      'Chain Lube Spray 400ml',
      'Chain Cleaner Spray 400ml',
      'Coolant Ready-Mix 1L',
      'DOT 4 Brake Fluid 500ml',
      'Contact Cleaner Spray 300ml',
      'Bike Wash Shampoo 1L',
    ],
    priceBand: [220, 2400],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'medium',
    warrantyMonths: 0,
    weightRange: [320, 1200],
    tags: ['engine oil', 'lubricant', 'maintenance', 'consumable', 'service'],
    specs: (rng, ctx) => {
      const isOil = ctx.series.includes('Engine Oil');
      if (isOil) {
        return {
          Viscosity: ctx.series.split(' ')[0],
          Type: ctx.series.includes('Fully') ? 'Fully Synthetic' : ctx.series.includes('Semi') ? 'Semi-Synthetic' : 'Mineral',
          'JASO Rating': rng.pick(['JASO MA2', 'JASO MA2', 'JASO MA']),
          'API Rating': rng.pick(['API SL', 'API SN', 'API SM']),
          Volume: '1 Litre',
          'Wet Clutch Safe': 'Yes',
        };
      }
      return {
        'Pack Size': ctx.series.match(/\d+\s?(ml|L)/i)?.[0] || '400ml',
        Application: ctx.series.replace(/\s*\d+\s?(ml|L)$/i, ''),
        'O-Ring Safe': ctx.series.includes('Chain') ? 'Yes' : 'N/A',
        'Shelf Life': `${rng.int(24, 60)} months`,
      };
    },
    features: (rng, ctx) =>
      ctx.series.includes('Engine Oil')
        ? [
            'JASO MA-rated so it will not cause wet-clutch slip',
            'Maintains film strength at sustained high oil temperatures',
            'Detergent additives keep combustion deposits in suspension',
            'Suitable for four-stroke motorcycle engines with a shared gearbox',
            'Always match the viscosity grade printed on your filler cap',
          ]
        : [
            'Formulated specifically for motorcycle use',
            'O-ring and X-ring chain safe where applicable',
            'Precision applicator nozzle included',
            'Resists fling-off at highway speeds',
            'Store away from direct sunlight and heat',
          ],
    usage: 'Routine servicing consumable. Match the specification printed in your owner’s manual.',
    describe: (b, s, ctx) =>
      ctx.series.includes('Engine Oil')
        ? `${b} ${s} — ${an(ctx.specs.Type.toLowerCase())} ${ctx.specs.Viscosity} motorcycle engine oil rated ${ctx.specs['JASO Rating']} and ${ctx.specs['API Rating']}. The JASO MA rating means it is safe for wet clutches, unlike friction-modified car oils. Always confirm the viscosity grade your engine requires before use.`
        : `${b} ${s} — ${an(ctx.specs.Application.toLowerCase())} formulated for motorcycle use, supplied in a ${ctx.specs['Pack Size']} pack. ${ctx.specs['O-Ring Safe'] === 'Yes' ? 'Safe for O-ring and X-ring chains. ' : ''}A workshop staple for routine home servicing.`,
  },
  {
    partCategory: 'spark_plug',
    axis: 'segment',
    brands: ['Bosch', 'NGK Style', 'Denso Style', 'Champion Style'],
    series: ['Iridium Spark Plug', 'Nickel Spark Plug', 'Platinum Spark Plug'],
    priceBand: [180, 1800],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [45, 90],
    tags: ['spark plug', 'ignition', 'engine', 'maintenance', 'service'],
    specs: (rng, ctx) => ({
      'Electrode Material': ctx.series.split(' ')[0],
      'Thread Size': rng.pick(['M10 x 1.0', 'M12 x 1.25', 'M14 x 1.25']),
      'Heat Range': rng.pick(['7', '8', '9']),
      Gap: rng.pick(['0.7 mm', '0.8 mm', '0.9 mm']),
      'Service Life': ctx.series.includes('Iridium') ? '20,000 km' : '10,000 km',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Fine-wire centre electrode for a more reliable spark',
      'Restores easy cold starting and a smooth idle',
      'Pre-gapped from the factory — verify before fitting',
      'Corrosion-resistant plated shell',
      'Use only the heat range specified for your engine',
    ],
    usage: 'Replace at the service interval. The tip colour is a useful window into engine health.',
    describe: (b, s, ctx) =>
      `${b} ${s} with ${an(ctx.specs['Electrode Material'].toLowerCase())} centre electrode, ${ctx.specs['Thread Size']} thread and heat range ${ctx.specs['Heat Range']}, pre-gapped to ${ctx.specs.Gap}. Rated for around ${ctx.specs['Service Life']} of service on ${ctx.segment.label} engines. Always match the heat range specified for your motorcycle.`,
  },
  {
    partCategory: 'chain',
    axis: 'segment',
    brands: ['DID Style', 'RK Style', 'Rolon', 'IndoChain', 'LG Chains'],
    series: ['O-Ring Drive Chain', 'X-Ring Drive Chain', 'Heavy Duty Chain'],
    priceBand: [900, 9500],
    installationDifficulty: 4,
    beginnerFriendly: false,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [1600, 3400],
    tags: ['chain', 'drive chain', 'transmission', 'maintenance'],
    specs: (rng, ctx) => ({
      Pitch: rng.pick(['428', '520', '525', '530']),
      'Link Count': String(rng.int(104, 136)),
      'Seal Type': ctx.series.includes('X-Ring') ? 'X-Ring' : ctx.series.includes('O-Ring') ? 'O-Ring' : 'Non-sealed',
      'Tensile Strength': `${rng.int(28, 46)} kN`,
      'Master Link': rng.pick(['Rivet type included', 'Clip type included']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Sealed rings retain factory lubricant inside each link',
      'Solid bush construction resists stretch under load',
      'Master link supplied in the box',
      'Replace as a set with both sprockets for full service life',
      'Check slack at the tightest point of rotation after fitting',
    ],
    usage: 'Safety-critical drivetrain part. Replace together with both sprockets, never alone.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${ctx.specs.Pitch} pitch with ${ctx.specs['Link Count']} links and ${ctx.specs['Seal Type']} sealing, rated to ${ctx.specs['Tensile Strength']} tensile strength for ${ctx.segment.label} machines. ${ctx.specs['Master Link']}. Fit alongside new sprockets — a new chain on worn sprockets wears out quickly.`,
  },
  {
    partCategory: 'sprocket',
    axis: 'segment',
    brands: ['JT Style', 'Rolon', 'Supersprox Style', 'Vardhman'],
    series: ['Front Sprocket', 'Rear Sprocket', 'Chain Sprocket Kit'],
    priceBand: [450, 7500],
    installationDifficulty: 4,
    beginnerFriendly: false,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [300, 2200],
    tags: ['sprocket', 'chain kit', 'transmission', 'gearing'],
    specs: (rng, ctx) => ({
      Position: ctx.series.includes('Front') ? 'Front (Gearbox)' : ctx.series.includes('Rear') ? 'Rear (Wheel)' : 'Front + Rear + Chain',
      'Tooth Count': ctx.series.includes('Front') ? String(rng.int(13, 17)) : String(rng.int(38, 52)),
      Material: rng.pick(['SCM420 Chromoly Steel', 'C45 Carbon Steel', 'Hardened Alloy Steel']),
      Pitch: rng.pick(['428', '520', '525']),
      Treatment: rng.pick(['Induction hardened', 'Heat treated + zinc plated']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Induction-hardened teeth for long service life',
      'Precision-machined profile keeps the chain running true',
      'Available in alternative tooth counts to change final gearing',
      'Zinc plating resists corrosion in wet conditions',
      'Always replace chain and sprockets as a matched set',
    ],
    usage: 'Changing tooth counts alters acceleration versus top speed. Go one tooth at a time.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${ctx.specs.Position} with ${ctx.specs['Tooth Count']} teeth in ${ctx.specs.Pitch} pitch, machined from ${lc(ctx.specs.Material)} and ${lc(ctx.specs.Treatment)}. Suits ${ctx.segment.label} motorcycles. Fit as a matched set with a new chain for full service life.`,
  },
  {
    partCategory: 'brakes',
    axis: 'segment',
    brands: ['EBC Style', 'Brembo Style', 'Galfer Style', 'Bosch', 'Vesrah Style'],
    series: ['Sintered Brake Pads', 'Organic Brake Pads', 'Floating Brake Disc', 'Fixed Brake Disc'],
    priceBand: [650, 14000],
    installationDifficulty: 4,
    beginnerFriendly: false,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [180, 1900],
    tags: ['brakes', 'brake pads', 'brake disc', 'safety', 'stopping'],
    specs: (rng, ctx) => {
      const isDisc = ctx.series.includes('Disc');
      return isDisc
        ? {
            Type: ctx.series.includes('Floating') ? 'Floating Rotor' : 'Fixed Rotor',
            Diameter: rng.pick(['240 mm', '265 mm', '282 mm', '300 mm', '320 mm']),
            Thickness: rng.pick(['4.0 mm', '4.5 mm', '5.0 mm']),
            Material: 'Stainless Steel 420',
            Position: rng.pick(['Front', 'Rear']),
            'Fits Segment': ctx.segment.label,
          }
        : {
            Compound: ctx.series.includes('Sintered') ? 'Sintered Metal' : 'Organic Resin',
            Position: rng.pick(['Front', 'Rear']),
            'Sold As': 'Pair (one caliper)',
            'Wet Performance': ctx.series.includes('Sintered') ? 'Excellent' : 'Good',
            'Bedding-in': 'Required — 30 gentle stops',
            'Fits Segment': ctx.segment.label,
          };
    },
    features: (rng, ctx) =>
      ctx.series.includes('Disc')
        ? [
            'Laser-cut stainless rotor with a consistent friction surface',
            'Slotted profile clears water and pad debris',
            'Precision-ground faces minimise brake judder',
            'Direct replacement for the OEM rotor',
            'Always fit fresh pads alongside a new disc',
          ]
        : [
            'Consistent friction coefficient from cold through to hard use',
            rng.pick(['Sintered compound performs strongly in the wet', 'Organic compound is quieter and kinder to discs']),
            'Chamfered and slotted to reduce squeal',
            'Backing plate coated to resist corrosion',
            'Requires a gentle 30-stop bedding-in period',
          ],
    usage: 'Safety-critical. If you are not confident with hydraulic brakes, have these fitted by a mechanic.',
    describe: (b, s, ctx) =>
      ctx.series.includes('Disc')
        ? `${b} ${s} — ${an(ctx.specs.Diameter)} ${ctx.specs.Type.toLowerCase()} in ${ctx.specs.Material} at ${ctx.specs.Thickness} thickness for the ${ctx.specs.Position.toLowerCase()} of ${ctx.segment.label} machines. Precision-ground for judder-free braking. Fit new pads at the same time.`
        : `${b} ${s} in a ${ctx.specs.Compound.toLowerCase()} compound for the ${ctx.specs.Position.toLowerCase()} caliper of ${ctx.segment.label} motorcycles. Sold as a ${ctx.specs['Sold As'].toLowerCase()} with ${ctx.specs['Wet Performance'].toLowerCase()} wet performance. Bed in with around 30 gentle stops before hard use.`,
  },
  {
    partCategory: 'tyres',
    axis: 'segment',
    brands: ['MRF', 'CEAT', 'TVS Eurogrip', 'Michelin', 'Pirelli', 'Metzeler', 'Apollo'],
    series: ['Zapper Street', 'Sportour Radial', 'Roadrider Touring', 'Trail Dual-Sport'],
    priceBand: [1800, 22000],
    installationDifficulty: 5,
    beginnerFriendly: false,
    safetyImpact: 'critical',
    warrantyMonths: 24,
    weightRange: [3200, 9500],
    tags: ['tyre', 'tyres', 'grip', 'safety', 'rubber'],
    specs: (rng, ctx) => {
      // Tyre sizes are constrained by segment: a 150-section rear does not
      // belong on a 110cc commuter, and a 90-section will not carry a 650.
      const SIZES_BY_SEGMENT = {
        'commuter-125': { Front: ['2.75-18', '80/100-18', '90/90-17'], Rear: ['90/90-18', '100/90-17', '110/80-17'] },
        'street-160': { Front: ['80/100-17', '90/90-17', '100/80-17'], Rear: ['110/80-17', '120/80-17', '130/70-17'] },
        'mid-250': { Front: ['100/80-17', '110/70-17'], Rear: ['130/70-17', '140/70-17', '150/60-17'] },
        'classic-350': { Front: ['90/90-19', '100/90-19', '110/90-18'], Rear: ['110/90-18', '120/80-18', '130/80-18'] },
        'performance-400': { Front: ['110/70-17', '120/70-17'], Rear: ['150/60-17', '160/60-17'] },
        'big-bike': { Front: ['120/70-17'], Rear: ['160/60-17', '180/55-17', '190/55-17'] },
        adventure: { Front: ['90/90-21', '100/90-19', '110/80-19'], Rear: ['120/90-17', '130/80-17', '150/70-17'] },
      };
      const position = rng.pick(['Front', 'Rear']);
      const pool = SIZES_BY_SEGMENT[ctx.segment.key] || SIZES_BY_SEGMENT['street-160'];
      return {
      Size: rng.pick(pool[position]),
      Position: position,
      Construction: rng.pick(['Radial', 'Bias Ply']),
      'Tube Type': rng.pick(['Tubeless', 'Tubeless', 'Tube Type']),
      'Load / Speed Index': rng.pick(['58P', '62H', '66S', '69W']),
      'Tread Pattern': rng.pick(['Directional Street', 'Dual-Compound Sport', 'All-Weather Touring', 'Block Dual-Sport']),
      'Fits Segment': ctx.segment.label,
      };
    },
    features: () => [
      'Silica-enriched compound for wet-weather grip',
      'Optimised tread void ratio channels water away',
      'Stable carcass construction for confident turn-in',
      'Even wear profile across the full tread width',
      'Fit front and rear as a matched set for predictable handling',
    ],
    usage: 'The only contact with the road. Check the date code — tyres age even when unused.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${ctx.specs.Size}, ${an(ctx.specs.Construction.toLowerCase())} ${ctx.specs['Tube Type'].toLowerCase()} tyre rated ${ctx.specs['Load / Speed Index']} with ${an(ctx.specs['Tread Pattern'].toLowerCase())} pattern. Suits the ${ctx.specs.Position.toLowerCase()} of ${ctx.segment.label} motorcycles. Fitting requires a tyre machine and wheel balancing.`,
  },

  // ══ Electrical ══
  {
    partCategory: 'aux_light',
    axis: 'plain',
    universal: true,
    brands: ['HJG', 'Moto Torque', 'Autofy', 'Vardhman', 'Bikers Choice'],
    series: ['LED Fog Light Pair', 'LED Auxiliary Spot Light', 'LED Headlight Bulb', 'LED Indicator Set', 'Light Bar 12-inch'],
    priceBand: [650, 9500],
    installationDifficulty: 4,
    beginnerFriendly: false,
    safetyImpact: 'high',
    warrantyMonths: 12,
    weightRange: [180, 1400],
    tags: ['led', 'light', 'fog light', 'auxiliary light', 'visibility', 'electrical'],
    specs: (rng) => ({
      'Power Draw': `${rng.int(9, 60)} W`,
      'Luminous Flux': `${rng.int(900, 6000)} lm`,
      'Colour Temperature': rng.pick(['6000K Cool White', '5000K Neutral', '3000K Yellow']),
      'Beam Pattern': rng.pick(['Spot', 'Flood', 'Combo Spot + Flood']),
      'IP Rating': rng.pick(['IP66', 'IP67', 'IP68']),
      Voltage: '12V DC',
      'Housing Material': rng.pick(['Die-cast Aluminium', 'Polycarbonate + Alloy']),
    }),
    features: () => [
      'Substantially brighter than an equivalent halogen unit',
      'Sealed housing rated for monsoon riding',
      'Aluminium body doubles as a heatsink for LED longevity',
      'Supplied with a fused relay harness — never wire direct to the battery',
      'Aim low so oncoming traffic is not dazzled',
    ],
    usage: 'Improves both seeing and being seen. Must be wired through a fused relay.',
    describe: (b, s, ctx) =>
      `${b} ${s} drawing ${ctx.specs['Power Draw']} and producing ${ctx.specs['Luminous Flux']} at ${ctx.specs['Colour Temperature']}, with a ${ctx.specs['Beam Pattern'].toLowerCase()} beam. ${ctx.specs['IP Rating']} sealed ${lc(ctx.specs['Housing Material'])} housing for 12V systems. Fit through a fused relay harness and check your total electrical load against the charging system.`,
  },
  {
    partCategory: 'phone_holder',
    axis: 'plain',
    universal: true,
    brands: ['Quad Lock Style', 'RAM Style', 'Moto Torque', 'Autofy', 'Ulanzi Style'],
    series: ['Vibration-Damped Phone Mount', 'Claw Phone Holder', 'Wireless Charging Mount', 'USB Charger with Mount', 'Dual USB Charger'],
    priceBand: [450, 6500],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 12,
    weightRange: [110, 480],
    tags: ['phone holder', 'phone mount', 'usb charger', 'gps mount', 'navigation', 'electronics'],
    specs: (rng, ctx) => {
      const isCharger = ctx.series.includes('Charger');
      return {
        'Mount Type': rng.pick(['Handlebar Clamp', 'Mirror Stem', 'Handlebar or Mirror Stem']),
        'Bar Diameter': rng.pick(['22 mm', '22-28 mm', '22-32 mm']),
        'Device Size': rng.pick(['4.7" - 6.8"', '4.5" - 7.0"']),
        'Vibration Damping': rng.pick(['Rubber isolators', 'Fluid damper', 'None']),
        ...(isCharger
          ? { Output: rng.pick(['5V 2.4A', 'QC 3.0 18W', 'PD 20W']), 'Water Resistance': 'IP65 with dust cap' }
          : { 'Water Resistance': rng.pick(['Splash resistant', 'Rain cover included']) }),
      };
    },
    features: (rng, ctx) => [
      'Secure four-point retention that holds through potholes',
      ctx.series.includes('Charger') ? 'Fast-charge output keeps navigation running all day' : 'One-handed device insertion and release',
      rng.pick(['Rubber isolators reduce vibration reaching the phone camera', 'Tool-free handlebar clamp']),
      'Rotates between portrait and landscape',
      'Fits standard motorcycle handlebars and mirror stems',
    ],
    usage: 'Handlebar vibration can damage phone camera stabilisers — choose a damped mount.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${an(ctx.specs['Mount Type'].toLowerCase())} mount for ${ctx.specs['Bar Diameter']} bars, holding devices from ${ctx.specs['Device Size']}. Vibration damping: ${ctx.specs['Vibration Damping'].toLowerCase()}.${ctx.specs.Output ? ` Charging output ${ctx.specs.Output}.` : ''} ${ctx.specs['Water Resistance']}.`,
  },
  {
    partCategory: 'accessories',
    axis: 'plain',
    universal: true,
    brands: ['Exide', 'Amaron', 'Bosch', 'Livguard', 'Moto Torque', 'Steelbird'],
    series: [
      'Maintenance-Free Battery 5Ah',
      'Maintenance-Free Battery 9Ah',
      'Maintenance-Free Battery 12Ah',
      'Smart Battery Charger',
      'Paddock Stand Rear',
      'Disc Brake Lock',
      'Bike Body Cover',
      'Tyre Inflator Compact',
      'Tool Kit 22-piece',
      'Tank Bag Magnetic',
    ],
    priceBand: [550, 12000],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 18,
    weightRange: [400, 4200],
    tags: ['accessories', 'battery', 'security', 'tools', 'garage'],
    specs: (rng, ctx) => {
      if (ctx.series.includes('Battery') && !ctx.series.includes('Charger')) {
        const ah = ctx.series.match(/(\d+)Ah/)?.[1] || '9';
        return {
          Capacity: `${ah} Ah`,
          Voltage: '12V',
          Type: 'VRLA Maintenance-Free',
          'CCA Rating': `${rng.int(60, 180)} A`,
          Terminal: rng.pick(['Left +ve', 'Right +ve']),
          Warranty: '18 months',
        };
      }
      // A load rating is only meaningful for load-bearing items; quoting one
      // for a battery charger or a disc lock would be nonsense data.
      const loadBearing = /Stand|Tank Bag/i.test(ctx.series);
      return {
        Material: rng.pick(['Powder-coated Steel', 'Aluminium Alloy', 'Reinforced Nylon', 'Polyester 600D']),
        Compatibility: 'Universal fit',
        ...(loadBearing ? { 'Weight Capacity': rng.pick(['Up to 250 kg', 'Up to 180 kg']) } : {}),
        Portability: rng.pick(['Foldable', 'Compact storage bag included', 'Fixed']),
      };
    },
    features: (rng, ctx) =>
      ctx.series.includes('Battery') && !ctx.series.includes('Charger')
        ? [
            'Sealed VRLA construction — no topping up required',
            'Low self-discharge for reliable starting after a layup',
            'Vibration-resistant internal plate design',
            'Supplied charged and ready to fit',
            'Use a smart charger during long storage to maximise life',
          ]
        : [
            'Built for daily garage and roadside use',
            rng.pick(['Corrosion-resistant finish', 'Compact enough to carry under the seat']),
            'Universal fitment across motorcycle types',
            'Straightforward setup with no special tools',
            'Practical addition to any home workshop',
          ],
    usage: 'Practical garage and touring essentials that fit almost any motorcycle.',
    describe: (b, s, ctx) =>
      ctx.series.includes('Battery') && !ctx.series.includes('Charger')
        ? `${b} ${s} — a ${ctx.specs.Voltage} ${ctx.specs.Capacity} ${ctx.specs.Type.toLowerCase()} battery with a ${ctx.specs['CCA Rating']} cold-cranking rating and ${ctx.specs.Terminal.toLowerCase()} terminal layout. Supplied charged and ready to fit, with an ${ctx.specs.Warranty} warranty.`
        : `${b} ${s} in ${lc(ctx.specs.Material)}. ${ctx.specs.Compatibility} across motorcycle types${ctx.specs['Weight Capacity'] ? `, rated to ${ctx.specs['Weight Capacity'].toLowerCase()}` : ''}. ${ctx.specs.Portability}. A practical addition to the home garage or touring kit.`,
  },

  // ══ Controls, styling and touring ══
  {
    partCategory: 'handlebar',
    axis: 'segment',
    brands: ['ZANA', 'Moto Torque', 'Renthal Style', 'Bikers Choice'],
    series: ['Handlebar Riser Kit', 'Fat Bar 28mm', 'Clip-On Handlebar Set', 'Touring Handlebar'],
    priceBand: [900, 8500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'high',
    warrantyMonths: 6,
    weightRange: [450, 1800],
    tags: ['handlebar', 'riser', 'clip-on', 'ergonomics', 'comfort'],
    specs: (rng, ctx) => ({
      'Clamp Diameter': rng.pick(['22 mm', '28.6 mm']),
      Material: rng.pick(['6061-T6 Aluminium', 'CNC Billet Aluminium', 'Chromoly Steel']),
      Rise: rng.pick(['20 mm', '30 mm', '40 mm', '50 mm']),
      Finish: rng.pick(['Anodised Black', 'Silver Anodised', 'Powder-coated Black']),
      'Cable Length Note': 'Check OEM cable and hose length before fitting',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Changes bar height and sweep to relieve wrist and shoulder strain',
      'CNC-machined clamps distribute load evenly',
      'Anodised finish resists weathering',
      'Reversible back to the standard setup',
      'Verify cable and brake-hose length before committing to a taller rise',
    ],
    usage: 'The cheapest fix for wrist, shoulder and lower-back discomfort on longer rides.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} machines — ${lc(ctx.specs.Material)} with ${an(ctx.specs['Clamp Diameter'])} clamp and ${ctx.specs.Rise} rise, finished in ${lc(ctx.specs.Finish)}. Repositions the bars for a more upright, comfortable riding stance. Confirm your cable and hose lengths before fitting.`,
  },
  {
    partCategory: 'grips',
    axis: 'colour',
    universal: true,
    brands: ['Domino Style', 'Moto Torque', 'ZANA', 'Autofy'],
    series: ['Anti-Vibration Grips', 'Gel Comfort Grips', 'Heated Grips'],
    priceBand: [280, 5500],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'medium',
    warrantyMonths: 6,
    weightRange: [120, 420],
    tags: ['grips', 'handlebar grips', 'comfort', 'ergonomics'],
    specs: (rng, ctx) => ({
      'Bar Diameter': '22 mm standard',
      Material: rng.pick(['Dual-density Rubber', 'Gel-filled Rubber', 'Kraton Compound']),
      Length: rng.pick(['120 mm', '125 mm', '130 mm']),
      'End Type': rng.pick(['Open-end (bar-end compatible)', 'Closed-end']),
      Colour: ctx.variant,
      ...(ctx.series.includes('Heated') ? { 'Heat Settings': '3-stage with handlebar switch', 'Power Draw': '24 W' } : {}),
    }),
    features: (rng, ctx) => [
      'Dampens handlebar vibration to reduce hand numbness',
      'Textured surface holds grip in wet conditions',
      ctx.series.includes('Heated') ? 'Three-stage heat control for cold-weather riding' : 'Supplied as a pair with grip adhesive',
      'Fits standard 22 mm handlebars',
      rng.pick(['Open-end design accepts bar-end weights and mirrors', 'Ergonomic profile reduces palm pressure']),
    ],
    usage: 'Always use grip glue. A grip that spins on the throttle tube is dangerous.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${ctx.variant} — ${lc(ctx.specs.Material)} construction, ${ctx.specs.Length} long with an ${ctx.specs['End Type'].toLowerCase()} design for standard 22 mm bars.${ctx.specs['Heat Settings'] ? ` ${ctx.specs['Heat Settings']}.` : ''} Reduces vibration-induced hand fatigue on longer rides. Fit with grip adhesive.`,
  },
  {
    partCategory: 'mirror',
    axis: 'colour',
    universal: true,
    brands: ['Rizoma Style', 'ZANA', 'Moto Torque', 'Autofy'],
    series: ['Bar-End Mirror Pair', 'CNC Round Mirror', 'Folding Stem Mirror'],
    priceBand: [550, 7500],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'high',
    warrantyMonths: 6,
    weightRange: [280, 780],
    tags: ['mirror', 'bar end mirror', 'rear view', 'visibility', 'safety'],
    specs: (rng, ctx) => ({
      'Mount Type': rng.pick(['Bar-End', 'M10 Stem', 'M8 Stem']),
      'Thread Direction': rng.pick(['Right-hand', 'Right + Left supplied']),
      'Glass Type': rng.pick(['Convex', 'Flat']),
      Material: rng.pick(['CNC Aluminium', 'Alloy + ABS']),
      'Sold As': 'Pair',
      Colour: ctx.variant,
    }),
    features: () => [
      'Wider rear view than most factory mirrors',
      'CNC-machined stem with smooth ball-joint adjustment',
      'Anti-vibration construction keeps the image steady',
      'Folds inward for filtering and parking',
      'Confirm your local regulations on mirror count and size',
    ],
    usage: 'A genuine safety upgrade — many stock mirrors mostly show your own arms.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${ctx.variant} — ${ctx.specs['Mount Type'].toLowerCase()} mounting with ${ctx.specs['Thread Direction'].toLowerCase()} thread and ${ctx.specs['Glass Type'].toLowerCase()} glass in ${an(lc(ctx.specs.Material))} housing. Sold as a pair. Gives a wider, steadier rear view than most factory mirrors.`,
  },
  {
    partCategory: 'windshield',
    axis: 'segment',
    brands: ['Puig Style', 'ZANA', 'Givi Style', 'Moto Torque'],
    series: ['Touring Windscreen', 'Sport Fly Screen', 'Adjustable Windshield'],
    priceBand: [1200, 11000],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [600, 2200],
    tags: ['windshield', 'windscreen', 'touring', 'wind protection'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['3 mm Cast Acrylic', '4 mm Polycarbonate', '3 mm Polycarbonate']),
      Height: rng.pick(['Low (+0 mm)', 'Standard (+50 mm)', 'Tall (+100 mm)']),
      Tint: rng.pick(['Clear', 'Light Smoke', 'Dark Smoke']),
      Adjustable: ctx.series.includes('Adjustable') ? 'Yes — 4 positions' : 'No',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Deflects wind blast off the chest and helmet at highway speed',
      'Reduces rider fatigue noticeably on long rides',
      'Hard-coated surface resists scratching and UV yellowing',
      'Bolts to the OEM mounting points',
      'Choose a height you can look over, not through',
    ],
    usage: 'Touring comfort. A screen that is slightly too tall can cause helmet buffeting.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} machines, moulded in ${lc(ctx.specs.Material)} at ${ctx.specs.Height.toLowerCase()} height with a ${ctx.specs.Tint.toLowerCase()} tint. Adjustable: ${ctx.specs.Adjustable}. Cuts wind pressure on the chest and helmet to reduce fatigue over distance.`,
  },
  {
    partCategory: 'luggage',
    axis: 'plain',
    universal: true,
    brands: ['Viaterra', 'Rynox', 'Guardian Gears', 'Givi Style', 'ZANA'],
    series: ['Tank Bag 12L', 'Saddle Stay Kit', 'Dry Bag 30L', 'Tail Bag 25L', 'Pannier Set 2x30L'],
    priceBand: [1200, 18000],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 12,
    weightRange: [700, 6500],
    tags: ['luggage', 'tank bag', 'saddle bag', 'panniers', 'touring'],
    specs: (rng, ctx) => ({
      Capacity: ctx.series.match(/(\d+L|\d+x\d+L)/)?.[0] || '20L',
      Material: rng.pick(['1680D Ballistic Nylon', '600D Polyester + PU', 'Tarpaulin PVC']),
      'Water Resistance': rng.pick(['Fully waterproof', 'Water-resistant + rain cover', 'Waterproof roll-top']),
      'Mount Type': rng.pick(['Magnetic + strap', 'Bungee strap system', 'Quick-release buckles']),
      'Reflective Detail': 'Yes',
    }),
    features: () => [
      'Carries weight on the bike instead of on your back',
      'Weatherproof construction keeps kit dry in monsoon conditions',
      'Reflective panels improve rear conspicuity',
      'Packs down small when not in use',
      'Keep heavy items low and forward for stable handling',
    ],
    usage: 'Load evenly across both sides and stay within the rack weight limit.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${ctx.specs.Capacity} of ${ctx.specs['Water Resistance'].toLowerCase()} storage in ${lc(ctx.specs.Material)}, secured with ${an(ctx.specs['Mount Type'].toLowerCase())} system. Reflective detailing improves visibility from behind. Universal fitment across most motorcycles.`,
  },
  {
    partCategory: 'top_box',
    axis: 'plain',
    universal: true,
    brands: ['Givi Style', 'ZANA', 'Guardian Gears', 'Viaterra'],
    series: ['Top Box 32L', 'Top Box 45L', 'Top Box 52L with Backrest'],
    priceBand: [3500, 19000],
    installationDifficulty: 3,
    beginnerFriendly: true,
    safetyImpact: 'medium',
    warrantyMonths: 12,
    weightRange: [3200, 6800],
    tags: ['top box', 'top case', 'luggage', 'touring', 'storage'],
    specs: (rng, ctx) => ({
      Capacity: ctx.series.match(/\d+L/)?.[0] || '45L',
      Material: 'Impact-resistant ABS',
      'Lock Type': rng.pick(['Keyed barrel lock', 'Keyed with quick-release plate']),
      'Helmet Capacity': rng.pick(['One full-face', 'Two full-face', 'One full-face + kit']),
      'Max Load': rng.pick(['5 kg', '8 kg', '10 kg']),
      'Mounting Plate': 'Universal plate included',
    }),
    features: () => [
      'Lockable, weatherproof storage that stays on the bike',
      'Swallows a full-face helmet so you never carry it',
      'Quick-release plate lets you remove the box in seconds',
      'Integrated reflectors improve rear visibility',
      'Respect the stated load limit — weight high and far back can cause weave',
    ],
    usage: 'The most practical commuter accessory. Keep loads light and within the rack rating.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${ctx.specs.Capacity} of lockable ${lc(ctx.specs.Material)} storage that takes ${ctx.specs['Helmet Capacity'].toLowerCase()}. ${ctx.specs['Lock Type']} with a ${ctx.specs['Mounting Plate'].toLowerCase()}. Rated to a ${ctx.specs['Max Load']} maximum load — exceeding it can induce high-speed weave.`,
  },
  {
    partCategory: 'saddlebag',
    axis: 'plain',
    universal: true,
    brands: ['Viaterra', 'Guardian Gears', 'Rynox', 'ZANA'],
    series: ['Saddlebag Pair 30L', 'Leather Saddlebag Set', 'Expandable Saddlebag 40L'],
    priceBand: [2800, 15000],
    installationDifficulty: 3,
    beginnerFriendly: true,
    safetyImpact: 'medium',
    warrantyMonths: 12,
    weightRange: [2200, 5400],
    tags: ['saddlebag', 'panniers', 'luggage', 'touring'],
    specs: (rng, ctx) => ({
      Capacity: ctx.series.match(/\d+L/)?.[0] || '30L',
      Material: rng.pick(['1680D Ballistic Nylon', 'Genuine Leather', 'Tarpaulin PVC']),
      'Water Resistance': rng.pick(['Waterproof roll-top', 'Rain cover included']),
      'Heat Shield': 'Exhaust-side heat shielding fitted',
      'Support Required': 'Saddle stay recommended',
    }),
    features: () => [
      'Balanced side storage that keeps weight low',
      'Heat shielding on the exhaust side',
      'Reflective piping for night visibility',
      'Roll-top or rain-cover weather protection',
      'Use a saddle stay so the bag cannot contact the wheel',
    ],
    usage: 'Pack both sides evenly. Always fit a saddle stay to keep the bag off the wheel.',
    describe: (b, s, ctx) =>
      `${b} ${s} — ${ctx.specs.Capacity} per side in ${lc(ctx.specs.Material)} with ${ctx.specs['Water Resistance'].toLowerCase()} protection. ${ctx.specs['Heat Shield']}. ${ctx.specs['Support Required']} to prevent contact with the rear wheel.`,
  },
  {
    partCategory: 'seat',
    axis: 'segment',
    brands: ['Seat Concepts Style', 'ZANA', 'Moto Torque', 'Comfort Ride'],
    series: ['Gel Comfort Seat', 'Touring Seat', 'Low-Rider Seat', 'Seat Cover Anti-Slip'],
    priceBand: [800, 12000],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 12,
    weightRange: [900, 3800],
    tags: ['seat', 'seat cover', 'comfort', 'touring', 'ergonomics'],
    specs: (rng, ctx) => ({
      'Foam Type': rng.pick(['Dual-density Foam', 'Gel + Foam Composite', 'High-density Foam']),
      Cover: rng.pick(['Anti-slip Synthetic Leather', 'Weatherproof Vinyl', 'Perforated Leatherette']),
      'Height Change': rng.pick(['Stock height', '-20 mm lower', '+15 mm taller']),
      Stitching: rng.pick(['Diamond quilted', 'Straight-line', 'Contrast double stitch']),
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Reduces pressure points on rides beyond an hour',
      'Weatherproof cover resists monsoon soaking',
      'Anti-slip surface keeps you planted under braking',
      'Retains the OEM mounting latch',
      'Foam density matters more than raw thickness for long-distance comfort',
    ],
    usage: 'The most common comfort complaint on any bike. Lower options help shorter riders reach the ground.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} motorcycles, built on ${lc(ctx.specs['Foam Type'])} with ${an(lc(ctx.specs.Cover))} cover and ${lc(ctx.specs.Stitching)} finish. Height versus stock: ${ctx.specs['Height Change'].toLowerCase()}. Retains the factory mounting latch for a direct swap.`,
  },
  {
    partCategory: 'brake_lever',
    axis: 'colour',
    brands: ['ZANA', 'Moto Torque', 'Rizoma Style', 'Carbon Racing'],
    series: ['Adjustable Brake Lever', 'Folding Brake Lever', 'Short Brake Lever'],
    priceBand: [650, 6500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'critical',
    warrantyMonths: 12,
    weightRange: [120, 320],
    tags: ['brake lever', 'lever', 'controls', 'safety'],
    specs: (rng, ctx) => ({
      Material: 'CNC 6061-T6 Aluminium',
      Adjustment: rng.pick(['6-position reach', '8-position reach']),
      Folding: ctx.series.includes('Folding') ? 'Yes — pivots in a drop' : 'No',
      Finish: `Anodised ${ctx.variant}`,
      'Sold As': 'Single lever',
    }),
    features: () => [
      'Reach adjustment lets you brake firmly with two fingers',
      'CNC-machined from solid billet aluminium',
      'Folding design survives a low-speed drop',
      'Anodised finish resists corrosion',
      'A safety-critical control — fit only quality components',
    ],
    usage: 'Correct lever reach measurably improves braking control, especially for smaller hands.',
    describe: (b, s, ctx) =>
      `${b} ${s} in anodised ${ctx.variant} — CNC-machined ${ctx.specs.Material} with ${ctx.specs.Adjustment.toLowerCase()} adjustment. Folding: ${ctx.specs.Folding}. Correct reach lets you brake confidently with two fingers. This is a safety-critical control; have it fitted professionally if you are unsure.`,
  },
  {
    partCategory: 'clutch_lever',
    axis: 'colour',
    brands: ['ZANA', 'Moto Torque', 'Rizoma Style', 'Carbon Racing'],
    series: ['Adjustable Clutch Lever', 'Folding Clutch Lever', 'Short Clutch Lever'],
    priceBand: [650, 6500],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'high',
    warrantyMonths: 12,
    weightRange: [120, 320],
    tags: ['clutch lever', 'lever', 'controls'],
    specs: (rng, ctx) => ({
      Material: 'CNC 6061-T6 Aluminium',
      Adjustment: rng.pick(['6-position reach', '8-position reach']),
      'Actuation Type': rng.pick(['Cable', 'Hydraulic']),
      Finish: `Anodised ${ctx.variant}`,
      'Sold As': 'Single lever',
    }),
    features: () => [
      'Reduces hand fatigue in stop-start traffic',
      'Reach adjustment suits a wide range of hand sizes',
      'Billet aluminium construction',
      'Set the correct free play after fitting',
      'Folding versions pivot away rather than snapping in a drop',
    ],
    usage: 'Set free play correctly after fitting — no free play causes the clutch to slip.',
    describe: (b, s, ctx) =>
      `${b} ${s} in anodised ${ctx.variant} — ${ctx.specs.Material} with ${ctx.specs.Adjustment.toLowerCase()} adjustment for ${ctx.specs['Actuation Type'].toLowerCase()} clutch systems. Lighter lever action reduces hand fatigue in traffic. Set the specified free play after installation.`,
  },
  {
    partCategory: 'foot_peg',
    axis: 'segment',
    brands: ['ZANA', 'Moto Torque', 'Carbon Racing', 'Bikers Choice'],
    series: ['Wide Footpeg Set', 'Rearset Kit', 'Pillion Footpeg Set'],
    priceBand: [900, 12000],
    installationDifficulty: 3,
    beginnerFriendly: false,
    safetyImpact: 'high',
    warrantyMonths: 6,
    weightRange: [400, 1600],
    tags: ['foot peg', 'footpeg', 'rearset', 'controls', 'ergonomics'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['CNC Aluminium', 'Stainless Steel', 'Alloy + Steel Pin']),
      Width: rng.pick(['50 mm', '60 mm', '70 mm']),
      Surface: rng.pick(['Serrated grip teeth', 'Replaceable rubber insert', 'Knurled']),
      Adjustable: ctx.series.includes('Rearset') ? 'Yes — multi-position' : 'No',
      'Fits Segment': ctx.segment.label,
    }),
    features: () => [
      'Wider platform reduces foot fatigue on long rides',
      'Aggressive grip surface holds boots in the wet',
      'Rearsets improve cornering ground clearance',
      'Machined from solid billet for strength',
      'Remember the gear and brake lever positions move with the pegs',
    ],
    usage: 'Wider pegs help enormously when standing off-road; rearsets suit track use.',
    describe: (b, s, ctx) =>
      `${b} ${s} for ${ctx.segment.label} machines — ${lc(ctx.specs.Material)} at ${ctx.specs.Width} width with ${an(lc(ctx.specs.Surface))} surface. Adjustable: ${ctx.specs.Adjustable}. Improves foot support and control, particularly when standing on rough surfaces.`,
  },
  {
    partCategory: 'tank_pad',
    axis: 'colour',
    universal: true,
    brands: ['ZANA', 'Moto Torque', 'Puig Style', 'Autofy'],
    series: ['Tank Traction Pad Set', 'Tank Protector Pad', 'Knee Grip Pad Pair'],
    priceBand: [280, 3200],
    installationDifficulty: 1,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 3,
    weightRange: [60, 220],
    tags: ['tank pad', 'tank grip', 'traction', 'protection', 'styling'],
    specs: (rng, ctx) => ({
      Material: rng.pick(['Silicone Traction', '3D Carbon-look Rubber', 'Transparent PU']),
      Adhesive: '3M automotive-grade backing',
      'Sold As': rng.pick(['Set of 3', 'Pair', 'Single centre pad']),
      Colour: ctx.variant,
      'Surface Prep': 'Degrease the tank thoroughly before fitting',
    }),
    features: () => [
      'Protects tank paint from belt buckles and jacket zips',
      'Gives the knees positive grip under braking',
      'Takes weight off your wrists by letting you grip with your legs',
      'Automotive-grade 3M adhesive backing',
      'Removes cleanly with gentle heat',
    ],
    usage: 'Degrease the tank properly before fitting or it will peel within weeks.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${ctx.variant} — ${lc(ctx.specs.Material)} with ${lc(ctx.specs.Adhesive)}, supplied as a ${ctx.specs['Sold As'].toLowerCase()}. Protects the tank finish while giving your knees positive grip under braking. Degrease the surface thoroughly before application.`,
  },
  {
    partCategory: 'number_plate',
    axis: 'plain',
    universal: true,
    brands: ['ZANA', 'Moto Torque', 'Autofy'],
    series: ['Number Plate Holder', 'Plate Light LED Kit', 'Adjustable Plate Bracket'],
    priceBand: [280, 2400],
    installationDifficulty: 2,
    beginnerFriendly: true,
    safetyImpact: 'low',
    warrantyMonths: 6,
    weightRange: [90, 380],
    tags: ['number plate', 'plate holder', 'licence plate', 'styling'],
    specs: (rng) => ({
      Material: rng.pick(['Powder-coated Steel', 'CNC Aluminium', 'ABS']),
      'Plate Light': rng.pick(['LED included', 'Not included']),
      Adjustability: rng.pick(['Fixed', 'Adjustable angle']),
      Hardware: 'Stainless fasteners included',
    }),
    features: () => [
      'Secure plate mounting with stainless fasteners',
      'Integrated LED plate illumination on selected variants',
      'Corrosion-resistant finish',
      'Compact profile suits tail-tidy conversions',
      'Confirm plate angle and lighting rules for your region',
    ],
    usage: 'Usually fitted alongside a tail tidy. Plate angle and illumination are legally regulated.',
    describe: (b, s, ctx) =>
      `${b} ${s} in ${lc(ctx.specs.Material)} with ${lc(ctx.specs.Adjustability)} positioning. Plate light: ${ctx.specs['Plate Light'].toLowerCase()}. Stainless fasteners supplied. Check your local regulations on plate angle and illumination before fitting.`,
  },
];

// ─── Generation ──────────────────────────────────────────────────────────────

function slugifySku(parts) {
  return parts
    .join('-')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function variantsFor(blueprint, rng) {
  switch (blueprint.axis) {
    case 'size':
      return SIZES;
    case 'colour':
      return rng.sample(COLOURS, 3);
    case 'segment':
      return SEGMENTS.filter((s) => rng.chance(0.55)).map((s) => s.key);
    default:
      return ['standard'];
  }
}

/**
 * Expands every blueprint into concrete product documents.
 *
 * @param {object} opts
 * @param {number} [opts.variantsPerSeries] cap on variants per brand+series pair
 * @returns {Array<object>} ready-to-insert Product documents
 */
function buildProducts(opts = {}) {
  const maxVariants = opts.variantsPerSeries || 3;
  const products = [];
  const seenSku = new Set();
  const seenName = new Set();

  for (const bp of BLUEPRINTS) {
    const ecommerceCategory = ECOMMERCE_CATEGORY[bp.partCategory] || 'accessories';

    for (const brand of bp.brands) {
      for (const series of bp.series) {
        const seriesRng = makeRng(`${bp.partCategory}|${brand}|${series}`);

        // Not every brand carries every series — keeps the catalogue from
        // looking like a cartesian product.
        if (!seriesRng.chance(0.72)) continue;

        let variants = variantsFor(bp, seriesRng);
        if (variants.length === 0) variants = ['standard'];
        variants = variants.slice(0, maxVariants);

        for (const variant of variants) {
          const segment = bp.axis === 'segment' ? SEGMENT_BY_KEY[variant] : null;
          if (bp.axis === 'segment' && !segment) continue;

          const skuSeed = slugifySku([
            bp.partCategory.slice(0, 4),
            brand.slice(0, 4),
            series.replace(/[^A-Za-z0-9]/g, '').slice(0, 8),
            String(variant).replace(/[^A-Za-z0-9]/g, '').slice(0, 8),
          ]);
          const sku = `GG-${skuSeed}`;
          if (seenSku.has(sku)) continue;

          const rng = makeRng(sku);
          const weightGrams = rng.int(bp.weightRange[0], bp.weightRange[1]);

          const ctx = { variant, series, segment, weightGrams, specs: {} };
          ctx.specs = bp.specs(rng, ctx);

          // Name: brand + series, qualified by the variant axis.
          let name = `${brand} ${series}`;
          if (bp.axis === 'size') name += ` - Size ${variant}`;
          else if (bp.axis === 'colour') name += ` - ${variant}`;
          else if (bp.axis === 'segment') name += ` for ${segment.label}`;
          name = name.slice(0, 100);

          const nameKey = name.toLowerCase();
          if (seenName.has(nameKey)) continue;

          const description = bp.describe(brand, series, ctx).slice(0, 1000);
          const features = bp.features(rng, ctx).slice(0, 6);

          // Ratings: most products carry reviews; a minority are too new to.
          const hasReviews = rng.chance(0.82);
          const ratingCount = hasReviews ? rng.int(3, 240) : 0;
          const ratingAvg = hasReviews
            ? Math.round((3.4 + rng.next() * 1.6) * 10) / 10
            : 0;

          const stock = rng.chance(0.09) ? 0 : rng.int(3, 180);

          const tags = Array.from(
            new Set([
              ...bp.tags,
              brand.toLowerCase(),
              bp.partCategory.replace(/_/g, ' '),
              ...(TAXONOMY[bp.partCategory] || []).slice(0, 3),
              ...(segment ? [segment.label.toLowerCase()] : []),
              ...(bp.universal ? ['universal fit'] : []),
            ])
          );

          seenSku.add(sku);
          seenName.add(nameKey);

          products.push({
            name,
            description,
            price: rng.price(bp.priceBand[0], bp.priceBand[1]),
            currency: 'INR',
            category: ecommerceCategory,
            partCategory: bp.partCategory,
            brand,
            sku,
            stock,
            images: imageFor(sku, bp.partCategory),
            status: stock === 0 ? 'out_of_stock' : 'active',
            tags,
            specs: ctx.specs,
            features,
            ratingAvg,
            ratingCount,
            fitmentDifficulty:
              bp.installationDifficulty <= 2 ? 'diy_easy' : bp.installationDifficulty <= 3 ? 'diy_moderate' : 'workshop',
            usageRecommendation: bp.usage,
            installationDifficulty: bp.installationDifficulty,
            beginnerFriendly: bp.beginnerFriendly,
            safetyImpact: bp.safetyImpact,
            universalFit: !!bp.universal,
            warrantyMonths: bp.warrantyMonths,
            weightGrams,
            viewCount: rng.int(20, 5200),
            salesCount: rng.int(0, 340),
            // Consumed by the fitment seeder, stripped before insert.
            _segmentKey: segment ? segment.key : null,
          });
        }
      }
    }
  }

  return products;
}

module.exports = {
  buildProducts,
  BLUEPRINTS,
  SEGMENTS,
  SEGMENT_BY_KEY,
  ECOMMERCE_CATEGORY,
  makeRng,
};
