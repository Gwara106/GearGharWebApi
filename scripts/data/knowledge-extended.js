/**
 * Knowledge base expansion.
 *
 * PROVENANCE (methodology-relevant, keep this honest in the write-up):
 *  - ADDITIONAL_MAINTENANCE_TASKS and ADDITIONAL_SYMPTOM_RULES below are
 *    hand-authored general motorcycle guidance, in the same style and with the
 *    same `source.kind` semantics as scripts/data/knowledge.js.
 *  - specialiseMaintenance() and specialiseSymptoms() then derive
 *    machine-type-scoped variants from a curated subset of the base documents.
 *    These are DERIVED, not independently authored: each carries
 *    `derivedFrom: <baseKey>` so the distinction is visible in the database and
 *    can be reported separately when counting knowledge coverage.
 *
 * A derived variant is only emitted where the specialisation is genuinely
 * different — the interval, the difficulty or the procedure changes with the
 * machine type. It is not a copy with a new key.
 *
 * No document here is transcribed from a manufacturer service manual. Riders
 * must defer to their own OEM manual; every safetyCritical entry carries an
 * escalation flag the server enforces on the generated reply.
 */

const { MAINTENANCE_TASKS, SYMPTOM_RULES, PART_GLOSSARY, EDITORIAL, SERVICE } = require('./knowledge');

// ═══════════════════════════════════════════════════════════════════════════
// Additional hand-authored maintenance tasks
// ═══════════════════════════════════════════════════════════════════════════

