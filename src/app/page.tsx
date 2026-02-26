import Map from '@/components/Map';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="w-full h-screen bg-black overflow-hidden relative font-sans text-white">
      {/* 
        The Map component renders the Google Maps container at 100% width and height,
        and its own absolute positioned SidePanel.
      */}
      <Map />

      {/* 
        The Dashboard component sits on top of the Map to the left, 
        giving the "glassmorphism" overlay effect. 
      */}
      <Dashboard />

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-xs text-white/30 font-medium">
        CivicSense Concept &copy; 2026
      </div>
    </main>
  );
}
