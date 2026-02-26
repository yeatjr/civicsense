'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Loader2, Send, Bot, User, CheckCircle, XCircle } from 'lucide-react';

interface SidePanelProps {
    isOpen: boolean;
    location: { lat: number, lng: number } | null;
    onCancel: () => void;
    onSuccess: () => void;
    onAiAction?: (action: any) => void;
}

type Message = {
    role: 'user' | 'model';
    text: string;
};

export default function SidePanel({ isOpen, location, onCancel, onSuccess, onAiAction }: SidePanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'VALIDATED' | 'REJECTED'>('DRAFT');
    const [feasibility, setFeasibility] = useState<number | null>(null);
    const [simulation, setSimulation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting when panel opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'model', text: "Hi! I'm the CivicSense Urban Planning Agent. What kind of renovation or new business would you like to propose here?" }]);
            setStatus('DRAFT');
            setFeasibility(null);
            setSimulation(false);
        }
        if (!isOpen) {
            setMessages([]);
            setInput('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !location) return;

        const userText = input.trim();
        const newMessages = [...messages, { role: 'user' as const, text: userText }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, location })
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();

            setMessages((prev) => [...prev, { role: 'model', text: data.text }]);

            const action = data.action;
            if (action) {
                if (onAiAction) onAiAction(action);

                setStatus(action.status);
                if (action.feasibility_score > 0) setFeasibility(action.feasibility_score);

                if (action.status === 'VALIDATED') {
                    await addDoc(collection(db, 'pins'), {
                        lat: location.lat,
                        lng: location.lng,
                        review: action.idea_description || "Agent Chat History Logged",
                        businessType: action.idea_title || "New Proposal",
                        author: action.author || "Anonymous",
                        agreementCount: 0,
                        saturationIndex: action.feasibility_score || 5, // Feasibility replaces Saturation temporarily for demo
                        createdAt: new Date()
                    });

                    // Immediately trigger onSuccess to close the panel & unlock map
                    onSuccess();
                }

                if (action.map_action === 'SHOW_3D_SIMULATION') {
                    console.log("3D Simulation Triggered at", action.coordinates);
                    setSimulation(true);
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 w-80 md:w-96 h-full z-20 flex flex-col shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/40 border-l border-white/20 dark:border-white/10"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 font-outfit">
                                AI Planning Agent
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Status: {status}</div>
                                {feasibility !== null && (
                                    <div className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                                        Score: {feasibility}/10
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-200" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600/50' : 'bg-purple-600/50'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-blue-200" /> : <Bot className="w-4 h-4 text-purple-200" />}
                                </div>
                                <div className={`text-sm py-2 px-3 rounded-2xl max-w-[80%] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white/10 text-gray-200 border border-white/10 rounded-tl-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600/50 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-4 h-4 text-purple-200 animate-spin" />
                                </div>
                                <div className="bg-white/5 py-2 px-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Status Banners */}
                    {status === 'VALIDATED' && (
                        <div className="mx-5 mb-2 bg-green-500/20 border border-green-500/30 p-3 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                            <p className="text-xs text-green-200">Proposal Approved! Saving to map...</p>
                        </div>
                    )}
                    {status === 'REJECTED' && (
                        <div className="mx-5 mb-2 bg-red-500/20 border border-red-500/30 p-3 rounded-xl flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-xs text-red-200">Proposal Rejected. Close panel or try a different idea.</p>
                        </div>
                    )}

                    {simulation && (
                        <div className="mx-5 mb-2 bg-blue-500/20 border border-blue-500/30 p-3 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                                <p className="text-xs text-blue-200 font-bold">Generating 3D Simulation (Nano Banana model)...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mx-5 mb-2 text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-5 border-t border-white/10 bg-black/20">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                type="text"
                                placeholder={status === 'VALIDATED' ? "Approved..." : "Type your answer..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading || status === 'VALIDATED'}
                                className="w-full bg-black/50 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim() || status === 'VALIDATED'}
                                className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-purple-600 rounded-full text-white hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
