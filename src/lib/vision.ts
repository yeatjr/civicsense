/**
 * AI Vision Configuration and Prompt Engineering Logic
 * Ported from IdealCity to CivicSense.
 */

export const BACKGROUNDS: Record<string, any> = {
    business: {
        base: 'dense urban commercial streetscape: multi-storey shophouses, glass-facade office towers, and wide asphalt roads with crisp white lane markings',
        ground: 'smooth dark-grey tarmac pavement with yellow kerb markings and pedestrian crossing stripes',
        sky: 'solid deep-charcoal void #1a1a1a — no sky, no clouds, no horizon',
        accent: 'warm amber street-lamp glow lining both sides of the road',
    },
    civic: {
        base: 'formal civic precinct: symmetrical tree-lined avenues, manicured lawns, national flagpoles, and low-rise government blocks in the far background',
        ground: 'smooth light-grey concrete plaza with granite inlay strips and tactile guidance paths',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'cool white institutional floodlighting giving a clean authoritative feel',
    },
    nature: {
        base: 'dense tropical rainforest backdrop: towering rain-trees, thick leaf canopy, uneven terrain covered in lush ferns and ground-cover plants, a winding dirt path cutting through',
        ground: 'natural earth floor with grass patches, exposed tree roots, scattered leaf litter, and patches of moss',
        sky: 'solid deep-forest-green void #0d1a0d — no sky',
        accent: 'soft dappled natural light filtering through the leaf canopy from above',
    },
    transit: {
        base: 'busy multi-lane road interchange: elevated expressways overhead, directional signage gantries, dedicated bus lanes, and taxi bays at ground level',
        ground: 'dark asphalt with bright white and yellow traffic markings, tactile paving strips at kerbs, and bus-stop yellow boxes',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'bright overhead LED canopy lighting and blue wayfinding signage',
    },
    residential: {
        base: 'quiet residential neighbourhood: low-rise terrace houses, garden fences, tree-shaded footpaths, and a cul-de-sac or local road with speed bumps',
        ground: 'grey concrete pavement with grass verge strips and small garden beds at kerb edge',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'warm residential street-lamp glow at medium height',
    },
    sports: {
        base: 'large open sports ground: adjacent running track with lane markings, tall floodlight towers at corners, and simple spectator stands visible in the far background',
        ground: 'flat emerald-green synthetic turf or rubberised red athletics track surface with crisp white painted markings',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'intense white floodlighting from tall poles casting almost no shadows on the playing surface',
    },
    parking: {
        base: 'structured car park: concrete deck levels visible at the rear, access ramp, ticketing booth at entry, and a barrier arm',
        ground: 'grey tarmac with crisp white bay-number stencils and directional arrows on every aisle',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'flat cool-white fluorescent ceiling lighting across each deck level',
    },
    default: {
        base: 'generic urban environment with mixed-use buildings and a standard road grid',
        ground: 'grey asphalt with white lane markings',
        sky: 'solid deep-charcoal void #1a1a1a — no sky',
        accent: 'neutral white artificial overhead lighting',
    },
};

