'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageSquare } from 'lucide-react';
import SidePanel from './SidePanel';
import IdeaGallery from './IdeaGallery';
import VisionGallery from './VisionGallery';
import { useAuth } from '@/context/AuthContext';

export type RenovationPin = {
    id: string;
    lat: number;
    lng: number;
    review: string;
    businessType: string;
    saturationIndex: number | null;
    visionImage?: string;
};

// A dark mode theme for Google Maps
const darkTheme = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }],
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }],
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }],
    }
];

export default function Map() {
    return (
        <APIProvider
            apiKey={(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.includes('Dummy')) ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : ''}
            libraries={['places', 'marker', 'geometry']}
        >
            <MapInner />
        </APIProvider>
    );
}

function MapInner() {
    const [pins, setPins] = useState<RenovationPin[]>([]);
    const [tempPin, setTempPin] = useState<{ lat: number, lng: number } | null>(null);
    const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
    const [mapData, setMapData] = useState({ lat: 40.7128, lng: -74.0060, zoom: 13 });
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);

    // Auth context
    const { user, loginWithGoogle } = useAuth();

    const handleAiResponse = (action: any) => {
        if (action.map_action === "MOVE_TO" && action.coordinates) {
            const { lat, lng } = action.coordinates;
            setMapData(prev => ({ ...prev, lat, lng }));
            if (map) {
                map.panTo({ lat, lng });
            }
        }
    };

    const fetchPins = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'pins'));
            const fetchedPins: RenovationPin[] = [];
            querySnapshot.forEach((doc) => {
                fetchedPins.push({ id: doc.id, ...doc.data() } as RenovationPin);
            });
            setPins(fetchedPins);
        } catch (error) {
            console.error("Error fetching pins:", error);
        }
    };

    useEffect(() => {
        fetchPins();
    }, []);

    const handleRightClick = (e: any) => {
        if (e.detail?.latLng) {
            if (user) {
                setSelectedPlaceName(null);
                setTempPin({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
            } else {
                loginWithGoogle();
            }
        }
    };

    const map = useMap();
    const placesLib = useMapsLibrary('places');
    const geocodingLib = useMapsLibrary('geocoding');

    const handleMapClick = useCallback((e: any) => {
        if (!map || !placesLib || !geocodingLib) {
            console.log("[CivicSense] Map dependencies not ready:", {
                map: !!map,
                places: !!placesLib,
                geocoding: !!geocodingLib
            });
            return;
        }

        const latLng = e.detail?.latLng || e.latLng;
        const placeId = e.detail?.placeId;

        if (!latLng) return;

        const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

        const REGION_TYPES = [
            'locality', 'political', 'neighborhood', 'sublocality',
            'sublocality_level_1', 'sublocality_level_2',
            'administrative_area_level_1', 'administrative_area_level_2',
            'administrative_area_level_3', 'administrative_area_level_4',
            'country', 'postal_code', 'route', 'geocode',
            'colloquial_area', 'natural_feature'
        ];

        const isRegionType = (types: string[]) => {
            return types && types.length > 0 && types.every(t => REGION_TYPES.includes(t));
        };

        // Open panel immediately with a loading state for better responsiveness
        setSelectedPlaceName("Detecting location...");
        setTempPin({ lat, lng });

        const findNearestBusiness = (loc: { lat: number, lng: number }, service: google.maps.places.PlacesService) => {
            console.log("[CivicSense] Searching for context at", loc);

            // Priority 1: Geocode for Area/Neighborhood Name
            const geocoder = new geocodingLib.Geocoder();
            geocoder.geocode({ location: loc }, (gResults: any, gStatus: any) => {
                console.log("[CivicSense] Geocode status:", gStatus);
                const isGeoOk = (gStatus as any) === 'OK' || (gStatus as any) === (geocodingLib as any).GeocoderStatus.OK;

                if (isGeoOk && gResults?.[0]) {
                    const result = gResults[0];
                    const area = result.address_components.find((c: any) =>
                        c.types.includes('neighborhood') ||
                        c.types.includes('sublocality') ||
                        c.types.includes('locality')
                    );

                    // If we found a specific area/neighborhood, use it
                    if (area && !area.types.includes('country')) {
                        console.log("[CivicSense] Found area name:", area.long_name);
                        setSelectedPlaceName(area.long_name);
                        return;
                    }
                }

                // Priority 2: Nearby Search for Establishment
                service.nearbySearch({
                    location: loc,
                    radius: 50,
                    type: 'establishment'
                }, (results, status) => {
                    console.log("[CivicSense] nearbySearch status:", status);
                    const isOk = (status as any) === 'OK' || (status as any) === (placesLib as any).PlacesServiceStatus.OK;
                    if (isOk && results && results.length > 0) {
                        const foundName = results[0].name || "New Development";
                        console.log("[CivicSense] nearbySearch found business:", foundName);
                        setSelectedPlaceName(foundName);
                    } else if (gResults?.[0]) {
                        // Fallback to formatted address
                        setSelectedPlaceName(gResults[0].formatted_address.split(',')[0]);
                    } else {
                        setSelectedPlaceName(`Location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
                    }
                });
            });
        };

        const service = new placesLib.PlacesService(map);
        const latLngObj = { lat, lng };

        if (placeId) {
            console.log("[CivicSense] POI clicked. ID:", placeId);
            if (e.stop) e.stop();
            service.getDetails({ placeId, fields: ['name', 'types', 'formatted_address'] }, (place, status) => {
                console.log("[CivicSense] getDetails status:", status);
                const isDetOk = (status as any) === 'OK' || (status as any) === (placesLib as any).PlacesServiceStatus.OK;
                if (isDetOk) {
                    if (place && isRegionType(place.types || [])) {
                        console.log("[CivicSense] Region detected (" + place.name + "), checking for businesses...");
                        findNearestBusiness(latLngObj, service);
                    } else if (place) {
                        console.log("[CivicSense] Specific place detected:", place.name);
                        setSelectedPlaceName(place.name || "Unknown Place");
                    }
                } else {
                    console.warn("[CivicSense] getDetails failed. Falling back to nearby search.");
                    findNearestBusiness(latLngObj, service);
                }
            });
        } else {
            console.log("[CivicSense] Background click at:", latLngObj);
            findNearestBusiness(latLngObj, service);
        }
    }, [user, map, placesLib, geocodingLib]);

    const handleCancel = () => {
        setTempPin(null);
        setSelectedPlaceName(null);
    };

    const handlePinCreated = () => {
        setTempPin(null);
        fetchPins();
    };

    const handleFabClick = () => {
        if (user) {
            // Default center if no right click occurred
            setTempPin({ lat: mapData.lat, lng: mapData.lng });
        } else {
            loginWithGoogle();
        }
    };

    // Group pins by location
    const groupedPins = pins.reduce((acc, pin) => {
        const key = `${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
        if (!acc[key]) {
            acc[key] = {
                lat: pin.lat,
                lng: pin.lng,
                mainPinId: pin.id,
                ideas: []
            };
        }
        acc[key].ideas.push(pin);
        return acc;
    }, {} as Record<string, { lat: number, lng: number, mainPinId: string, ideas: RenovationPin[] }>);

    const activeIdeasForLocation = selectedLocation
        ? groupedPins[`${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`]?.ideas || []
        : [];

    return (
        <div className="w-full h-full relative">
            <GoogleMap
                defaultCenter={{ lat: mapData.lat, lng: mapData.lng }}
                defaultZoom={mapData.zoom}
                onCameraChanged={(ev: any) => {
                    // Update state to track position, but don't pass it back as a prop to avoid jitter
                    setMapData({
                        lat: ev.detail.center.lat,
                        lng: ev.detail.center.lng,
                        zoom: ev.detail.zoom
                    });
                }}
                mapId="1f3885acd6cb624ad53f4c6c"
                onContextmenu={handleRightClick}
                onClick={handleMapClick}
                disableDefaultUI={true}
                clickableIcons={true}
            >
                {Object.values(groupedPins).map((group) => (
                    <AdvancedMarker
                        key={group.mainPinId}
                        position={{ lat: group.lat, lng: group.lng }}
                        onMouseEnter={() => setHoveredPinId(group.mainPinId)}
                        onMouseLeave={() => setHoveredPinId(null)}
                        onClick={() => setSelectedLocation({ lat: group.lat, lng: group.lng })}
                        className="group cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white/20 shadow-lg shadow-purple-500/50"
                            >
                                <Pin background={'#9333ea'} glyphColor={'#ffffff'} borderColor={'transparent'} />
                            </motion.div>

                            {/* Tooltip for Saturation Index on hover */}
                            {hoveredPinId === group.mainPinId && group.ideas[0].saturationIndex !== null && (
                                <motion.div
                                    key={`tooltip-${group.mainPinId}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-10 bg-black/80 backdrop-blur-md rounded-2xl p-2 text-xs font-semibold text-white border border-white/20 shadow-2xl z-50 pointer-events-none min-w-[160px]"
                                >
                                    {group.ideas[0].visionImage && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-2 border border-white/10">
                                            <img
                                                src={`data:image/jpeg;base64,${group.ideas[0].visionImage}`}
                                                alt="AI Vision"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="px-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Saturation Index</span>
                                            <span className={group.ideas[0].saturationIndex! > 5 ? "text-red-400" : "text-green-400"}>
                                                {group.ideas[0].saturationIndex?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-white font-bold truncate">{group.ideas[0].businessType}</div>
                                        {group.ideas.length > 1 && (
                                            <div className="text-purple-400 text-[10px] mt-0.5 font-medium">+{group.ideas.length - 1} more community ideas</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </AdvancedMarker>
                ))}

                {tempPin && (
                    <AdvancedMarker position={tempPin}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white/50 animate-pulse"
                        >
                            <Pin background={'#3b82f6'} glyphColor={'#ffffff'} borderColor={'transparent'} />
                        </motion.div>
                    </AdvancedMarker>
                )}

            </GoogleMap>

            {/* AI Assistant FAB */}
            <AnimatePresence>
                {!tempPin && (
                    <motion.div
                        key="ai-fab"
                        className="absolute bottom-10 right-10 z-50 flex flex-col items-end gap-2"
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    >
                        {/* Optional Tooltip Bubble */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 }}
                            className="bg-black/80 backdrop-blur-md text-white text-xs font-medium px-3 py-2 rounded-2xl rounded-br-none border border-white/10 shadow-xl pointer-events-none"
                        >
                            {!user ? "Sign in to chat!" : "Let's plan together!"}
                        </motion.div>

                        <button
                            onClick={handleFabClick}
                            className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-black/20"
                        >
                            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Bot className="w-6 h-6 text-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <SidePanel
                isOpen={!!tempPin}
                location={tempPin}
                onCancel={handleCancel}
                onSuccess={handlePinCreated}
                onAiAction={handleAiResponse}
                placeName={selectedPlaceName}
            />

            <IdeaGallery
                isOpen={!!selectedLocation}
                onClose={() => setSelectedLocation(null)}
                location={selectedLocation}
                ideas={activeIdeasForLocation}
                onIdeaUpdated={fetchPins}
            />
            <VisionGallery
                pins={pins}
                onSelectPin={(pin: RenovationPin) => {
                    const { lat, lng } = pin;
                    setMapData(prev => ({ ...prev, lat, lng, zoom: 18 }));
                    if (map) {
                        map.setCenter({ lat, lng });
                        map.setZoom(18);
                    }
                    setSelectedLocation({ lat, lng });
                }}
            />
        </div>
    );
}
