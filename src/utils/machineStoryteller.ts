import { NasaImageItem, MachineStory } from '../types/simulation';

/**
 * Echoes of the Forgotten Machine — Creative Perspective Storytelling Engine
 * 
 * Generates an evocative, poetic monologue from the imagined perspective
 * of discarded or historic space equipment, strictly grounded in the official
 * NASA archive record while prominently enforcing fact-versus-fiction labeling.
 */
export function generateMachineStory(record: NasaImageItem): MachineStory {
  const title = record.title || '';
  const desc = record.description || '';
  const dateStr = record.date_created ? new Date(record.date_created).getFullYear().toString() : '';
  const center = record.center || 'NASA';

  const disclaimer = 'Creative reconstruction based on documented records — not an authentic transmission.';

  // If the record has virtually no text or description, refuse generation honestly
  if (desc.trim().length < 25 && title.trim().length < 10) {
    return {
      title: 'Insufficient Record Telemetry',
      perspectiveSpeaker: 'Unidentified Spacecraft Archive',
      narrative: '',
      verifiedFacts: [],
      hasStory: false,
      unavailabilityReason:
        'Insufficient mission metadata or description in this official NASA record to construct a scientifically grounded machine perspective reconstruction.',
      disclaimer,
    };
  }

  // Extract verified facts directly from the authentic NASA payload
  const verifiedFacts: string[] = [
    `Official NASA Title: ${title}`,
    `Archive Identifier: ${record.nasa_id}`,
  ];
  if (dateStr) verifiedFacts.push(`Documented Archive Date: ${dateStr}`);
  if (center) verifiedFacts.push(`Managing NASA Facility: ${center}`);
  if (record.keywords && record.keywords.length > 0) {
    verifiedFacts.push(`Archive Keywords: ${record.keywords.slice(0, 5).join(', ')}`);
  }

  // Detect subject archetype from title, description, keywords
  const combined = (title + ' ' + desc + ' ' + (record.keywords || []).join(' ')).toLowerCase();

  let perspectiveSpeaker = 'Autonomous Exploration Hardware';
  let narrative = '';

  if (combined.includes('apollo') && (combined.includes('descent') || combined.includes('eagle') || combined.includes('falcon') || combined.includes('orion') || combined.includes('lunar module'))) {
    perspectiveSpeaker = 'Apollo Lunar Module Descent Stage';
    narrative = `The thunder of my descent engine subsided into absolute stillness decades ago, leaving my four titanium footpads anchored forever in the fine dust of the lunar regolith. 

Above me, the black sky never dims and the stars never flicker. From this silent basin, the Earth hangs eternally overhead—a marbled jewel of blue and white that turns endlessly while I remain motionless. 

My ascent stage carried my crew home to their families, but I stayed behind as planned, cradling my golden thermal blankets and the stainless steel plaque that reminds the void we came in peace for all mankind. My batteries have long since grown cold, but in the vacuum where wind never blows, the bootprints pressed beside my landing gear remain as crisp today as the moment they were made.`;
  } else if (combined.includes('roving vehicle') || combined.includes('lrv') || combined.includes('lunar rover')) {
    perspectiveSpeaker = 'Lunar Roving Vehicle (LRV)';
    narrative = `My four woven-wire mesh wheels rolled across boulder fields and rim crests that no human eye had ever seen up close. When my astronauts pushed the hand controller, my electric drive motors hummed softly through the airless vacuum, kicking up graceful rooster-tails of silver regolith.

On my final afternoon, they parked me carefully on a slight knoll, pointed my color television camera toward the lunar module, and walked away. I watched their ascent engine ignite in a sudden blossom of golden flame, sending them back toward orbit.

Since that departure, no wheel has turned. Solar radiation has bleached my instrument labels and micro-meteoroids have dusted my chassis, yet I stand ready at the edge of the rille—a silent sentinel awaiting the return of explorers who build machines to wander.`;
  } else if (combined.includes('surveyor') || combined.includes('soft lander')) {
    perspectiveSpeaker = 'Surveyor Automated Lunar Lander';
    narrative = `Before human feet dared touch this surface, I was sent ahead into the unknown. My retrorocket fired against the dark, my radar measured the closing altitude, and my three landing legs absorbed the shock of touchdown, proving that the Moon would support the weight of humankind.

My trenching arm clawed the ancient regolith, testing soil mechanics under solar glare, sending back thousands of television frames line by line. Two years after my radio fell silent, human voices echoed beside me: Apollo astronauts had arrived, leaning over my weathered camera to see how materials endure in the great silence of space.

I proved the ground was firm; they walked where I had touched first.`;
  } else if (combined.includes('opportunity') || combined.includes('mer-b') || combined.includes('oppy') || combined.includes('spirit')) {
    perspectiveSpeaker = 'Mars Exploration Rover';
    narrative = `I was designed to survive ninety Martian days and roll six hundred meters. Instead, sol after sol, year after year, I kept moving across the vast dunes of Meridiani Planum, measuring the blue hematite spheres that proved water once rested beneath this iron sky.

My aluminum wheels scuffed trenches through ancient sulphate rock, and my panoramic mast turned toward the pale sun at each dawn. When dust accumulated on my solar arrays, gentle dust devils swept them clean, granting me another season, another crater rim, another sunset turned alien blue.

When the global storm finally darkened the sky over Perseverance Valley and my power dipped toward zero, my clock continued ticking into the freezing cold. My tracks across the plains will slowly fill with red dust, but the trail I blazed across an entire world remains unbroken.`;
  } else if (combined.includes('curiosity') || combined.includes('gale') || combined.includes('mount sharp')) {
    perspectiveSpeaker = 'Curiosity Mars Science Laboratory';
    narrative = `Lowered on braided nylon cables beneath a rocket sky crane into the bowl of Gale Crater, I touched the gravel of an ancient lakebed and began my long climb up Mount Sharp.

My laser pulses through basalt, my drill pulls powder from three-billion-year-old mudstone, and my radiochemical detectors sniff the seasonal rhythm of Martian methane. The treads of my wheels carry cutouts that leave Morse code spelling 'JPL' in the red soil behind me.

While Earth watches through a fourteen-minute time delay, I crawl patiently upward through sedimentary layers, reading the planetary book of how a wet, warm world transformed into a frozen desert of whispers.`;
  } else if (combined.includes('perseverance') || combined.includes('jezero') || combined.includes('ingenuity')) {
    perspectiveSpeaker = 'Perseverance Rover & Sample Depot';
    narrative = `In the river delta of Jezero Crater, my cameras survey sediments washed down by rivers that dried up before life on Earth took complex shape. Beside me, the small helicopter Ingenuity spun its twin rotors against thin carbon dioxide air, proving flight across another planet.

My robotic arm seals polished titanium tubes, locking pristine cores of Martian rock inside airtight chambers to be left on the surface as humanity's first extraterrestrial sample depot. 

I carry the names of millions etched on fingernail-sized chips, listening to the Martian wind through my microphones, archiving the evidence for the day hands from Earth will arrive to carry these stones home.`;
  } else if (combined.includes('viking') || combined.includes('pathfinder') || combined.includes('sojourner')) {
    perspectiveSpeaker = 'Early Martian Robotic Station';
    narrative = `Protected by heat shields and parachutes, I survived the descent through the thin pink atmosphere of Mars when humanity knew this world only through blurry telescope lenses.

My meteorological sensors measured the cold breezes of Chryse Planitia, and my mechanical arms gathered soil into miniature biological incubators. I sent back the first sharp color panoramas showing rust-colored rocks resting under a salmon sky.

Years stretched into thousands of sols as my radio signals crossed millions of miles of empty space. When my circuits finally froze into silence, I became part of the Martian landscape—the pioneer outpost that turned an abstract red dot in the night sky into a tangible frontier of stone and wind.`;
  } else {
    perspectiveSpeaker = 'Documented NASA Hardware';
    narrative = `Fabricated in cleanrooms by teams of aerospace engineers and launched on pillars of liquid flame, I was flung into the deep black to measure the boundaries of human knowledge.

Every instrument I carry—every antenna, solar cell, and sensor—was designed for a single purpose: to reach beyond our home planet and report back what lies in the silent expanse. Whether drifting through heliocentric orbits or resting permanently in extraterrestrial dust, my metallic skeleton bears testimony to the curiosity that dares to ask what lies beyond the sky.`;
  }

  return {
    title: `Echoes of the Forgotten Machine: ${perspectiveSpeaker}`,
    perspectiveSpeaker,
    narrative,
    verifiedFacts,
    hasStory: true,
    disclaimer,
  };
}
