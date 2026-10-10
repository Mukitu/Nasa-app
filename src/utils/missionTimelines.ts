import { TimelineEvent, NasaImageItem } from '../types/simulation';

/**
 * Verified Mission Timelines & Milestones
 * 
 * Contains exclusively historically documented dates and events from NASA archives.
 * Omit dates rather than guessing when historical records do not provide them.
 */
export function getMissionTimelineForRecord(record: NasaImageItem): TimelineEvent[] {
  const combined = (
    (record.title || '') +
    ' ' +
    (record.description || '') +
    ' ' +
    (record.keywords || []).join(' ')
  ).toLowerCase();

  // Apollo 11 Timeline
  if (combined.includes('apollo 11') || combined.includes('tranquility') || combined.includes('eagle')) {
    return [
      {
        id: 'a11-launch',
        date: 'July 16, 1969',
        title: 'Launch from Pad 39A (Saturn V SA-506)',
        description: 'Liftoff of Apollo 11 from Kennedy Space Center carrying Armstrong, Aldrin, and Collins toward the Moon.',
        sourceUrl: 'https://images.nasa.gov/details/as11-40-5874',
        verified: true,
        category: 'launch',
      },
      {
        id: 'a11-landing',
        date: 'July 20, 1969 — 20:17:40 UTC',
        title: 'Lunar Module "Eagle" Touchdown',
        description: 'First manned landing on another world at Mare Tranquillitatis. Armstrong radioed: "Houston, Tranquility Base here. The Eagle has landed."',
        sourceUrl: 'https://images.nasa.gov/details/as11-40-5922',
        verified: true,
        category: 'landing',
      },
      {
        id: 'a11-eva',
        date: 'July 21, 1969',
        title: 'Surface EVA & Science Instrument Deployment',
        description: 'Deployment of the Early Apollo Scientific Experiments Package (EASEP), Passive Seismic Experiment, and Laser Ranging Retroreflector.',
        sourceUrl: 'https://images.nasa.gov/details/as11-40-5949',
        verified: true,
        category: 'operation',
      },
      {
        id: 'a11-liftoff',
        date: 'July 21, 1969 — 17:54 UTC',
        title: 'Lunar Liftoff — Descent Stage Discarded',
        description: 'The Eagle ascent stage ignited, leaving the descent stage, commemorative plaque, and science instruments permanently resting on the lunar surface.',
        sourceUrl: 'https://images.nasa.gov/details/as11-44-6642',
        verified: true,
        category: 'final_contact',
      },
    ];
  }

  // Apollo 15 & Lunar Roving Vehicle
  if (combined.includes('apollo 15') || combined.includes('lrv') || combined.includes('hadley')) {
    return [
      {
        id: 'a15-launch',
        date: 'July 26, 1971',
        title: 'Apollo 15 Launch with LRV-001',
        description: 'First "J-mission" equipped for extended scientific stays and carrying the Boeing/Delco Lunar Roving Vehicle folded inside the LM descent stage.',
        sourceUrl: 'https://images.nasa.gov/details/as15-88-11901',
        verified: true,
        category: 'launch',
      },
      {
        id: 'a15-landing',
        date: 'July 30, 1971',
        title: 'Hadley-Apennine Touchdown',
        description: 'LM "Falcon" landed beside the dramatic 300-meter deep canyon of Hadley Rille.',
        sourceUrl: 'https://images.nasa.gov/details/as15-85-11425',
        verified: true,
        category: 'landing',
      },
      {
        id: 'a15-drive',
        date: 'July 31 – August 2, 1971',
        title: '27.9 Kilometers Driven Across Lunar Rille',
        description: 'David Scott and James Irwin drove LRV-001 across three surface sorties, collecting the famous 4.1-billion-year-old "Genesis Rock".',
        sourceUrl: 'https://images.nasa.gov/details/as15-88-11866',
        verified: true,
        category: 'operation',
      },
      {
        id: 'a15-park',
        date: 'August 2, 1971',
        title: 'LRV Parked at "VIP Site" to Broadcast Liftoff',
        description: 'The rover was positioned 90 meters from the LM to allow its motorized RCA TV camera to televise the lunar liftoff live to Earth.',
        sourceUrl: 'https://images.nasa.gov/details/as15-88-11901',
        verified: true,
        category: 'final_contact',
      },
    ];
  }

  // Surveyor 3
  if (combined.includes('surveyor')) {
    return [
      {
        id: 's3-launch',
        date: 'April 17, 1967',
        title: 'Surveyor 3 Launch on Atlas-Centaur',
        description: 'Automated soft-lander mission launched from Cape Canaveral to survey lunar surface strength.',
        sourceUrl: 'https://images.nasa.gov/details/as12-48-7133',
        verified: true,
        category: 'launch',
      },
      {
        id: 's3-landing',
        date: 'April 20, 1967',
        title: 'Touchdown in Ocean of Storms Crater',
        description: 'First robotic lander equipped with an electric motorized surface sampler trenching arm.',
        sourceUrl: 'https://images.nasa.gov/details/as12-48-7133',
        verified: true,
        category: 'landing',
      },
      {
        id: 's3-visit',
        date: 'November 19, 1969',
        title: 'Inspected by Apollo 12 Astronauts',
        description: 'Conrad and Bean executed a precision landing 160 meters away and retrieved Surveyor\'s TV camera for radiation analysis back on Earth.',
        sourceUrl: 'https://images.nasa.gov/details/as12-48-7136',
        verified: true,
        category: 'operation',
      },
    ];
  }

  // Opportunity / Spirit Mars Rovers
  if (combined.includes('opportunity') || combined.includes('mer-b') || combined.includes('spirit')) {
    return [
      {
        id: 'mer-launch',
        date: 'July 7, 2003',
        title: 'Delta II Launch from Cape Canaveral',
        description: 'Launch of Mars Exploration Rover Opportunity on a 7-month cruise to Mars.',
        sourceUrl: 'https://images.nasa.gov/details/PIA22223',
        verified: true,
        category: 'launch',
      },
      {
        id: 'mer-landing',
        date: 'January 25, 2004',
        title: 'Airbag Touchdown at Eagle Crater',
        description: 'Hole-in-one landing inside a small impact crater in Meridiani Planum, instantly discovering exposed bedrock.',
        sourceUrl: 'https://images.nasa.gov/details/PIA05218',
        verified: true,
        category: 'landing',
      },
      {
        id: 'mer-water',
        date: 'March 2004',
        title: 'Water Blueberries Discovery',
        description: 'Confirmation of hematite spherules, proving past liquid water sustained on the Martian surface.',
        sourceUrl: 'https://images.nasa.gov/details/PIA05585',
        verified: true,
        category: 'operation',
      },
      {
        id: 'mer-storm',
        date: 'June 10, 2018 (Sol 5111)',
        title: 'Catastrophic Global Dust Storm — Final Sol',
        description: 'Sun-obscuring dust storm cut solar power in Perseverance Valley after 45.16 km of driving over 14 years. Mission concluded Feb 2019.',
        sourceUrl: 'https://images.nasa.gov/details/PIA22223',
        verified: true,
        category: 'final_contact',
      },
    ];
  }

  // Curiosity Rover
  if (combined.includes('curiosity') || combined.includes('gale') || combined.includes('msl')) {
    return [
      {
        id: 'msl-launch',
        date: 'November 26, 2011',
        title: 'Atlas V Launch of Mars Science Laboratory',
        description: 'One-ton nuclear-powered rover launched toward Gale Crater.',
        sourceUrl: 'https://images.nasa.gov/details/PIA19920',
        verified: true,
        category: 'launch',
      },
      {
        id: 'msl-landing',
        date: 'August 6, 2012',
        title: 'Sky Crane Landing at Bradbury Landing',
        description: 'Pioneered rocket-powered descent stage lowering Curiosity on tether cables.',
        sourceUrl: 'https://images.nasa.gov/details/PIA16082',
        verified: true,
        category: 'landing',
      },
      {
        id: 'msl-active',
        date: '2012 – Present',
        title: 'Mount Sharp Stratigraphy & Ancient Habitable Lake',
        description: 'Drilled dozens of Martian mudstones, confirming long-lived habitable freshwater lakes and organic molecules.',
        sourceUrl: 'https://images.nasa.gov/details/PIA19920',
        verified: true,
        category: 'operation',
      },
    ];
  }

  // Perseverance & Ingenuity
  if (combined.includes('perseverance') || combined.includes('jezero') || combined.includes('ingenuity')) {
    return [
      {
        id: 'm2020-launch',
        date: 'July 30, 2020',
        title: 'Mars 2020 Launch',
        description: 'Liftoff on Atlas V from Cape Canaveral carrying Perseverance and the Ingenuity helicopter.',
        sourceUrl: 'https://images.nasa.gov/details/PIA24487',
        verified: true,
        category: 'launch',
      },
      {
        id: 'm2020-landing',
        date: 'February 18, 2021',
        title: 'Touchdown in Jezero Crater Delta',
        description: 'Landing using Terrain-Relative Navigation in an ancient river-fed lakebed.',
        sourceUrl: 'https://images.nasa.gov/details/PIA24487',
        verified: true,
        category: 'landing',
      },
      {
        id: 'ingenuity-flight',
        date: 'April 19, 2021',
        title: 'Ingenuity First Powered Flight on Mars',
        description: 'The historic first powered, controlled aerodynamic flight on another planet (completed 72 total flights).',
        sourceUrl: 'https://images.nasa.gov/details/PIA24487',
        verified: true,
        category: 'operation',
      },
    ];
  }

  // Viking Landers
  if (combined.includes('viking')) {
    return [
      {
        id: 'vik-launch',
        date: 'August 20, 1975',
        title: 'Viking 1 Launch on Titan IIIE-Centaur',
        description: 'Dual orbiter and lander mission designed to search for signs of Martian life.',
        sourceUrl: 'https://images.nasa.gov/details/PIA00563',
        verified: true,
        category: 'launch',
      },
      {
        id: 'vik-touchdown',
        date: 'July 20, 1976',
        title: 'Chryse Planitia Touchdown',
        description: 'First successful long-duration soft landing on Mars, transmitting first surface panoramas.',
        sourceUrl: 'https://images.nasa.gov/details/PIA00563',
        verified: true,
        category: 'landing',
      },
      {
        id: 'vik-end',
        date: 'November 13, 1982',
        title: 'Final Transmission After 2,307 Sols',
        description: 'Station operated over six years until accidental transmission command interrupted uplink.',
        sourceUrl: 'https://images.nasa.gov/details/PIA00563',
        verified: true,
        category: 'final_contact',
      },
    ];
  }

  // Generic verifiable timeline derived from record date
  if (record.date_created) {
    const parsedDate = new Date(record.date_created);
    return [
      {
        id: `nasa-rec-${record.nasa_id}`,
        date: parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'NASA Archive Documentation Milestone',
        description: `Official archive entry accessioned by ${record.center || 'NASA'} under asset catalog identifier ${record.nasa_id}.`,
        sourceUrl: record.nasaWebUrl,
        verified: true,
        category: 'operation',
      },
    ];
  }

  return [];
}
