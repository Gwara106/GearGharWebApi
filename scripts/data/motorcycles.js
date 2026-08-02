/**
 * Comprehensive motorcycle catalogue for GearGhar (Nepal / India / global).
 *
 * Compact tuple format per model: [model, engineCc, type, yearFrom, extraAliases?]
 *   type ∈ sport | naked | cruiser | adventure | commuter | scooter | offroad | other
 *
 * Aliases are AUTO-GENERATED from brand + model (spaced / despaced / brand-prefixed /
 * word-number swaps) and merged with any explicit extras. This keeps the dataset
 * small while giving the NLU many spellings to match. Add brands/models here and the
 * seeder + assistant pick them up automatically.
 */

const CATALOGUE = {
  Yamaha: [
    ['R15 V4', 155, 'sport', 2021, ['r15', 'r15v4', 'yzf r15 v4', 'yzf-r15 v4']],
    ['R15 V3', 155, 'sport', 2018, ['r15v3', 'yzf r15 v3']],
    ['R15S', 155, 'sport', 2022, []],
    ['MT-15', 155, 'naked', 2019, ['mt15', 'mt 15']],
    ['MT-15 V2', 155, 'naked', 2022, ['mt15 v2']],
    ['FZ', 149, 'naked', 2008, ['fz16']],
    ['FZ-S', 149, 'naked', 2014, ['fzs', 'fz s']],
    ['FZ25', 249, 'naked', 2017, ['fz 25']],
    ['FZ-X', 149, 'naked', 2021, ['fzx']],
    ['R3', 321, 'sport', 2015, ['yzf r3', 'r 3']],
    ['MT-03', 321, 'naked', 2020, ['mt03', 'mt 03']],
    ['R1', 998, 'sport', 2004, ['yzf r1']],
    ['R6', 599, 'sport', 2006, ['yzf r6']],
    ['MT-07', 689, 'naked', 2014, ['mt07']],
    ['MT-09', 889, 'naked', 2014, ['mt09']],
    ['Aerox 155', 155, 'scooter', 2021, ['aerox']],
    ['Fascino 125', 125, 'scooter', 2015, ['fascino']],
    ['Ray ZR 125', 125, 'scooter', 2016, ['ray zr']],
  ],
  Honda: [
    ['CB Hornet 2.0', 184, 'naked', 2020, ['hornet', 'hornet 2.0', 'cb hornet']],
    ['Hornet 160R', 160, 'naked', 2015, ['hornet 160']],
    ['CB350', 348, 'cruiser', 2021, ['cb 350']],
    ['CB350RS', 348, 'cruiser', 2021, ['cb350 rs']],
    ["H'ness CB350", 348, 'cruiser', 2020, ['hness cb350', 'highness cb350']],
    ['CB300R', 286, 'naked', 2019, ['cb 300r']],
    ['CB500X', 471, 'adventure', 2019, ['cb 500x']],
    ['CBR150R', 149, 'sport', 2012, ['cbr 150', 'cbr150']],
    ['CBR250R', 249, 'sport', 2011, ['cbr 250', 'cbr250']],
    ['CBR650R', 649, 'sport', 2019, ['cbr 650']],
    ['CB650R', 649, 'naked', 2019, ['cb 650r']],
    ['Africa Twin', 1084, 'adventure', 2016, ['crf1100', 'africatwin']],
    ['Gold Wing', 1833, 'other', 2018, ['goldwing']],
    ['Shine 125', 124, 'commuter', 2006, ['shine']],
    ['SP125', 124, 'commuter', 2019, ['sp 125']],
    ['Unicorn 160', 162, 'commuter', 2004, ['unicorn']],
    ['X-Blade 160', 162, 'commuter', 2018, ['xblade', 'x blade']],
    ['Activa 6G', 109, 'scooter', 2020, ['activa']],
    ['Dio 125', 124, 'scooter', 2012, ['dio']],
  ],
  Suzuki: [
    ['GN125', 124, 'commuter', 1982, ['gn 125', 'gn-125']],
    ['GS150R', 149, 'commuter', 2008, ['gs 150r', 'gs150']],
    ['Gixxer 155', 155, 'naked', 2014, ['gixxer']],
    ['Gixxer SF', 155, 'sport', 2015, ['gixxer sf 150']],
    ['Gixxer 250', 249, 'naked', 2019, ['gixxer 250']],
    ['Gixxer SF 250', 249, 'sport', 2019, ['gixxer sf250']],
    ['V-Strom 250', 249, 'adventure', 2017, ['vstrom 250', 'v strom 250']],
    ['V-Strom 650', 645, 'adventure', 2012, ['vstrom 650']],
    ['Hayabusa', 1340, 'sport', 1999, ['busa', 'gsx1300r']],
    ['GSX-R1000', 999, 'sport', 2009, ['gsxr1000', 'gsxr 1000']],
    ['GSX-S750', 749, 'naked', 2017, ['gsxs750']],
    ['Katana', 999, 'naked', 2019, ['gsx-s1000 katana']],
    ['Intruder 150', 155, 'cruiser', 2017, ['intruder']],
    ['Access 125', 124, 'scooter', 2007, ['access']],
    ['Burgman Street 125', 124, 'scooter', 2018, ['burgman']],
    ['Avenis 125', 124, 'scooter', 2021, ['avenis']],
  ],
  KTM: [
    ['Duke 125', 124, 'naked', 2017, ['duke125']],
    ['Duke 200', 199, 'naked', 2012, ['duke200']],
    ['Duke 250', 248, 'naked', 2017, ['duke250']],
    ['Duke 390', 373, 'naked', 2013, ['duke390']],
    ['RC 125', 124, 'sport', 2019, ['rc125']],
    ['RC 200', 199, 'sport', 2014, ['rc200']],
    ['RC 390', 373, 'sport', 2014, ['rc390']],
    ['Adventure 250', 248, 'adventure', 2020, ['adv 250', 'adventure250']],
    ['Adventure 390', 373, 'adventure', 2020, ['adv 390', 'adventure390']],
    ['Adventure 890', 889, 'adventure', 2021, ['adv 890']],
    ['1290 Super Duke R', 1301, 'naked', 2014, ['super duke', 'superduke 1290']],
    ['790 Duke', 799, 'naked', 2018, ['duke 790']],
  ],
  'Royal Enfield': [
    ['Classic 350', 349, 'cruiser', 2009, ['classic350', 're classic 350']],
    ['Bullet 350', 349, 'cruiser', 1932, ['bullet350', 'bullet']],
    ['Hunter 350', 349, 'cruiser', 2022, ['hunter350']],
    ['Meteor 350', 349, 'cruiser', 2020, ['meteor350', 'meteor']],
    ['Himalayan', 411, 'adventure', 2016, ['himalayan 411']],
    ['Himalayan 450', 452, 'adventure', 2023, ['himalayan450']],
    ['Interceptor 650', 648, 'cruiser', 2018, ['int 650', 'interceptor']],
    ['Continental GT 650', 648, 'cafe', 2018, ['conti gt 650', 'gt 650']],
    ['Scram 411', 411, 'adventure', 2022, ['scram']],
    ['Super Meteor 650', 648, 'cruiser', 2023, ['super meteor']],
    ['Shotgun 650', 648, 'cruiser', 2024, ['shotgun']],
  ],
  Bajaj: [
    ['Pulsar 150', 149, 'commuter', 2001, ['pulsar150']],
    ['Pulsar 125', 124, 'commuter', 2019, ['pulsar125']],
    ['Pulsar NS160', 160, 'naked', 2017, ['ns160', 'ns 160']],
    ['Pulsar NS200', 199, 'naked', 2012, ['ns200', 'ns 200']],
    ['Pulsar N160', 164, 'naked', 2022, ['n160']],
    ['Pulsar N250', 249, 'naked', 2021, ['n250']],
    ['Pulsar RS200', 199, 'sport', 2015, ['rs200', 'rs 200']],
    ['Pulsar 220F', 220, 'sport', 2007, ['pulsar 220', '220f']],
    ['Dominar 250', 248, 'adventure', 2020, ['dominar250']],
    ['Dominar 400', 373, 'adventure', 2017, ['dominar400', 'dominar']],
    ['Avenger Cruise 220', 220, 'cruiser', 2005, ['avenger 220', 'avenger cruise']],
    ['Avenger Street 160', 160, 'cruiser', 2016, ['avenger 160']],
    ['Platina 110', 115, 'commuter', 2006, ['platina']],
    ['CT 110', 115, 'commuter', 2019, ['ct110']],
    ['Chetak', 0, 'scooter', 2020, ['chetak electric']],
  ],
  TVS: [
    ['Apache RTR 160', 159, 'naked', 2007, ['apache 160', 'rtr 160']],
    ['Apache RTR 160 4V', 159, 'naked', 2018, ['apache 160 4v', 'rtr 160 4v']],
    ['Apache RTR 180', 177, 'naked', 2009, ['apache 180', 'rtr 180']],
    ['Apache RTR 200 4V', 197, 'naked', 2016, ['apache 200', 'rtr 200']],
    ['Apache RR 310', 312, 'sport', 2017, ['apache rr310', 'rr 310']],
    ['Ronin', 225, 'cruiser', 2022, ['ronin 225']],
    ['Raider 125', 124, 'commuter', 2021, ['raider']],
    ['Radeon', 109, 'commuter', 2018, []],
    ['Star City Plus', 109, 'commuter', 2016, ['star city']],
    ['Jupiter', 109, 'scooter', 2013, ['jupiter 110']],
    ['NTORQ 125', 124, 'scooter', 2018, ['ntorq']],
    ['iQube', 0, 'scooter', 2020, ['iqube electric']],
  ],
  Hero: [
    ['Splendor Plus', 97, 'commuter', 2001, ['splendor']],
    ['HF Deluxe', 97, 'commuter', 2011, ['hf deluxe']],
    ['Passion Pro', 113, 'commuter', 2010, ['passion']],
    ['Glamour 125', 124, 'commuter', 2005, ['glamour']],
    ['Xtreme 125R', 124, 'naked', 2023, ['xtreme 125']],
    ['Xtreme 160R', 163, 'naked', 2020, ['xtreme 160']],
    ['Xtreme 200S', 199, 'sport', 2019, ['xtreme 200']],
    ['Xpulse 200', 199, 'adventure', 2019, ['xpulse']],
    ['Xpulse 200 4V', 199, 'adventure', 2021, ['xpulse 4v']],
    ['Karizma XMR', 210, 'sport', 2023, ['karizma', 'xmr']],
    ['Destini 125', 124, 'scooter', 2018, ['destini']],
    ['Maestro Edge 125', 124, 'scooter', 2018, ['maestro']],
    ['Pleasure Plus', 110, 'scooter', 2019, ['pleasure']],
  ],
  Kawasaki: [
    ['Ninja 300', 296, 'sport', 2013, ['ninja300']],
    ['Ninja 400', 399, 'sport', 2018, ['ninja400']],
    ['Ninja 650', 649, 'sport', 2017, ['ninja650']],
    ['Ninja ZX-6R', 636, 'sport', 2009, ['zx6r', 'zx-6r']],
    ['Ninja ZX-10R', 998, 'sport', 2011, ['zx10r', 'zx-10r']],
    ['Ninja H2', 998, 'sport', 2015, ['h2', 'ninja h2r']],
    ['Z650', 649, 'naked', 2017, ['z 650']],
    ['Z900', 948, 'naked', 2017, ['z 900']],
    ['Z400', 399, 'naked', 2019, ['z 400']],
    ['Versys 650', 649, 'adventure', 2015, ['versys650']],
    ['Versys 1000', 1043, 'adventure', 2015, ['versys1000']],
    ['W175', 177, 'cruiser', 2023, ['w 175']],
    ['Vulcan S', 649, 'cruiser', 2015, ['vulcan']],
    ['Eliminator', 451, 'cruiser', 2023, ['eliminator 400']],
  ],
  CFMoto: [
    ['300NK', 292, 'naked', 2019, ['300 nk', '300nk']],
    ['250NK', 249, 'naked', 2018, ['250 nk']],
    ['650NK', 649, 'naked', 2019, ['650 nk']],
    ['650MT', 649, 'adventure', 2019, ['650 mt']],
    ['650GT', 649, 'other', 2019, ['650 gt']],
    ['300SR', 292, 'sport', 2020, ['300 sr']],
    ['450SR', 449, 'sport', 2022, ['450 sr']],
    ['450MT', 449, 'adventure', 2024, ['450 mt']],
    ['700CL-X', 693, 'naked', 2021, ['700clx', '700 clx']],
    ['800MT', 799, 'adventure', 2021, ['800 mt']],
  ],
  Benelli: [
    ['TNT 300', 300, 'naked', 2015, ['tnt300']],
    ['TNT 600', 600, 'naked', 2014, ['tnt600']],
    ['302R', 300, 'sport', 2018, ['302 r']],
    ['Leoncino 250', 249, 'naked', 2019, ['leoncino250']],
    ['Leoncino 500', 500, 'naked', 2017, ['leoncino500', 'leoncino']],
    ['TRK 251', 249, 'adventure', 2020, ['trk251']],
    ['TRK 502', 500, 'adventure', 2018, ['trk502']],
    ['TRK 502X', 500, 'adventure', 2018, ['trk 502 x']],
    ['Imperiale 400', 374, 'cruiser', 2019, ['imperiale']],
    ['502C', 500, 'cruiser', 2020, ['502 c']],
  ],
  Aprilia: [
    ['RS 457', 457, 'sport', 2024, ['rs457']],
    ['RS 660', 659, 'sport', 2020, ['rs660']],
    ['Tuono 660', 659, 'naked', 2021, ['tuono660']],
    ['SR 150', 155, 'scooter', 2016, ['sr150']],
    ['SR 160', 160, 'scooter', 2019, ['sr160']],
    ['Storm 125', 125, 'scooter', 2019, ['storm']],
    ['RSV4', 1099, 'sport', 2009, ['rsv 4']],
    ['Tuono V4', 1077, 'naked', 2011, ['tuono v4 1100']],
    ['RS 125', 125, 'sport', 2017, ['rs125']],
    ['SXR 160', 160, 'scooter', 2020, ['sxr160']],
  ],
  BMW: [
    ['G 310 R', 313, 'naked', 2017, ['g310r', 'g 310r']],
    ['G 310 GS', 313, 'adventure', 2017, ['g310gs']],
    ['G 310 RR', 313, 'sport', 2022, ['g310rr']],
    ['F 850 GS', 853, 'adventure', 2018, ['f850gs']],
    ['R 1250 GS', 1254, 'adventure', 2019, ['r1250gs', 'gs 1250']],
    ['S 1000 RR', 999, 'sport', 2009, ['s1000rr']],
    ['S 1000 R', 999, 'naked', 2014, ['s1000r']],
    ['F 900 R', 895, 'naked', 2020, ['f900r']],
    ['R 1250 RT', 1254, 'other', 2019, ['r1250rt']],
    ['M 1000 RR', 999, 'sport', 2021, ['m1000rr']],
  ],
  Triumph: [
    ['Speed 400', 398, 'naked', 2023, ['speed400']],
    ['Scrambler 400 X', 398, 'scrambler', 2023, ['scrambler 400', 'scrambler400x']],
    ['Trident 660', 660, 'naked', 2021, ['trident']],
    ['Street Triple 765', 765, 'naked', 2017, ['street triple', 'streettriple']],
    ['Speed Triple 1200', 1160, 'naked', 2021, ['speed triple']],
    ['Tiger 900', 888, 'adventure', 2020, ['tiger900']],
    ['Tiger 1200', 1160, 'adventure', 2022, ['tiger1200']],
    ['Bonneville T100', 900, 'cruiser', 2017, ['t100']],
    ['Bonneville T120', 1200, 'cruiser', 2016, ['t120']],
    ['Rocket 3', 2458, 'cruiser', 2019, ['rocket3', 'rocket iii']],
    ['Scrambler 1200', 1200, 'scrambler', 2019, ['scrambler1200']],
    ['Speed Twin', 1200, 'cruiser', 2019, ['speedtwin']],
  ],
  'Harley-Davidson': [
    ['X440', 440, 'naked', 2023, ['x 440', 'harley x440']],
    ['Iron 883', 883, 'cruiser', 2009, ['iron883', 'sportster 883']],
    ['Forty-Eight', 1202, 'cruiser', 2010, ['forty eight', '48']],
    ['Street 750', 749, 'cruiser', 2014, ['street750']],
    ['Fat Boy', 1868, 'cruiser', 2018, ['fatboy']],
    ['Sportster S', 1252, 'cruiser', 2021, ['sportster']],
    ['Nightster', 975, 'cruiser', 2022, ['nightster 975']],
    ['Street Bob', 1868, 'cruiser', 2018, ['streetbob']],
    ['Road King', 1868, 'cruiser', 2017, ['roadking']],
    ['Fat Bob', 1868, 'cruiser', 2018, ['fatbob']],
    ['Pan America 1250', 1252, 'adventure', 2021, ['pan america', 'panamerica']],
  ],
  Ducati: [
    ['Panigale V2', 955, 'sport', 2020, ['panigale v2']],
    ['Panigale V4', 1103, 'sport', 2018, ['panigale v4']],
    ['Monster', 937, 'naked', 2021, ['monster 937']],
    ['Scrambler Icon', 803, 'scrambler', 2015, ['scrambler 800', 'scrambler icon']],
    ['Multistrada V4', 1158, 'adventure', 2021, ['multistrada']],
    ['Diavel V4', 1158, 'cruiser', 2023, ['diavel']],
    ['Streetfighter V4', 1103, 'naked', 2020, ['streetfighter']],
    ['Hypermotard 950', 937, 'naked', 2019, ['hypermotard']],
    ['SuperSport 950', 937, 'sport', 2021, ['supersport']],
    ['DesertX', 937, 'adventure', 2022, ['desert x']],
  ],
};

