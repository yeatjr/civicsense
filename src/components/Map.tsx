'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageSquare } from 'lucide-react';
import SidePanel from './SidePanel';
import IdeaGallery from './IdeaGallery';
import { useAuth } from '@/context/AuthContext';

export type RenovationPin = {
    id: string;
    lat: number;
    lng: number;
    review: string;
    businessType: string;
    saturationIndex: number | null;
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
    const [pins, setPins] = useState<RenovationPin[]>([]);
    const [tempPin, setTempPin] = useState<{ lat: number, lng: number } | null>(null);
    const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
    const [mapData, setMapData] = useState({ lat: 40.7128, lng: -74.0060, zoom: 13 });
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Auth context
    const { user, loginWithGoogle } = useAuth();

    const handleAiResponse = (action: any) => {
        if (action.map_action === "MOVE_TO" && action.coordinates) {
            setMapData(prev => ({ ...prev, lat: action.coordinates.lat, lng: action.coordinates.lng }));
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
                setTempPin({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
            } else {
                loginWithGoogle();
            }
        }
    };

    const handleCancel = () => {
        setTempPin(null);
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
            <APIProvider apiKey={(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.includes('Dummy')) ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : ''}>
                <GoogleMap
                    center={{ lat: mapData.lat, lng: mapData.lng }}
                    zoom={mapData.zoom}
                    onCenterChanged={(ev: any) => setMapData(prev => ({ ...prev, lat: ev.detail.center.lat, lng: ev.detail.center.lng }))}
                    onZoomChanged={(ev: any) => setMapData(prev => ({ ...prev, zoom: ev.detail.zoom }))}
                    mapId="map_id_civic_sense"
                    onContextmenu={handleRightClick}
                    styles={darkTheme as any}
                    disableDefaultUI={true}
                    clickableIcons={false}
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
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute bottom-10 whitespace-nowrap bg-black/80 backdrop-blur-md rounded-lg px-3 py-2 text-xs font-semibold text-white border border-white/10 shadow-2xl z-50 pointer-events-none"
                                    >
                                        Saturation Index: <span className={group.ideas[0].saturationIndex > 5 ? "text-red-400" : "text-green-400"}>{group.ideas[0].saturationIndex?.toFixed(2)}</span>
                                        <div className="text-gray-400 text-[10px] mt-1 truncate max-w-[150px]">{group.ideas[0].businessType} {group.ideas.length > 1 ? `(+${group.ideas.length - 1} more)` : ''}</div>
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
            </APIProvider>

            {/* AI Assistant FAB */}
            <AnimatePresence>
                {!tempPin && (
                    <motion.div
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
            />

            <IdeaGallery
                isOpen={!!selectedLocation}
                onClose={() => setSelectedLocation(null)}
                location={selectedLocation}
                ideas={activeIdeasForLocation}
                onIdeaUpdated={fetchPins}
            />
        </div>
    );
}