export const PLACE_TYPE_SCENE_MAP: Record<string, any> = {
    restaurant: { sceneCategory: 'building', bgKey: 'business', signLabel: 'Restaurant', label: 'Restaurant', environment: 'modern restaurant with welcoming facade, outdoor dining terrace, and warm interior lighting visible through glass', visualStyle: '45-degree isometric showing entrance and terrace', surroundings: 'street-level retail strip, adjacent cafes, pedestrian pavement' },
    cafe: { sceneCategory: 'building', bgKey: 'business', signLabel: 'Café', label: 'Café', environment: 'cosy café with glass shopfront, outdoor tables with umbrellas, and visible barista counter', visualStyle: '45-degree isometric shopfront view', surroundings: 'pedestrian zone, tree-lined street, neighbouring boutiques' },
    park: { sceneCategory: 'nature', bgKey: 'nature', signLabel: 'Park', label: 'Public Park', environment: 'lush green park with manicured lawns, walking paths, benches, lamp posts, and flowering shrubs', visualStyle: 'wide aerial showing full park boundary and greenery', surroundings: 'surrounding urban streets, nearby residential buildings, trees forming a canopy' },
    hospital: { sceneCategory: 'building', bgKey: 'civic', signLabel: 'Hospital', label: 'Hospital', environment: 'large hospital with emergency entrance, multi-wing layout, helipad on roof, and clinical white facades', visualStyle: 'elevated isometric showing full H or L-shaped footprint', surroundings: 'ambulance bays, car parks, green buffer zones' },
    school: { sceneCategory: 'building', bgKey: 'civic', signLabel: 'School', label: 'School', environment: 'school campus with main teaching block, central courtyard, covered walkways, and a sports field', visualStyle: 'elevated angle showing full campus layout', surroundings: 'perimeter fencing, school bus drop-off, neighbourhood streets' },
    gym: { sceneCategory: 'building', bgKey: 'sports', signLabel: 'Gym', label: 'Gymnasium', environment: 'modern gymnasium building with glass facade and visible workout equipment inside', visualStyle: '45-degree isometric showing entrance and main facade', surroundings: 'urban street, neighbouring shophouses or commercial buildings' },
    parking: { sceneCategory: 'parking', bgKey: 'parking', signLabel: 'Car Park', label: 'Car Park', environment: 'multi-storey car park with clearly marked bays, access ramps, and ticketing booths', visualStyle: 'overhead isometric showing parking bay grid', surroundings: 'access roads, nearby commercial buildings' },
    bus_station: { sceneCategory: 'transit', bgKey: 'transit', signLabel: 'Bus Terminal', label: 'Bus Terminal', environment: 'bus terminal with covered bus bays, ticketing hall, and waiting concourse', visualStyle: 'wide aerial isometric showing bus bay layout', surroundings: 'access roads, taxi stands, pedestrian connections' },
    establishment: { sceneCategory: 'building', bgKey: 'business', signLabel: 'Building', label: 'Commercial Building', environment: 'modern commercial building with clean rectangular massing and ground-floor retail', visualStyle: '45-degree isometric street-corner view', surroundings: 'urban street grid, neighbouring commercial blocks, pavement' },
};

const BUILDING_TYPES = [
    'library', 'school', 'hospital', 'clinic', 'mosque', 'church', 'temple',
    'park', 'garden', 'playground', 'market', 'mall', 'shop', 'store',
    'restaurant', 'cafe', 'hotel', 'office', 'bank', 'pharmacy', 'gym',
    'stadium', 'museum', 'gallery', 'university', 'college', 'kindergarten',
    'parking', 'parking lot', 'bus station', 'train station', 'airport',
    'community centre', 'community center', 'sports complex', 'swimming pool',
    'fire station', 'police station', 'post office', 'government building',
    'football field', 'football court', 'basketball court', 'tennis court',
    'forest', 'lake', 'river', 'beach', 'mountain'
];

export function extractBuildingType(commentText: string) {
    const lower = commentText.toLowerCase();
    return BUILDING_TYPES.find(type => lower.includes(type)) || null;
}

export function resolvePlaceScene(types: string[]) {
    const SKIP = new Set(['point_of_interest', 'establishment', 'locality', 'political',
        'neighborhood', 'sublocality', 'sublocality_level_1', 'sublocality_level_2',
        'administrative_area_level_1', 'administrative_area_level_2',
        'administrative_area_level_3', 'country', 'postal_code', 'route', 'geocode']);

    for (const t of types) {
        if (!SKIP.has(t) && PLACE_TYPE_SCENE_MAP[t]) return PLACE_TYPE_SCENE_MAP[t];
    }

    if (types.includes('establishment') && PLACE_TYPE_SCENE_MAP['establishment']) return PLACE_TYPE_SCENE_MAP['establishment'];

    return {
        sceneCategory: 'building',
        label: 'Urban Building',
        environment: 'modern urban building with clean rectangular massing, a glass curtain-wall facade, and ground-floor retail',
        visualStyle: '45-degree isometric street-corner view',
        surroundings: 'urban street grid, neighbouring buildings, pavement',
        bgKey: 'default'
    };
}