// The Motorcycle schema only allows a fixed set of `type` values; map any richer
// labels used above onto the allowed enum.
const TYPE_MAP = {
  cafe: 'other',
  scrambler: 'offroad',
};

function normalise(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(brand, model) {
  return `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Auto-generate alias variants from brand + model, merged with explicit extras. */
function buildAliases(brand, model, extras = []) {
  const nb = normalise(brand);
  const nm = normalise(model);
  const variants = new Set();

  const add = (s) => {
    const n = normalise(s);
    if (n) variants.add(n);
  };

  add(nm); // "duke 390"
  add(nm.replace(/\s+/g, '')); // "duke390"
  add(`${nb} ${nm}`); // "ktm duke 390"
  add(`${nb} ${nm}`.replace(/\s+/g, '')); // "ktmduke390"

  // Word-number swaps: "duke 390" -> "390 duke", "390duke"
  const wn = nm.match(/^([a-z]+)\s+(\d+)$/);
  if (wn) {
    add(`${wn[2]} ${wn[1]}`);
    add(`${wn[2]}${wn[1]}`);
  }

  for (const e of extras) add(e);

  return Array.from(variants);
}

/**
 * Models sold as electric. Everything else is assumed petrol; override here
 * rather than widening every tuple in the catalogue.
 */
const ELECTRIC_SLUGS = new Set([]);

/**
 * Explicit braking overrides, keyed by slug. Anything absent is derived by
 * `deriveAbs` below.
 */
const ABS_OVERRIDES = {
  'ktm-duke-390': 'dual-channel',
  'ktm-rc-390': 'dual-channel',
  'yamaha-r3': 'dual-channel',
  'yamaha-mt-03': 'dual-channel',
  'kawasaki-ninja-300': 'dual-channel',
  'kawasaki-ninja-400': 'dual-channel',
  'honda-cb500x': 'dual-channel',
  'honda-africa-twin': 'switchable',
  'bmw-g-310-r': 'dual-channel',
  'bmw-g-310-gs': 'dual-channel',
  'triumph-speed-400': 'dual-channel',
  'triumph-scrambler-400-x': 'dual-channel',
  'royal-enfield-himalayan': 'switchable',
};

/**
 * Derives the braking system from displacement, type and model year.
 *
 * Rationale (documented so the assumption is auditable rather than invented):
 * Indian regulation from April 2019 requires ABS on machines above 125cc and
 * CBS at or below it, so the catalogue follows that split, with larger sport
 * and adventure machines getting dual-channel systems. Pre-2019 models are
 * marked 'none' unless explicitly overridden above.
 *
 * These are catalogue defaults for fitment reasoning, NOT manufacturer
 * specifications — always defer to the owner's manual for a specific machine.
 */
function deriveAbs(slug, cc, type, yearFrom) {
  if (ABS_OVERRIDES[slug]) return ABS_OVERRIDES[slug];

  const year = yearFrom || 0;
  const displacement = cc || 0;

  if (type === 'scooter') return displacement > 125 && year >= 2019 ? 'single-channel' : 'cbs';
  if (displacement <= 125) return year >= 2019 ? 'cbs' : 'none';
  if (year < 2019) return displacement >= 500 ? 'dual-channel' : 'none';

  if (displacement >= 300 && (type === 'sport' || type === 'adventure')) return 'dual-channel';
  if (displacement >= 500) return 'dual-channel';
  if (type === 'offroad') return 'switchable';
  return 'single-channel';
}

/** Flatten the catalogue into ready-to-insert motorcycle documents. */
function buildMotorcycles() {
  const docs = [];
  for (const [brand, models] of Object.entries(CATALOGUE)) {
    for (const [model, cc, rawType, yearFrom, extras = []] of models) {
      const type = TYPE_MAP[rawType] || rawType;
      const slug = slugify(brand, model);
      docs.push({
        brand,
        model,
        slug,
        type,
        engineCc: cc || undefined,
        yearFrom: yearFrom || undefined,
        abs: deriveAbs(slug, cc, type, yearFrom),
        fuelType: ELECTRIC_SLUGS.has(slug) ? 'electric' : 'petrol',
        aliases: buildAliases(brand, model, extras),
      });
    }
  }
  return docs;
}

module.exports = {
  CATALOGUE,
  buildMotorcycles,
  buildAliases,
  slugify,
  normalise,
  deriveAbs,
  ABS_OVERRIDES,
};