const ADDITIONAL_MAINTENANCE_TASKS = [
  {
    taskKey: 'clutch-cable-free-play',
    title: 'Clutch free play adjustment',
    summary:
      'Too little free play makes the clutch slip; too much makes it drag and hunt for neutral. Set the play at the lever to the figure in your manual.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 5000,
    difficulty: 'diy_easy',
    steps: [
      'Measure the free play at the very tip of the clutch lever before resistance is felt',
      'Slacken the locknut on the in-line or lever-side adjuster',
      'Turn the adjuster until the play matches specification, typically 10-20 mm',
      'Retighten the locknut and confirm the play has not shifted',
      'Check the clutch fully disengages by selecting first gear with the engine running',
    ],
    toolsNeeded: ['Spanners', 'Ruler'],
    warningSigns: ['clutch slipping under acceleration', 'hard to find neutral', 'creeping at a standstill in gear'],
    relatedPartCategories: ['clutch_lever', 'maintenance'],
    safetyCritical: false,
    source: SERVICE,
  },
  {
    taskKey: 'throttle-free-play',
    title: 'Throttle free play and snap-back check',
    summary:
      'The throttle must return to closed on its own at every steering position. A sticking throttle is one of the few faults that can take control away from the rider.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 5000,
    intervalMonths: 6,
    difficulty: 'diy_easy',
    steps: [
      'Check the rotational free play at the throttle grip, typically 2-4 mm',
      'Open the throttle and release it — it must snap fully shut',
      'Repeat with the bars turned fully left and fully right',
      'Adjust at the in-line adjuster if the play is out of specification',
      'Lubricate the cable if the action feels heavy or notchy',
    ],
    toolsNeeded: ['Spanners', 'Cable luber', 'Ruler'],
    warningSigns: ['throttle does not snap shut', 'revs hang between gearchanges', 'heavy or gritty throttle action'],
    relatedPartCategories: ['grips', 'maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'steering-head-bearing-check',
    title: 'Steering head bearing check',
    summary:
      'Worn or wrongly tensioned steering head bearings cause vague steering and a notch at the straight-ahead position. Left unattended they cause high-speed weave.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 10000,
    intervalMonths: 12,
    difficulty: 'workshop',
    steps: [
      'Raise the front wheel clear of the ground on a paddock stand',
      'Turn the bars slowly lock to lock and feel for notchiness or tight spots',
      'Grip the fork legs and push and pull fore and aft, feeling for play at the headstock',
      'If notchy or loose, have the bearings adjusted or replaced',
      'Never ride with detectable play in the steering head',
    ],
    toolsNeeded: ['Front paddock stand', 'C-spanner', 'Torque wrench'],
    warningSigns: ['bars notch into the straight-ahead position', 'clunk under braking', 'weave at speed'],
    relatedPartCategories: ['handlebar'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'wheel-bearing-check',
    title: 'Wheel bearing inspection',
    summary:
      'Wheel bearings fail gradually and then suddenly. A rumble that changes with road speed rather than engine speed is the classic sign.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 15000,
    difficulty: 'workshop',
    steps: [
      'Raise each wheel clear of the ground in turn',
      'Spin the wheel and listen for rumble or grinding',
      'Rock the wheel side to side at the rim, feeling for lateral play',
      'Inspect the seals for grease weeping out',
      'Replace bearings in pairs on the affected wheel',
    ],
    toolsNeeded: ['Paddock stands', 'Socket set', 'Bearing driver'],
    warningSigns: ['rumble that tracks road speed', 'lateral play at the rim', 'grease around the hub seal'],
    relatedPartCategories: ['tyres'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'fork-oil-change',
    title: 'Fork oil replacement',
    summary:
      'Fork oil breaks down and the damping fades long before the seals leak. Replacing it restores composure over bumps and under braking.',
    appliesTo: { types: [], engineCcMin: 100, motorcycleSlugs: [] },
    intervalKm: 20000,
    intervalMonths: 24,
    difficulty: 'workshop',
    steps: [
      'Support the motorcycle securely with the front wheel off the ground',
      'Note the existing preload and damping settings before dismantling',
      'Drain the old oil completely and measure what comes out',
      'Refill with the specified grade and oil level for your model',
      'Reassemble, torque the clamps to specification and restore the settings',
    ],
    toolsNeeded: ['Workshop manual', 'Fork oil', 'Measuring cylinder', 'Torque wrench'],
    warningSigns: ['harsh over sharp bumps', 'excessive dive under braking', 'front end feels vague'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'radiator-clean',
    title: 'Radiator cleaning and fin straightening',
    summary:
      'Insects, mud and gravel block the radiator core and bend the fins, quietly reducing cooling capacity until the bike starts running hot in traffic.',
    appliesTo: { types: [], engineCcMin: 125, motorcycleSlugs: [] },
    intervalKm: 5000,
    intervalMonths: 6,
    difficulty: 'diy_easy',
    steps: [
      'Let the engine cool completely',
      'Rinse the radiator face gently from the engine side outward with low-pressure water',
      'Never use a pressure washer directly on the fins',
      'Straighten bent fins carefully with a fin comb or a blunt plastic tool',
      'Check the fan spins freely and the shroud is intact',
    ],
    toolsNeeded: ['Low-pressure hose', 'Fin comb', 'Soft brush'],
    warningSigns: ['temperature climbing in traffic', 'fan running constantly', 'visible debris in the core'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: false,
    source: SERVICE,
  },
  {
    taskKey: 'fuel-filter-replacement',
    title: 'Fuel filter replacement',
    summary:
      'A blocked fuel filter starves the engine under load, which shows up as a misfire or power loss at high revs long before it stops the bike entirely.',
    appliesTo: { types: [], engineCcMin: 100, motorcycleSlugs: [] },
    intervalKm: 20000,
    intervalMonths: 24,
    difficulty: 'workshop',
    steps: [
      'Depressurise the fuel system before disconnecting any line',
      'Work in a well-ventilated area with no ignition sources nearby',
      'On in-tank filters the pump assembly must be removed — a workshop job on most models',
      'Replace all disturbed seals and clamps',
      'Prime the system and check thoroughly for leaks before starting',
    ],
    toolsNeeded: ['Workshop manual', 'Fuel line clamps', 'Replacement seals'],
    warningSigns: ['misfire under load', 'power loss at high revs', 'hard starting after standing'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'brake-caliper-service',
    title: 'Brake caliper clean and piston service',
    summary:
      'Road grime builds behind the caliper pistons and dust seals until the pistons stop retracting cleanly, causing drag, heat and uneven pad wear.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 10000,
    intervalMonths: 12,
    difficulty: 'workshop',
    steps: [
      'Remove the caliper and pads, keeping the brake line attached and supported',
      'Clean the exposed piston faces and seal grooves with brake cleaner',
      'Ease the pistons out slightly by hand, clean, then push them back squarely',
      'Clean and re-grease the slider pins with the correct high-temperature grease',
      'Refit, pump the lever until firm, then check for drag before riding',
    ],
    toolsNeeded: ['Socket set', 'Brake cleaner', 'Caliper grease', 'Piston tool'],
    warningSigns: ['wheel does not spin freely', 'disc hot after a gentle ride', 'uneven pad wear side to side'],
    relatedPartCategories: ['brakes'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'headlight-alignment',
    title: 'Headlight beam alignment',
    summary:
      'A headlight aimed too high dazzles oncoming traffic; aimed too low it gives you almost no warning of hazards at speed. Realign after any suspension or load change.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalMonths: 12,
    difficulty: 'diy_easy',
    steps: [
      'Park facing a wall about 5 metres away on level ground',
      'Sit on the bike in your normal riding position with the usual load',
      'Mark the height of the headlight centre on the wall',
      'Adjust so the beam hot-spot sits slightly below that mark',
      'Recheck after fitting luggage or a pillion seat',
    ],
    toolsNeeded: ['Screwdriver', 'Tape measure', 'Assistant'],
    warningSigns: ['oncoming drivers flashing you', 'poor forward view at night', 'beam changed after fitting luggage'],
    relatedPartCategories: ['aux_light'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'nut-bolt-torque-check',
    title: 'Fastener torque check',
    summary:
      'Vibration loosens fasteners over time. A periodic check of the critical bolts costs minutes and prevents genuinely dangerous failures.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 5000,
    intervalMonths: 6,
    difficulty: 'diy_moderate',
    steps: [
      'Check the axle nuts front and rear against the manual torque figures',
      'Check the handlebar clamp, yoke and triple-clamp bolts',
      'Check the engine mounts, footpeg hangers and brake caliper bolts',
      'Check all aftermarket accessory mounts, which loosen fastest',
      'Never guess — use a calibrated torque wrench on safety-critical fasteners',
    ],
    toolsNeeded: ['Torque wrench', 'Socket set', 'Workshop manual'],
    warningSigns: ['rattles over bumps', 'visible movement at a bracket', 'thread-locker witness marks misaligned'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'tubeless-puncture-repair',
    title: 'Tubeless tyre puncture repair',
    summary:
      'A plug repair in the central tread area gets you home. It is a temporary measure — a plugged tyre should be inspected or replaced, never treated as permanent at speed.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    difficulty: 'diy_moderate',
    steps: [
      'Locate the puncture and remove the object with pliers',
      'Ream the hole with the supplied tool to clean the channel',
      'Insert the plug with rubber cement and trim it flush',
      'Inflate to the placard pressure and check for leaks with soapy water',
      'Ride gently to a tyre specialist — do not treat a plug as a permanent repair',
    ],
    toolsNeeded: ['Tubeless repair kit', 'Pliers', 'Compact inflator', 'Pressure gauge'],
    warningSigns: ['pressure dropping between rides', 'object embedded in the tread', 'sidewall damage — never repairable'],
    relatedPartCategories: ['tyres'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'chain-sprocket-replacement',
    title: 'Chain and sprocket set replacement',
    summary:
      'Chain and sprockets wear together as a set. Fitting one new component against worn ones destroys the new part quickly and wastes the money saved.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 25000,
    difficulty: 'workshop',
    steps: [
      'Slacken the rear axle and back off the chain adjusters fully',
      'Break the old chain with a chain breaker, or remove the clip link',
      'Replace the front and rear sprockets, torquing to specification',
      'Fit and rivet the new chain to the correct link count',
      'Set the chain slack, align the wheel and torque the axle nut',
    ],
    toolsNeeded: ['Chain breaker and riveter', 'Torque wrench', 'Socket set', 'Paddock stand'],
    warningSigns: ['chain lifts off the rear sprocket', 'hooked sprocket teeth', 'slack that will not stay set'],
    relatedPartCategories: ['chain', 'sprocket'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'monsoon-preparation',
    title: 'Monsoon and wet-season preparation',
    summary:
      'Sustained rain accelerates chain wear, corrodes connectors and drops available grip. A short seasonal preparation makes a large difference.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalMonths: 12,
    difficulty: 'diy_easy',
    steps: [
      'Check tread depth — wet grip falls sharply on a worn tyre',
      'Clean and lubricate the chain more frequently than the dry-weather interval',
      'Apply dielectric grease to exposed electrical connectors',
      'Check the brake pad thickness; wet grit accelerates wear substantially',
      'Treat the visor with a water-repellent and check your wet-weather gear',
    ],
    toolsNeeded: ['Chain lube', 'Dielectric grease', 'Tread depth gauge'],
    warningSigns: ['brakes feel weak in the first stop when wet', 'chain rusting between rides', 'flickering lights'],
    relatedPartCategories: ['chain', 'tyres', 'brakes'],
    safetyCritical: true,
    source: EDITORIAL,
  },
  {
    taskKey: 'first-service-run-in',
    title: 'First service and running-in',
    summary:
      'The first service removes the metal particles produced as the engine beds in. Skipping or delaying it is one of the most damaging things a new owner can do.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 1000,
    difficulty: 'workshop',
    steps: [
      'Book the first service at the interval in your manual, usually 500-1000 km',
      'Vary the engine speed during running-in rather than holding one constant rpm',
      'Avoid full-throttle acceleration and hard braking for the first few hundred kilometres',
      'Expect the oil and filter to be changed and all fasteners re-torqued',
      'Keep the service record — it protects your warranty',
    ],
    toolsNeeded: ['Owner manual', 'Service book'],
    warningSigns: ['delayed first service', 'metal glitter in the drained oil is normal at this stage'],
    relatedPartCategories: ['maintenance', 'oil_filter'],
    safetyCritical: false,
    source: EDITORIAL,
  },
  {
    taskKey: 'pillion-load-setup',
    title: 'Setting the bike up for a pillion or luggage',
    summary:
      'Carrying a passenger or luggage changes the geometry, braking distance and tyre loading. Two quick adjustments restore most of the lost composure.',
    appliesTo: { types: [], engineCcMin: 100, motorcycleSlugs: [] },
    difficulty: 'diy_easy',
    steps: [
      'Increase rear tyre pressure to the two-up figure on the placard',
      'Add rear preload using the adjuster or C-spanner',
      'Re-aim the headlight, which will now point higher',
      'Allow substantially more braking distance and gentler inputs',
      'Distribute luggage weight low and evenly across both sides',
    ],
    toolsNeeded: ['C-spanner', 'Pressure gauge'],
    warningSigns: ['rear squatting heavily', 'headlight dazzling oncoming traffic', 'wallowing in corners two-up'],
    relatedPartCategories: ['luggage', 'tyres'],
    safetyCritical: true,
    source: EDITORIAL,
  },
  {
    taskKey: 'exhaust-inspection',
    title: 'Exhaust system inspection',
    summary:
      'Exhaust leaks upset the fuelling, sound harsh and can allow fumes toward the rider. Corrosion at the header joint is the usual starting point.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 10000,
    intervalMonths: 12,
    difficulty: 'diy_moderate',
    steps: [
      'Inspect the header-to-head joint for black sooty streaks indicating a leak',
      'Check the mounting brackets and rubber isolators for cracks',
      'Check the header clamps are torqued evenly',
      'Look for rust perforation on the silencer underside',
      'Replace the exhaust gasket whenever the header is disturbed',
    ],
    toolsNeeded: ['Socket set', 'Torque wrench', 'Torch'],
    warningSigns: ['ticking or popping at the header', 'sooty deposits at a joint', 'exhaust note suddenly harsher'],
    relatedPartCategories: ['exhaust'],
    safetyCritical: false,
    source: SERVICE,
  },
  {
    taskKey: 'swingarm-linkage-grease',
    title: 'Swingarm and suspension linkage greasing',
    summary:
      'Linkage bearings run dry and seize, which stiffens the rear suspension and eventually wrecks expensive components. Most owners never touch them until it is too late.',
    appliesTo: { types: [], engineCcMin: 150, motorcycleSlugs: [] },
    intervalKm: 20000,
    intervalMonths: 24,
    difficulty: 'workshop',
    steps: [
      'Support the bike so the rear wheel hangs free and the linkage is unloaded',
      'Dismantle the linkage one fastener at a time, noting the assembly order',
      'Clean and inspect each needle roller bearing and spacer for pitting',
      'Repack with waterproof marine or lithium grease',
      'Reassemble and torque every fastener to specification',
    ],
    toolsNeeded: ['Workshop manual', 'Torque wrench', 'Waterproof grease', 'Rear stand'],
    warningSigns: ['rear feels harsh over small bumps', 'creaking from the rear under load', 'no rear suspension movement at low speed'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'security-anti-theft',
    title: 'Security and anti-theft routine',
    summary:
      'Most motorcycle theft is opportunistic. Layered, visible deterrents move the thief on to an easier target.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalMonths: 1,
    difficulty: 'diy_easy',
    steps: [
      'Always use the steering lock, even for short stops',
      'Fit a visible disc lock with a reminder cable to the bars',
      'Where possible, chain the bike to an immovable ground anchor',
      'Park in lit, overlooked areas and vary your routine',
      'Record the frame and engine numbers and photograph the bike',
    ],
    toolsNeeded: ['Disc lock', 'Chain and ground anchor'],
    warningSigns: ['tampered lock barrel', 'bike moved from where it was parked', 'scratches around the ignition'],
    relatedPartCategories: ['accessories'],
    safetyCritical: false,
    source: EDITORIAL,
  },
  {
    taskKey: 'cleaning-and-corrosion',
    title: 'Washing and corrosion protection',
    summary:
      'Salt, road grime and monsoon water attack fasteners and connectors. Regular washing followed by protection is the cheapest way to preserve resale value.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalMonths: 1,
    difficulty: 'diy_easy',
    steps: [
      'Rinse with low pressure — never aim a pressure washer at bearings, seals or the chain',
      'Use a pH-neutral motorcycle shampoo, not household detergent',
      'Dry thoroughly and re-lubricate the chain immediately after washing',
      'Apply a corrosion inhibitor to fasteners and unpainted metal',
      'Keep the brake discs and pads free of any wax or polish',
    ],
    toolsNeeded: ['Motorcycle shampoo', 'Soft brushes', 'Microfibre cloths', 'Corrosion inhibitor'],
    warningSigns: ['surface rust on fasteners', 'white corrosion on alloy', 'chain rusting shortly after washing'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: false,
    source: EDITORIAL,
  },
  {
    taskKey: 'gear-oil-change',
    title: 'Final drive gear oil change',
    summary:
      'Scooters and shaft-drive machines use a separate final drive oil that is easy to forget entirely, and expensive to ignore.',
    appliesTo: { types: ['scooter'], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 6000,
    intervalMonths: 12,
    difficulty: 'diy_moderate',
    steps: [
      'Warm the machine briefly so the oil flows freely',
      'Position a tray under the final drive and remove the drain plug',
      'Allow it to drain fully, then refit the plug with a new washer',
      'Refill through the filler with the specified grade and quantity',
      'Check for leaks after a short ride',
    ],
    toolsNeeded: ['Socket set', 'Gear oil', 'Drain tray', 'Syringe or funnel'],
    warningSigns: ['whining from the final drive', 'oil weeping around the casing', 'never changed since new'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: false,
    source: SERVICE,
  },
  {
    taskKey: 'tyre-rotation-wear-check',
    title: 'Tyre wear pattern diagnosis',
    summary:
      'The wear pattern tells you what is wrong elsewhere on the bike. Reading it early prevents both a handling problem and a wasted tyre.',
    appliesTo: { types: [], engineCcMin: 0, motorcycleSlugs: [] },
    intervalKm: 3000,
    difficulty: 'diy_easy',
    steps: [
      'Centre wear only usually means sustained motorway riding or over-inflation',
      'Edge wear with a flat centre usually means chronic under-inflation',
      'Cupped or scalloped wear points to suspension or bearing problems',
      'A flat spot indicates a heavy lock-up event',
      'Sawtooth wear across the blocks suggests alignment or damping issues',
    ],
    toolsNeeded: ['Tread depth gauge', 'Torch'],
    warningSigns: ['uneven wear across the width', 'cupping', 'visible flat spot'],
    relatedPartCategories: ['tyres'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'coolant-flush',
    title: 'Coolant flush and replacement',
    summary:
      'Coolant loses its corrosion inhibitors over time even when the level stays correct. Old coolant quietly attacks the water pump and radiator internals.',
    appliesTo: { types: [], engineCcMin: 125, motorcycleSlugs: [] },
    intervalKm: 24000,
    intervalMonths: 24,
    difficulty: 'workshop',
    steps: [
      'Work only on a completely cold engine — never open a hot system',
      'Drain from the radiator and the engine drain point',
      'Flush with distilled water until it runs clear',
      'Refill with the correct pre-mixed coolant for aluminium engines',
      'Bleed the system fully and re-check the level after a heat cycle',
    ],
    toolsNeeded: ['Correct coolant', 'Distilled water', 'Drain tray', 'Socket set'],
    warningSigns: ['coolant discoloured or rusty', 'sludge in the expansion tank', 'never changed since new'],
    relatedPartCategories: ['maintenance'],
    safetyCritical: true,
    source: SERVICE,
  },
  {
    taskKey: 'abs-sensor-check',
    title: 'ABS sensor and reluctor ring check',
    summary:
      'ABS sensors sit close to the wheel where they collect debris. A blocked sensor or damaged reluctor ring disables the system, usually with a dashboard warning.',
    appliesTo: { types: [], engineCcMin: 125, motorcycleSlugs: [] },
    intervalKm: 10000,
    intervalMonths: 12,
    difficulty: 'diy_moderate',
    steps: [
      'Check the ABS warning light extinguishes above walking pace as normal',
      'Inspect the sensor faces front and rear for packed grime or metal debris',
      'Check the reluctor ring teeth for damage or clogging',
      'Check the sensor leads are secured clear of the wheel and brake line',
      'Never modify or bypass an ABS system on a road-going motorcycle',
    ],
    toolsNeeded: ['Torch', 'Soft brush', 'Contact cleaner'],
    warningSigns: ['ABS warning light stays on', 'ABS activating on dry tarmac', 'light appears after wheel removal'],
    relatedPartCategories: ['brakes'],
    safetyCritical: true,
    source: SERVICE,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Additional hand-authored symptom rules
// ═══════════════════════════════════════════════════════════════════════════

const ADDITIONAL_SYMPTOM_RULES = [
  {
    symptomKey: 'hard-gear-shifting',
    title: 'Difficult or notchy gear changes',
    aliases: ['hard to shift', 'gear not shifting', 'notchy gearbox', 'cant find neutral', 'gear stuck', 'false neutral', 'difficult gear change'],
    likelyCauses: [
      { cause: 'Clutch not fully disengaging due to incorrect free play', priorConfidence: 0.75, diagnosticChecks: ['Measure clutch lever free play', 'Check whether the bike creeps in first gear with the clutch pulled in'], fixPartCategories: ['clutch_lever'], severity: 'medium' },
      { cause: 'Wrong or degraded engine oil affecting the wet clutch', priorConfidence: 0.6, diagnosticChecks: ['Confirm the oil is JASO MA or MA2 rated', 'Check when the oil was last changed'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Bent or badly adjusted gear lever linkage', priorConfidence: 0.5, diagnosticChecks: ['Inspect the shift linkage for damage', 'Check the lever height and free movement'], fixPartCategories: ['foot_peg'], severity: 'low' },
      { cause: 'Worn shift forks or selector drum', priorConfidence: 0.3, diagnosticChecks: ['Persistent false neutrals or jumping out of gear needs a gearbox inspection'], fixPartCategories: [], severity: 'critical' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'headlight-dim',
    title: 'Dim or flickering headlight',
    aliases: ['dim headlight', 'headlight flickering', 'lights dim at idle', 'weak headlight', 'light going dim'],
    likelyCauses: [
      { cause: 'Weak battery or failing charging system', priorConfidence: 0.75, diagnosticChecks: ['Measure battery voltage at idle and at 4000rpm', 'Voltage should rise to roughly 13.5-14.5V when revving'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Corroded earth connection at the frame', priorConfidence: 0.6, diagnosticChecks: ['Locate and clean the main earth point', 'Look for green corrosion at the terminal'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Aged halogen bulb losing output', priorConfidence: 0.5, diagnosticChecks: ['Check the reflector for a darkened or blackened bulb', 'Note how long since the bulb was replaced'], fixPartCategories: ['aux_light'], severity: 'low' },
      { cause: 'Overloaded circuit from added accessories', priorConfidence: 0.4, diagnosticChecks: ['Total the wattage of all added electrical accessories', 'Note whether the fault began after fitting them'], fixPartCategories: ['aux_light'], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'front-brake-pulsing',
    title: 'Pulsing or juddering front brake',
    aliases: ['brake pulsing', 'brake judder', 'brake vibration', 'lever pulsing', 'warped disc', 'shaking when braking'],
    likelyCauses: [
      { cause: 'Warped or unevenly worn brake disc', priorConfidence: 0.8, diagnosticChecks: ['Feel for a regular pulse through the lever under steady braking', 'Have disc runout measured with a dial gauge'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Uneven pad deposits transferred onto the disc', priorConfidence: 0.55, diagnosticChecks: ['Look for patchy discolouration on the disc face', 'Common after holding the brake hard at a standstill when hot'], fixPartCategories: ['brakes'], severity: 'medium' },
      { cause: 'Loose or worn wheel bearing', priorConfidence: 0.45, diagnosticChecks: ['Rock the wheel at the rim to feel for play', 'Spin and listen for rumble'], fixPartCategories: ['tyres'], severity: 'critical' },
      { cause: 'Loose brake disc mounting bolts', priorConfidence: 0.35, diagnosticChecks: ['Check the disc bolt torque against specification'], fixPartCategories: ['brakes'], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'excessive-oil-consumption',
    title: 'Engine using oil between services',
    aliases: ['using oil', 'oil consumption', 'oil level dropping', 'burning oil', 'losing engine oil'],
    likelyCauses: [
      { cause: 'Worn piston rings allowing oil past into the combustion chamber', priorConfidence: 0.65, diagnosticChecks: ['Look for blue smoke on the overrun', 'Have a compression and leak-down test performed'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Worn valve stem seals', priorConfidence: 0.55, diagnosticChecks: ['Blue smoke on start-up that clears is the classic sign'], fixPartCategories: [], severity: 'critical' },
      { cause: 'External leak being mistaken for consumption', priorConfidence: 0.5, diagnosticChecks: ['Clean the engine, ride, and re-inspect for wet areas', 'Check the drain bolt and filter seal'], fixPartCategories: ['oil_filter'], severity: 'medium' },
      { cause: 'Sustained high-rpm riding, which is normal consumption', priorConfidence: 0.35, diagnosticChecks: ['Compare consumption against the manual allowance', 'Some consumption is normal on high-performance engines'], fixPartCategories: ['maintenance'], severity: 'low' },
    ],
    escalateToMechanic: true,
    safetyCritical: false,
  },
  {
    symptomKey: 'engine-knocking',
    title: 'Knocking or pinking from the engine',
    aliases: ['knocking', 'pinking', 'pinging', 'engine knock', 'detonation', 'rattling under load'],
    likelyCauses: [
      { cause: 'Fuel octane rating below the engine requirement', priorConfidence: 0.7, diagnosticChecks: ['Check the octane requirement in the manual', 'Note whether it started after refuelling somewhere new'], fixPartCategories: [], severity: 'critical' },
      { cause: 'Carbon build-up raising the effective compression ratio', priorConfidence: 0.55, diagnosticChecks: ['Common on engines used mostly for short low-speed trips'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Running lean from an air leak or fuelling fault', priorConfidence: 0.5, diagnosticChecks: ['Inspect the intake boots for cracks', 'Check the spark plug for a white, bleached tip'], fixPartCategories: ['spark_plug'], severity: 'critical' },
      { cause: 'Excessive valve clearance causing top-end noise', priorConfidence: 0.4, diagnosticChecks: ['A regular tick that scales with engine speed suggests valve clearance, not detonation'], fixPartCategories: ['maintenance'], severity: 'medium' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'clutch-lever-heavy',
    title: 'Heavy or notchy clutch lever',
    aliases: ['heavy clutch', 'stiff clutch', 'clutch hard to pull', 'notchy clutch lever'],
    likelyCauses: [
      { cause: 'Dry or fraying clutch cable', priorConfidence: 0.75, diagnosticChecks: ['Detach and inspect the cable inner for fraying', 'Lubricate and re-test the action'], fixPartCategories: ['clutch_lever', 'maintenance'], severity: 'medium' },
      { cause: 'Poor cable routing with a tight bend', priorConfidence: 0.6, diagnosticChecks: ['Trace the cable route for kinks or sharp radii', 'Common after handlebar or riser changes'], fixPartCategories: ['handlebar'], severity: 'low' },
      { cause: 'Dry or worn lever pivot', priorConfidence: 0.5, diagnosticChecks: ['Remove, clean and grease the lever pivot pin'], fixPartCategories: ['clutch_lever'], severity: 'low' },
      { cause: 'Worn clutch actuator arm or pushrod', priorConfidence: 0.35, diagnosticChecks: ['Inspect the actuator arm angle at the engine case'], fixPartCategories: [], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'fuel-smell',
    title: 'Smell of fuel around the motorcycle',
    aliases: ['petrol smell', 'fuel smell', 'smells of petrol', 'fuel leak', 'gasoline smell'],
    likelyCauses: [
      { cause: 'Fuel line or fuel tap seepage', priorConfidence: 0.7, diagnosticChecks: ['Inspect all fuel lines and clamps for damp patches', 'Any fuel leak is a fire risk — stop riding'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Blocked or misrouted tank breather hose', priorConfidence: 0.55, diagnosticChecks: ['Check the breather is clear and correctly routed', 'Common after washing or laying the bike over'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Overfilled tank venting through the breather', priorConfidence: 0.45, diagnosticChecks: ['Note whether it only happens after brimming the tank'], fixPartCategories: [], severity: 'low' },
      { cause: 'Perished tank cap seal', priorConfidence: 0.4, diagnosticChecks: ['Inspect the filler cap rubber for cracking or hardening'], fixPartCategories: ['maintenance'], severity: 'medium' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'speedometer-not-working',
    title: 'Speedometer or odometer not working',
    aliases: ['speedometer not working', 'speedo not working', 'odometer stopped', 'speed reading wrong', 'no speed reading'],
    likelyCauses: [
      { cause: 'Failed or disconnected speed sensor', priorConfidence: 0.7, diagnosticChecks: ['Check the sensor connector at the front wheel or gearbox', 'Note whether it stopped after wheel removal'], fixPartCategories: ['maintenance'], severity: 'low' },
      { cause: 'Broken speedometer drive cable on older models', priorConfidence: 0.6, diagnosticChecks: ['Detach the cable and check the inner spins with the wheel'], fixPartCategories: ['maintenance'], severity: 'low' },
      { cause: 'Sprocket or wheel size change altering the calibration', priorConfidence: 0.4, diagnosticChecks: ['Note whether gearing or tyre size was recently changed'], fixPartCategories: ['sprocket'], severity: 'low' },
      { cause: 'Instrument cluster or wiring fault', priorConfidence: 0.3, diagnosticChecks: ['Check the cluster fuse and connector'], fixPartCategories: [], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'exhaust-popping',
    title: 'Popping or backfiring from the exhaust',
    aliases: ['exhaust popping', 'backfire', 'popping on deceleration', 'crackling exhaust', 'banging exhaust'],
    likelyCauses: [
      { cause: 'Air leak at the header joint or exhaust gasket', priorConfidence: 0.7, diagnosticChecks: ['Inspect the header joint for sooty streaks', 'Very common after fitting an aftermarket exhaust'], fixPartCategories: ['exhaust'], severity: 'medium' },
      { cause: 'Lean fuelling after an exhaust or filter change without remapping', priorConfidence: 0.65, diagnosticChecks: ['Note whether it began after fitting a slip-on or performance filter', 'Check the plug for a bleached tip'], fixPartCategories: ['exhaust', 'air_filter'], severity: 'medium' },
      { cause: 'Secondary air injection system operating as designed', priorConfidence: 0.4, diagnosticChecks: ['Mild popping on a closed throttle can be normal on emissions-equipped machines'], fixPartCategories: [], severity: 'low' },
      { cause: 'Ignition fault causing incomplete combustion', priorConfidence: 0.35, diagnosticChecks: ['Inspect the plug, cap and lead', 'Check for a misfire under load'], fixPartCategories: ['spark_plug'], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'bike-pulls-to-one-side',
    title: 'Motorcycle pulls to one side',
    aliases: ['pulls to one side', 'pulling left', 'pulling right', 'not tracking straight', 'veering', 'bike drifts'],
    likelyCauses: [
      { cause: 'Rear wheel misalignment after a chain adjustment', priorConfidence: 0.75, diagnosticChecks: ['Check the adjuster marks match on both sides', 'Measure from the swingarm pivot to the axle on each side'], fixPartCategories: ['chain'], severity: 'critical' },
      { cause: 'Unequal tyre pressures front to rear', priorConfidence: 0.6, diagnosticChecks: ['Check both pressures cold against the placard'], fixPartCategories: ['tyres'], severity: 'medium' },
      { cause: 'Dragging brake caliper on one side', priorConfidence: 0.5, diagnosticChecks: ['Check both wheels spin freely', 'Feel each disc for heat after a gentle ride'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Bent forks or frame damage from a previous impact', priorConfidence: 0.3, diagnosticChecks: ['Have the frame and forks checked professionally if the bike has been dropped'], fixPartCategories: [], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'excessive-chain-slack',
    title: 'Chain slack keeps returning',
    aliases: ['chain keeps loosening', 'chain slack returns', 'chain stretching', 'adjusting chain often'],
    likelyCauses: [
      { cause: 'Chain worn beyond its service limit and stretching rapidly', priorConfidence: 0.8, diagnosticChecks: ['Try to lift the chain off the rear sprocket', 'Measure the length over 20 links against the manual limit'], fixPartCategories: ['chain', 'sprocket'], severity: 'critical' },
      { cause: 'Worn sprockets accelerating chain wear', priorConfidence: 0.65, diagnosticChecks: ['Inspect the tooth profile for hooking'], fixPartCategories: ['sprocket'], severity: 'critical' },
      { cause: 'Inadequate lubrication', priorConfidence: 0.55, diagnosticChecks: ['Check for dry or rusty links', 'Review how often the chain is lubricated'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Axle nut not torqued, allowing the adjusters to move', priorConfidence: 0.4, diagnosticChecks: ['Check the axle nut torque against specification'], fixPartCategories: ['chain'], severity: 'critical' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'engine-cutting-out',
    title: 'Engine cuts out while riding',
    aliases: ['cuts out', 'engine dies', 'stops while riding', 'shuts off', 'loses power suddenly', 'engine cutting'],
    likelyCauses: [
      { cause: 'Intermittent connector or damaged wiring in the loom', priorConfidence: 0.65, diagnosticChecks: ['Inspect the loom at the steering head where it flexes', 'Note whether it happens over bumps'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Side stand or clutch safety switch failing intermittently', priorConfidence: 0.6, diagnosticChecks: ['Note whether it cuts out only when turning or over bumps', 'Inspect the side stand switch and its lead'], fixPartCategories: [], severity: 'critical' },
      { cause: 'Fuel starvation from a blocked filter or failing pump', priorConfidence: 0.55, diagnosticChecks: ['Listen for the fuel pump priming on ignition', 'Note whether it happens as the tank empties'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Failing ignition coil or stator breaking down when hot', priorConfidence: 0.4, diagnosticChecks: ['Note whether it only occurs once the engine is fully warm'], fixPartCategories: [], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'suspension-bottoming',
    title: 'Suspension bottoming out',
    aliases: ['bottoming out', 'suspension too soft', 'hitting the bump stop', 'rear bottoming', 'clunking over bumps'],
    likelyCauses: [
      { cause: 'Preload set too soft for the rider or load being carried', priorConfidence: 0.75, diagnosticChecks: ['Measure static and rider sag', 'Note whether it only happens two-up or loaded'], fixPartCategories: [], severity: 'medium' },
      { cause: 'Worn or leaking shock absorber', priorConfidence: 0.6, diagnosticChecks: ['Look for oil on the shock body', 'Push down on the rear and check it does not oscillate'], fixPartCategories: [], severity: 'critical' },
      { cause: 'Low or degraded fork oil', priorConfidence: 0.5, diagnosticChecks: ['Check the forks for oil films', 'Note when the fork oil was last changed'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Spring rate too soft for the rider weight', priorConfidence: 0.4, diagnosticChecks: ['Compare your kerb weight against the standard spring rating'], fixPartCategories: [], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'starting-difficulty-cold',
    title: 'Hard starting when cold',
    aliases: ['hard to start cold', 'wont start when cold', 'difficult cold start', 'takes long to start in morning'],
    likelyCauses: [
      { cause: 'Worn spark plug with an excessive electrode gap', priorConfidence: 0.7, diagnosticChecks: ['Inspect and gap the plug against specification', 'Check the service interval'], fixPartCategories: ['spark_plug'], severity: 'low' },
      { cause: 'Weak battery giving insufficient cranking speed when cold', priorConfidence: 0.65, diagnosticChecks: ['Measure resting voltage', 'Note whether the starter sounds slow'], fixPartCategories: ['maintenance'], severity: 'low' },
      { cause: 'Valve clearances too tight, reducing compression when cold', priorConfidence: 0.5, diagnosticChecks: ['Check when the valve clearances were last inspected'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Stale fuel after standing for weeks', priorConfidence: 0.45, diagnosticChecks: ['Note how long the bike stood with fuel in the tank'], fixPartCategories: ['maintenance'], severity: 'low' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'excessive-heat-to-rider',
    title: 'Excessive engine heat reaching the rider',
    aliases: ['engine too hot on legs', 'heat on legs', 'burning my leg', 'too much heat', 'roasting in traffic'],
    likelyCauses: [
      { cause: 'Normal characteristic of the machine in slow traffic', priorConfidence: 0.6, diagnosticChecks: ['Note whether it only happens in stop-start traffic', 'Common on large single-cylinder and V-twin engines'], fixPartCategories: [], severity: 'low' },
      { cause: 'Missing or damaged heat shield', priorConfidence: 0.55, diagnosticChecks: ['Check the exhaust and frame heat shields are present and secure'], fixPartCategories: ['exhaust'], severity: 'medium' },
      { cause: 'Cooling system not operating correctly', priorConfidence: 0.5, diagnosticChecks: ['Check the coolant level cold', 'Confirm the fan cuts in'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Lean fuelling after an exhaust change raising running temperature', priorConfidence: 0.35, diagnosticChecks: ['Note whether it began after fitting an aftermarket exhaust'], fixPartCategories: ['exhaust'], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'brake-lever-soft',
    title: 'Brake lever feels soft or comes to the bar',
    aliases: ['spongy lever', 'soft brake lever', 'lever comes to bar', 'brake lever soft', 'no brake pressure'],
    likelyCauses: [
      { cause: 'Air in the brake hydraulic system', priorConfidence: 0.8, diagnosticChecks: ['Pump the lever — if it firms up progressively there is air present', 'Check the reservoir level and fluid colour'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Moisture-contaminated brake fluid boiling under use', priorConfidence: 0.65, diagnosticChecks: ['Check the fluid colour; dark fluid is overdue', 'Note whether it worsens after heavy braking'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Master cylinder seal failure', priorConfidence: 0.5, diagnosticChecks: ['Hold pressure on the lever and see whether it creeps toward the bar'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Swelling rubber brake hoses absorbing lever travel', priorConfidence: 0.4, diagnosticChecks: ['Look for bulging hoses under pressure', 'Consider braided lines on older machines'], fixPartCategories: ['brakes'], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'indicator-fast-blinking',
    title: 'Indicators blinking too fast',
    aliases: ['indicator blinking fast', 'hyper flash', 'fast blinking', 'turn signal fast', 'indicators too quick'],
    likelyCauses: [
      { cause: 'LED indicators fitted without load resistors or an LED relay', priorConfidence: 0.85, diagnosticChecks: ['Note whether it began after fitting LED indicators', 'Check whether an LED-compatible flasher relay is fitted'], fixPartCategories: ['aux_light'], severity: 'low' },
      { cause: 'Blown bulb on the affected side', priorConfidence: 0.65, diagnosticChecks: ['Check both bulbs on the fast-blinking side'], fixPartCategories: ['aux_light'], severity: 'medium' },
      { cause: 'Poor earth connection at an indicator', priorConfidence: 0.45, diagnosticChecks: ['Clean the indicator earth points'], fixPartCategories: ['maintenance'], severity: 'low' },
      { cause: 'Failing flasher relay', priorConfidence: 0.3, diagnosticChecks: ['Swap in a known-good relay to confirm'], fixPartCategories: ['aux_light'], severity: 'low' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'tyre-losing-pressure',
    title: 'Tyre keeps losing pressure',
    aliases: ['tyre losing air', 'pressure dropping', 'slow puncture', 'flat tyre repeatedly', 'tyre goes flat'],
    likelyCauses: [
      { cause: 'Slow puncture from an embedded object', priorConfidence: 0.8, diagnosticChecks: ['Inspect the whole tread carefully for nails or glass', 'Spray soapy water and look for bubbles'], fixPartCategories: ['tyres'], severity: 'critical' },
      { cause: 'Leaking valve stem or valve core', priorConfidence: 0.6, diagnosticChecks: ['Put soapy water over the valve and watch for bubbles', 'Try tightening the valve core'], fixPartCategories: ['tyres'], severity: 'medium' },
      { cause: 'Corroded or damaged rim bead seat on tubeless wheels', priorConfidence: 0.45, diagnosticChecks: ['Inspect the rim edge for corrosion or kerb damage'], fixPartCategories: ['tyres'], severity: 'critical' },
      { cause: 'Sidewall damage, which is never repairable', priorConfidence: 0.3, diagnosticChecks: ['Inspect both sidewalls for cuts or bulges — replace the tyre if found'], fixPartCategories: ['tyres'], severity: 'critical' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'engine-vibration-excessive',
    title: 'Excessive engine vibration',
    aliases: ['engine vibration', 'buzzing through bars', 'numb hands', 'vibrating footpegs', 'rough running'],
    likelyCauses: [
      { cause: 'Loose or perished engine mounting rubbers', priorConfidence: 0.65, diagnosticChecks: ['Check the engine mount bolt torque', 'Inspect the rubber isolators for cracking'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Chain adjusted too tight, loading the drivetrain', priorConfidence: 0.6, diagnosticChecks: ['Measure chain slack at the tightest point'], fixPartCategories: ['chain'], severity: 'critical' },
      { cause: 'Missing bar-end weights after a mirror or grip change', priorConfidence: 0.5, diagnosticChecks: ['Check whether the bar-end weights are still fitted'], fixPartCategories: ['handlebar', 'grips'], severity: 'low' },
      { cause: 'Ignition or fuelling fault causing uneven running', priorConfidence: 0.4, diagnosticChecks: ['Inspect the spark plug', 'Note whether it is worse at specific engine speeds'], fixPartCategories: ['spark_plug'], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'seat-discomfort',
    title: 'Numbness or pain on longer rides',
    aliases: ['sore backside', 'numb bum', 'seat uncomfortable', 'back pain riding', 'wrist pain', 'monkey butt'],
    likelyCauses: [
      { cause: 'Stock seat foam too soft or wrongly shaped for you', priorConfidence: 0.7, diagnosticChecks: ['Note how long before discomfort begins', 'Foam density matters more than thickness'], fixPartCategories: ['seat'], severity: 'low' },
      { cause: 'Riding position putting weight through the wrists', priorConfidence: 0.6, diagnosticChecks: ['Check whether your wrists ache more than your seat', 'Consider bar risers or a taller handlebar'], fixPartCategories: ['handlebar'], severity: 'low' },
      { cause: 'Suspension preload set wrong for your weight', priorConfidence: 0.5, diagnosticChecks: ['Measure rider sag and adjust preload'], fixPartCategories: [], severity: 'low' },
      { cause: 'Wind pressure on the chest causing fatigue', priorConfidence: 0.4, diagnosticChecks: ['Note whether it is worse at motorway speeds', 'A screen relieves chest and shoulder load'], fixPartCategories: ['windshield'], severity: 'low' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'blowing-fuses',
    title: 'Fuse blows repeatedly',
    aliases: ['fuse blowing', 'keeps blowing fuse', 'fuse blown again', 'blowing fuses'],
    likelyCauses: [
      { cause: 'Chafed wire shorting to the frame', priorConfidence: 0.75, diagnosticChecks: ['Inspect the loom where it passes the steering head and swingarm', 'Look for rubbed insulation'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Accessory drawing more current than the circuit rating', priorConfidence: 0.65, diagnosticChecks: ['Note whether it began after fitting an accessory', 'Total the added load against the fuse rating'], fixPartCategories: ['aux_light'], severity: 'critical' },
      { cause: 'Water ingress into a connector causing a short', priorConfidence: 0.5, diagnosticChecks: ['Note whether it happens after rain or washing', 'Inspect connectors for moisture and corrosion'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Wrong fuse rating fitted', priorConfidence: 0.35, diagnosticChecks: ['Confirm the rating matches the fuse box legend — never fit a higher rating'], fixPartCategories: ['maintenance'], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'white-smoke-startup',
    title: 'White vapour only on start-up',
    aliases: ['white smoke morning', 'vapour on startup', 'steam from exhaust', 'white smoke cold'],
    likelyCauses: [
      { cause: 'Normal condensation clearing as the exhaust warms', priorConfidence: 0.75, diagnosticChecks: ['Thin vapour that clears within a minute is normal, especially in cold weather'], fixPartCategories: [], severity: 'low' },
      { cause: 'Coolant entering the combustion chamber via the head gasket', priorConfidence: 0.5, diagnosticChecks: ['Check whether the coolant level is falling', 'A sweet smell with persistent smoke means stop riding'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Worn valve stem seals letting oil past overnight', priorConfidence: 0.4, diagnosticChecks: ['Bluish rather than white smoke suggests oil, not coolant'], fixPartCategories: [], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'chain-jumping-sprocket',
    title: 'Chain jumping or skipping on the sprocket',
    aliases: ['chain jumping', 'chain skipping', 'chain slipping teeth', 'chain came off'],
    likelyCauses: [
      { cause: 'Excessive chain slack allowing the chain to ride up the teeth', priorConfidence: 0.8, diagnosticChecks: ['Measure the slack at the tightest point immediately', 'Do not ride until corrected'], fixPartCategories: ['chain'], severity: 'critical' },
      { cause: 'Sprocket teeth worn to a hooked profile', priorConfidence: 0.7, diagnosticChecks: ['Inspect the tooth profile front and rear'], fixPartCategories: ['sprocket'], severity: 'critical' },
      { cause: 'Chain stretched past its service limit', priorConfidence: 0.65, diagnosticChecks: ['Try to pull the chain away from the rear sprocket'], fixPartCategories: ['chain', 'sprocket'], severity: 'critical' },
      { cause: 'Rear wheel misaligned so the chain runs off-plane', priorConfidence: 0.4, diagnosticChecks: ['Check the adjuster marks and sprocket alignment'], fixPartCategories: ['chain'], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'abs-light-on',
    title: 'ABS warning light stays on',
    aliases: ['abs light on', 'abs warning', 'abs not working', 'abs light staying on', 'abs fault'],
    likelyCauses: [
      { cause: 'Debris packed around a wheel-speed sensor', priorConfidence: 0.7, diagnosticChecks: ['Inspect and clean both sensor faces', 'Common after off-road or monsoon riding'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Sensor lead disturbed or damaged during wheel removal', priorConfidence: 0.6, diagnosticChecks: ['Note whether the light appeared after a tyre change', 'Check the sensor connector is seated'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Damaged reluctor ring teeth', priorConfidence: 0.5, diagnosticChecks: ['Inspect the ring for bent or missing teeth'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Low battery voltage triggering a spurious fault', priorConfidence: 0.35, diagnosticChecks: ['Check battery voltage and charging output'], fixPartCategories: ['maintenance'], severity: 'medium' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'poor-throttle-response',
    title: 'Sluggish or snatchy throttle response',
    aliases: ['throttle response poor', 'snatchy throttle', 'sluggish acceleration', 'jerky throttle', 'slow pickup', 'lag'],
    likelyCauses: [
      { cause: 'Clogged air filter restricting intake flow', priorConfidence: 0.7, diagnosticChecks: ['Hold the filter up to a light', 'Check the service interval'], fixPartCategories: ['air_filter'], severity: 'low' },
      { cause: 'Dirty throttle body or injector needing a clean', priorConfidence: 0.6, diagnosticChecks: ['Note whether the problem built up gradually', 'Check when the fuel system was last serviced'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Excessive throttle cable free play', priorConfidence: 0.55, diagnosticChecks: ['Measure free play at the grip against specification'], fixPartCategories: ['grips'], severity: 'medium' },
      { cause: 'Worn spark plug causing an incomplete burn', priorConfidence: 0.45, diagnosticChecks: ['Inspect the plug tip and gap'], fixPartCategories: ['spark_plug'], severity: 'low' },
      { cause: 'Dragging brake or over-tight chain adding drag', priorConfidence: 0.35, diagnosticChecks: ['Check both wheels spin freely', 'Check chain slack'], fixPartCategories: ['brakes', 'chain'], severity: 'medium' },
    ],
    escalateToMechanic: false,
    safetyCritical: false,
  },
  {
    symptomKey: 'mirror-vibration',
    title: 'Mirrors vibrate too much to see clearly',
    aliases: ['mirrors blurry', 'mirror vibration', 'cant see in mirrors', 'shaky mirrors'],
    likelyCauses: [
      { cause: 'Mirror stem or ball joint not tightened correctly', priorConfidence: 0.7, diagnosticChecks: ['Check the stem locknut and pivot tension'], fixPartCategories: ['mirror'], severity: 'medium' },
      { cause: 'Missing bar-end weights allowing handlebar resonance', priorConfidence: 0.6, diagnosticChecks: ['Check whether bar-end weights are fitted', 'Bar-end mirrors need the correct adaptor'], fixPartCategories: ['handlebar', 'mirror'], severity: 'low' },
      { cause: 'Engine mount or exhaust bracket loose', priorConfidence: 0.45, diagnosticChecks: ['Check engine mount and exhaust hanger torque'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Worn or damaged tyre causing a vibration at speed', priorConfidence: 0.35, diagnosticChecks: ['Note whether it only occurs at certain speeds', 'Inspect tyres for cupping or flat spots'], fixPartCategories: ['tyres'], severity: 'critical' },
    ],
    escalateToMechanic: false,
    safetyCritical: true,
  },
  {
    symptomKey: 'battery-not-charging',
    title: 'Battery not charging while riding',
    aliases: ['not charging', 'battery not charging', 'charging system fault', 'alternator problem', 'stator fault'],
    likelyCauses: [
      { cause: 'Failing regulator/rectifier — the most common charging fault', priorConfidence: 0.75, diagnosticChecks: ['Measure battery voltage at 4000rpm; expect roughly 13.5-14.5V', 'Check the regulator connector for heat damage'], fixPartCategories: ['maintenance'], severity: 'critical' },
      { cause: 'Failed stator winding', priorConfidence: 0.55, diagnosticChecks: ['Have the stator AC output and resistance tested'], fixPartCategories: [], severity: 'critical' },
      { cause: 'Corroded or loose battery and earth connections', priorConfidence: 0.5, diagnosticChecks: ['Clean and retighten all main power connections'], fixPartCategories: ['maintenance'], severity: 'medium' },
      { cause: 'Battery at end of life and unable to hold charge', priorConfidence: 0.45, diagnosticChecks: ['Have the battery load-tested', 'Check its age'], fixPartCategories: ['maintenance'], severity: 'medium' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
  {
    symptomKey: 'grinding-noise-wheel',
    title: 'Grinding or rumbling from a wheel',
    aliases: ['wheel grinding', 'rumbling from wheel', 'noise from front wheel', 'noise from rear wheel', 'humming from wheel'],
    likelyCauses: [
      { cause: 'Failed wheel bearing', priorConfidence: 0.75, diagnosticChecks: ['Raise the wheel and spin it, listening for rumble', 'Rock the wheel at the rim for lateral play'], fixPartCategories: ['tyres'], severity: 'critical' },
      { cause: 'Brake pads worn through to the backing plate', priorConfidence: 0.7, diagnosticChecks: ['Inspect the remaining pad material immediately', 'A metallic grinding noise means stop riding'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'Debris trapped between the pad and disc', priorConfidence: 0.5, diagnosticChecks: ['Inspect the caliper and disc for trapped stones or grit'], fixPartCategories: ['brakes'], severity: 'critical' },
      { cause: 'ABS reluctor ring contacting the sensor', priorConfidence: 0.3, diagnosticChecks: ['Check the sensor clearance and ring alignment'], fixPartCategories: ['brakes'], severity: 'critical' },
    ],
    escalateToMechanic: true,
    safetyCritical: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Type specialisations (DERIVED — always tagged with derivedFrom)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Machine-type profiles. `intervalFactor` scales the base service interval, and
 * `note` is appended to the summary so the derived document says something the
 * base one does not.
 */
const TYPE_PROFILES = [
  {
    type: 'scooter',
    label: 'Scooter',
    intervalFactor: 0.7,
    note: 'On automatic scooters the CVT and final drive need separate attention, and the smaller wheels make tyre condition especially important.',
    ccMin: 0,
    ccMax: 200,
  },
  {
    type: 'commuter',
    label: 'Commuter',
    intervalFactor: 0.85,
    note: 'Commuter machines cover high mileage in traffic, so heat soak and chain wear accumulate faster than the headline interval suggests.',
    ccMin: 0,
    ccMax: 200,
  },
  {
    type: 'sport',
    label: 'Sport',
    intervalFactor: 0.8,
    note: 'Sport machines run higher engine speeds and load the brakes and tyres harder, so inspect more often than the standard interval.',
    ccMin: 150,
    ccMax: 99999,
  },
  {
    type: 'cruiser',
    label: 'Cruiser',
    intervalFactor: 1.1,
    note: 'Cruisers run lower engine speeds and carry more weight, so component life is usually longer but loaded braking distances are greater.',
    ccMin: 200,
    ccMax: 99999,
  },
  {
    type: 'adventure',
    label: 'Adventure',
    intervalFactor: 0.6,
    note: 'Adventure machines see dust, water crossings and gravel, so filters, bearings and chain lubrication need far more frequent attention.',
    ccMin: 200,
    ccMax: 99999,
  },
  {
    type: 'offroad',
    label: 'Off-road',
    intervalFactor: 0.4,
    note: 'Off-road use is the harshest duty cycle there is. Treat every published interval as an upper limit and inspect after each hard ride.',
    ccMin: 0,
    ccMax: 99999,
  },
];

/** Base tasks worth specialising — those whose interval genuinely varies by use. */
const SPECIALISE_TASK_KEYS = [
  'engine-oil-change',
  'chain-clean-lube',
  'chain-slack-adjust',
  'brake-pad-inspection',
  'air-filter-service',
  'tyre-pressure-check',
  'spark-plug-service',
  'cable-lever-lubrication',
  'sprocket-inspection',
  'suspension-check',
  'coolant-check',
  'battery-care',
  'radiator-clean',
  'nut-bolt-torque-check',
  'brake-caliper-service',
  'wheel-bearing-check',
  'tyre-rotation-wear-check',
  'swingarm-linkage-grease',
];

/** Base symptoms whose differential genuinely shifts with machine type. */
const SPECIALISE_SYMPTOM_KEYS = [
  'overheating',
  'chain-noise',
  'poor-fuel-economy',
  'vibration',
  'brake-noise',
  'rough-idle',
  'wont-start',
  'clutch-slipping',
  'excessive-chain-slack',
  'poor-throttle-response',
  'suspension-bottoming',
  'electrical-fault',
];

function scaleInterval(value, factor) {
  if (!value) return undefined;
  const scaled = Math.round((value * factor) / 100) * 100;
  return scaled > 0 ? scaled : Math.round(value * factor);
}

/**
 * Derives type-scoped maintenance variants. Each variant differs from its base
 * in applicability, interval and guidance, and records `derivedFrom`.
 */
function specialiseMaintenance(baseTasks) {
  const byKey = new Map(baseTasks.map((t) => [t.taskKey, t]));
  const derived = [];

  for (const key of SPECIALISE_TASK_KEYS) {
    const base = byKey.get(key);
    if (!base) continue;

    for (const profile of TYPE_PROFILES) {
      // Skip combinations where the base task cannot apply to the machine type.
      if (base.appliesTo.types.length > 0 && !base.appliesTo.types.includes(profile.type)) continue;
      if (base.appliesTo.engineCcMin && base.appliesTo.engineCcMin > profile.ccMax) continue;

      derived.push({
        ...base,
        taskKey: `${key}-${profile.type}`,
        title: `${base.title} — ${profile.label}`,
        summary: `${base.summary} ${profile.note}`,
        appliesTo: {
          types: [profile.type],
          engineCcMin: Math.max(base.appliesTo.engineCcMin || 0, profile.ccMin) || undefined,
          engineCcMax: Math.min(base.appliesTo.engineCcMax || 99999, profile.ccMax),
          motorcycleSlugs: [],
        },
        intervalKm: scaleInterval(base.intervalKm, profile.intervalFactor),
        intervalMonths: base.intervalMonths,
        derivedFrom: key,
        source: base.source,
      });
    }
  }

  return derived;
}

/** Derives type-scoped symptom variants, re-weighting the differential. */
function specialiseSymptoms(baseRules) {
  const byKey = new Map(baseRules.map((r) => [r.symptomKey, r]));
  const derived = [];

  for (const key of SPECIALISE_SYMPTOM_KEYS) {
    const base = byKey.get(key);
    if (!base) continue;

    for (const profile of TYPE_PROFILES) {
      if (base.appliesTo && base.appliesTo.types && base.appliesTo.types.length > 0) {
        if (!base.appliesTo.types.includes(profile.type)) continue;
      }

      // Harder duty cycles raise the prior on wear-related causes, which is a
      // real difference in the differential rather than a cosmetic one.
      const wearBias = profile.intervalFactor < 0.8 ? 0.1 : profile.intervalFactor > 1 ? -0.05 : 0;

      derived.push({
        ...base,
        symptomKey: `${key}-${profile.type}`,
        title: `${base.title} — ${profile.label}`,
        aliases: base.aliases,
        appliesTo: {
          types: [profile.type],
          engineCcMin: profile.ccMin || undefined,
          engineCcMax: profile.ccMax,
          motorcycleSlugs: [],
        },
        likelyCauses: base.likelyCauses.map((c) => ({
          ...c,
          priorConfidence: Math.max(0.05, Math.min(0.95, +(c.priorConfidence + wearBias).toFixed(2))),
        })),
        derivedFrom: key,
        source: base.source,
      });
    }
  }

  return derived;
}

/** Full knowledge set: curated base documents plus derived specialisations. */
function buildKnowledge() {
  const baseMaintenance = [...MAINTENANCE_TASKS, ...ADDITIONAL_MAINTENANCE_TASKS];

  const baseSymptoms = [...SYMPTOM_RULES, ...ADDITIONAL_SYMPTOM_RULES].map((r) => ({
    appliesTo: { types: [], motorcycleSlugs: [] },
    source: SERVICE,
    ...r,
    // Data invariant: a safety-critical symptom must always carry the mechanic
    // escalation flag. The retrieval layer already treats the two as equivalent
    // (`escalate = escalateToMechanic || safetyCritical`); normalising here keeps
    // the stored documents consistent with how they are consumed, so the flag
    // cannot drift out of sync as new rules are authored.
    escalateToMechanic: r.escalateToMechanic || !!r.safetyCritical,
  }));

  const derivedMaintenance = specialiseMaintenance(baseMaintenance);
  const derivedSymptoms = specialiseSymptoms(baseSymptoms);

  return {
    maintenance: [...baseMaintenance, ...derivedMaintenance],
    symptoms: [...baseSymptoms, ...derivedSymptoms],
    glossary: PART_GLOSSARY,
    counts: {
      maintenanceBase: baseMaintenance.length,
      maintenanceDerived: derivedMaintenance.length,
      symptomsBase: baseSymptoms.length,
      symptomsDerived: derivedSymptoms.length,
      glossary: PART_GLOSSARY.length,
    },
  };
}

module.exports = {
  ADDITIONAL_MAINTENANCE_TASKS,
  ADDITIONAL_SYMPTOM_RULES,
  TYPE_PROFILES,
  specialiseMaintenance,
  specialiseSymptoms,
  buildKnowledge,
};