export function buildImagePrompt(
    commentText: string,
    placeScene: any,
    envAnalysis: string | null,
    satelliteAnalysis: string | null,
    placeName: string,
    placeAddress: string,
    placeTypes: string[],
    lat?: number,
    lng?: number
) {
    const addrParts = (placeAddress || '').split(',').map(s => s.trim());
    const city = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : 'Local City';
    const country = addrParts.length >= 1 ? addrParts[addrParts.length - 1] : 'Region';

    const floorMatch = commentText.match(/(\d+)\s*(floor|storey|story|level)/i);
    const numFloors = floorMatch ? floorMatch[1] : '4';
    const rooftopMatch = commentText.match(/rooftop|roof\s?(garden|terrace|pool|parking|solar)/i);
    const rooftopFeature = rooftopMatch ? rooftopMatch[0] : 'green terrace';

    const commentOverrideType = extractBuildingType(commentText);
    let activeScene = placeScene;
    if (commentOverrideType) {
        const overrideKey = commentOverrideType.replace(/ /g, '_');
        const overrideScene = PLACE_TYPE_SCENE_MAP[overrideKey] || PLACE_TYPE_SCENE_MAP[commentOverrideType];
        if (overrideScene) activeScene = overrideScene;
    }

    const activeBg = BACKGROUNDS[activeScene.bgKey] || BACKGROUNDS.default;
    const signText = (activeScene.signLabel || activeScene.label || 'Building').toUpperCase();
    const googleTypesLabel = (placeTypes || []).filter(t => !['point_of_interest', 'establishment'].includes(t)).join(', ') || 'unknown';

    const satelliteCtx = satelliteAnalysis
        ? `SATELLITE MAP ANALYSIS — calibrate background density and road layout: \n"${satelliteAnalysis.trim()}"`
        : 'No satellite data — use category background defaults.';
    const streetViewCtx = envAnalysis
        ? `STREET VIEW ANALYSIS — calibrate architectural style and urban scale: \n"${envAnalysis.trim()}"`
        : '';

    const QUALITY = `
━━ IMAGE QUALITY — MANDATORY ━━
- Maximum render resolution, razor-sharp edges on every element
- Zero blur of any kind (motion, depth-of-field, atmospheric)
- Zero fog, haze, glow, bokeh, or lens flare
- Signboard letters: PERFECTLY LEGIBLE — crisp flat vector-quality shapes
- Geometric lines (walls, roads, windows): perfectly straight
- High colour contrast — no muddy or washed-out tones
- Zero noise, grain, or compression artefacts`;

    const commonHeader = `Generate a crisp 3D digital-twin smart-city architectural visualization.
PLACE TYPE: ${activeScene.label} | ${city}, ${country}
COORDINATES: ${lat?.toFixed(6) || 'N/A'}, ${lng?.toFixed(6) || 'N/A'}
MAPS TYPES: ${googleTypesLabel}
`;

    if (activeScene.sceneCategory === 'nature') {
        return `${commonHeader}
━━ SCENE: NATURAL / OPEN SPACE ━━
Do NOT place any building as the central focus.
${activeScene.environment}
User vision: ${commentText}
━━ BACKGROUND ━━
Base: ${activeBg.base} | Ground: ${activeBg.ground} | Void: ${activeBg.sky}
${satelliteCtx}
${streetViewCtx}
━━ VISUAL STYLE ━━
3D smart-city / digital twin, flat low-poly geometry, solid matte colours.
${QUALITY}`;
    }

    return `${commonHeader}
━━ BUILDING ━━
${activeScene.environment}
Architecture: ${numFloors} floors, modern massing, Facade: white/grey walls, blue glass, Flat roof with: ${rooftopFeature}
━━ SIGNBOARD ━━
Large sign on main facade: "${signText}". Bold sans-serif capitals, high contrast.
━━ BACKGROUND ━━
Base: ${activeBg.base} | Ground: ${activeBg.ground} | Void: ${activeBg.sky}
${satelliteCtx}
${streetViewCtx}
━━ USER VISION ━━
${commentText}
━━ VISUAL STYLE ━━
3D smart-city digital twin, isometric or 45-degree birds-eye, flat low-poly surfaces.
${QUALITY}`;
}
