import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const SEED_DATA = [
    {
        lat: 40.7128,
        lng: -74.0060, // Central location
        businessType: "Community Tech Hub",
        review: "A collaborative workspace and learning center designed to provide free high-speed internet, coding workshops for kids, and meeting space for local startups.",
        author: "Sarah Jenkins",
        agreementCount: 42,
        saturationIndex: 8.5,
        createdAt: new Date()
    },
    {
        lat: 40.7135,
        lng: -74.0045, // Slightly offset
        businessType: "Rooftop Urban Farm",
        review: "Utilize empty commercial rooftop space to build a hydroponic farm that supplies fresh produce to neighborhood restaurants and local food banks.",
        author: "Marcus Chen",
        agreementCount: 128,
        saturationIndex: 9.2,
        createdAt: new Date()
    },
    {
        lat: 40.7115,
        lng: -74.0075, // Slightly offset
        businessType: "Pedestrian Plaza & Cafe",
        review: "Close off this intersection to car traffic and create a pedestrian-only zone with outdoor seating, a small coffee kiosk, and space for local musicians.",
        author: "Elena Rodriguez",
        agreementCount: 85,
        saturationIndex: 7.8,
        createdAt: new Date()
    },
    {
        lat: 40.7128,
        lng: -74.0060, // Same location as Tech Hub to show IdeaGallery carousel
        businessType: "Pop-Up Art Gallery",
        review: "A temporary exhibition space housed in rotating shipping containers, showcasing local artists and offering weekend pottery classes.",
        author: "David Kim",
        agreementCount: 31,
        saturationIndex: 6.5,
        createdAt: new Date()
    }
];

export async function GET() {
    try {
        const pinsRef = collection(db, 'pins');
        const snapshot = await getDocs(pinsRef);

        if (!snapshot.empty) {
            return NextResponse.json({ message: "Database already populated. Skipping seed." }, { status: 200 });
        }

        console.log("Seeding database with initial proposals...");

        for (const data of SEED_DATA) {
            await addDoc(pinsRef, data);
        }

        return NextResponse.json({ message: "Successfully seeded initial data." }, { status: 200 });

    } catch (error: any) {
        console.error("Error seeding data:", error);
        return NextResponse.json({ error: error.message || "Failed to seed data." }, { status: 500 });
    }
}
