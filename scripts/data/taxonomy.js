/**
 * Canonical motorcycle-accessory taxonomy (CommonJS mirror of
 * PRODUCT_CATEGORY_KEYWORDS in src/services/motorcycle-nlu.service.ts).
 * Keep the two in sync. Order matters: earlier = higher priority when a product
 * matches multiple categories during normalisation.
 */
const TAXONOMY = {
  exhaust: ['exhaust', 'silencer', 'muffler', 'slip-on', 'slip on', 'full system', 'end can'],
  handlebar: ['handlebar', 'handle bar', 'clip-on', 'clip on', 'riser', 'ape hanger'],
  grips: ['grip', 'grips', 'hand grip'],
  mirror: ['mirror', 'mirrors', 'rear view', 'rearview', 'bar end mirror'],
  crash_guard: ['crash guard', 'crash bar', 'leg guard', 'safety guard'],
  engine_guard: ['engine guard', 'bash plate', 'skid plate', 'sump guard', 'belly pan'],
  frame_slider: ['frame slider', 'frame sliders', 'crash slider', 'spool slider'],
  seat: ['seat cover', 'seat', 'seats', 'saddle', 'cushion'],
  tank_pad: ['tank pad', 'tank grip', 'tank protector', 'tank traction'],
  windshield: ['windshield', 'windscreen', 'wind deflector', 'fly screen', 'visor'],
  phone_holder: ['mobile holder', 'phone holder', 'phone mount', 'mobile mount', 'gps mount'],
  aux_light: ['auxiliary light', 'aux light', 'fog light', 'fog lamp', 'spot light', 'driving light'],
  tail_tidy: ['tail tidy', 'fender eliminator', 'tag hugger'],
  number_plate: ['number plate', 'license plate', 'plate holder', 'numberplate'],
  brake_lever: ['brake lever', 'brake levers'],
  clutch_lever: ['clutch lever', 'clutch levers'],
  foot_peg: ['foot peg', 'footpeg', 'foot pegs', 'rearset', 'rear set'],
  luggage: ['luggage', 'pannier', 'panniers', 'side case', 'tail bag', 'tank bag'],
  top_box: ['top box', 'top case', 'tail box', 'trunk'],
  saddlebag: ['saddlebag', 'saddle bag', 'saddlebags'],
  helmet: ['helmet', 'helmets', 'full face', 'open face', 'modular helmet'],
  gloves: ['glove', 'gloves', 'riding gloves'],
  jacket: ['jacket', 'jackets', 'riding jacket', 'mesh jacket'],
  riding_gear: ['riding gear', 'protective gear', 'body armor', 'body armour', 'riding suit', 'suit'],
  tyres: ['tyre', 'tyres', 'tire', 'tires'],
  chain: ['chain', 'chains', 'chain kit', 'chain lube'],
  sprocket: ['sprocket', 'sprockets', 'chain sprocket'],
  air_filter: ['air filter', 'air filters', 'performance filter'],
  oil_filter: ['oil filter', 'oil filters'],
  spark_plug: ['spark plug', 'spark plugs', 'iridium plug'],
  brakes: ['brake pad', 'brake pads', 'brake disc', 'brake caliper', 'rotor'],
  maintenance: ['engine oil', 'lubricant', 'coolant', 'cleaner', 'degreaser'],
  accessories: ['accessory', 'accessories'],
};

/**
 * Classifies a product into a single canonical category. Tags are weighted
 * higher than the name, and longer keyword hits beat shorter ones (so
 * "handlebar grips" tie-breaks toward the more specific signal). Returns null
 * when nothing matches.
 */
function classifyProduct(product) {
  const name = String(product.name || '').toLowerCase();
  const desc = String(product.description || '').toLowerCase();
  const tags = (product.tags || []).map((t) => String(t).toLowerCase());
  const tagBlob = tags.join(' ');

  let best = null; // { category, score }
  for (const [category, keywords] of Object.entries(TAXONOMY)) {
    let score = 0;
    for (const kw of keywords) {
      if (tagBlob.includes(kw)) score = Math.max(score, kw.length * 3); // tag hit weighted x3
      else if (name.includes(kw)) score = Math.max(score, kw.length * 2); // name hit x2
      else if (desc.includes(kw)) score = Math.max(score, kw.length); // description x1
    }
    if (score > 0 && (!best || score > best.score)) best = { category, score };
  }
  return best ? best.category : null;
}

module.exports = { TAXONOMY, classifyProduct };
