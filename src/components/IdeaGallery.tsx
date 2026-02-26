'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ThumbsUp, User, Bot } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Idea {
    id: string;
    businessType: string;
    review: string;
    author?: string;
    agreementCount?: number;
    saturationIndex?: number | null;
    visionImage?: string;
}

interface IdeaGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    location: { lat: number; lng: number } | null;
    ideas: Idea[];
    onIdeaUpdated: () => void;
}

export default function IdeaGallery({ isOpen, onClose, location, ideas, onIdeaUpdated }: IdeaGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [upvotingIdeaId, setUpvotingIdeaId] = useState<string | null>(null);
    const { user, loginWithGoogle } = useAuth();

    // Sort ideas by agreementCount descending
    const sortedIdeas = [...ideas].sort((a, b) => (b.agreementCount || 0) - (a.agreementCount || 0));

    // Safety check
    if (!isOpen || sortedIdeas.length === 0) return null;

    const currentIdea = sortedIdeas[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % sortedIdeas.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + sortedIdeas.length) % sortedIdeas.length);
    };

    const handleAgree = async (ideaId: string) => {
        if (!user) {
            loginWithGoogle();
            return;
        }

        if (upvotingIdeaId) return; // Prevent double-clicks

        setUpvotingIdeaId(ideaId);
        try {
            const ideaRef = doc(db, 'pins', ideaId);
            await updateDoc(ideaRef, {
                agreementCount: increment(1)
            });
            // Callback to parent to refetch data
            onIdeaUpdated();
        } catch (error) {
            console.error("Error upvoting idea:", error);
        } finally {
            setUpvotingIdeaId(null);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key="gallery-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
                    <div>
                        <h2 className="text-xl font-bold text-white font-outfit">Community Ideas</h2>
                        <p className="text-xs text-gray-400">
                            {sortedIdeas.length} {sortedIdeas.length === 1 ? 'Idea' : 'Ideas'} proposed here
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-300" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 relative min-h-[250px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        {currentIdea && (
                            <motion.div
                                key={currentIdea.id || `temp-${currentIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                                    {currentIdea.businessType}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span>Proposed by <strong className="text-white">{currentIdea.author || 'Anonymous'}</strong></span>
                                </div>
                            </div>

                            {currentIdea.visionImage && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                    <img
                                        src={`data:image/jpeg;base64,${currentIdea.visionImage}`}
                                        alt="Architecture Vision"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-purple-400 border border-purple-400/30 flex items-center gap-1">
                                        <Bot className="w-3 h-3" />
                                        AI VISION
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-300 leading-relaxed text-sm">
                                {currentIdea.review}
                            </p>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => handleAgree(currentIdea.id)}
                                    disabled={upvotingIdeaId === currentIdea.id}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${upvotingIdeaId === currentIdea.id
                                        ? 'bg-purple-600/50 cursor-not-allowed text-white/50'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${upvotingIdeaId === currentIdea.id ? 'animate-bounce' : ''}`} />
                                    Agree ({currentIdea.agreementCount || 0})
                                </button>

                                {currentIdea.saturationIndex && (
                                    <div className={`text-xs px-3 py-1.5 rounded-full font-bold ${currentIdea.saturationIndex > 5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        Feasibility: {currentIdea.saturationIndex}/10
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

                {/* Carousel Navigation (only if > 1 idea) */}
                {sortedIdeas.length > 1 && (
                    <div className="flex justify-between items-center p-4 bg-black/40 border-t border-white/5">
                        <button
                            onClick={handlePrev}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex gap-1.5">
                            {sortedIdeas.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-purple-500' : 'w-1.5 bg-white/20'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Backdrop overlay */}
            <motion.div
                key="gallery-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[50]"
            />
        </AnimatePresence>
    );
}
