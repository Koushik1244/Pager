import BountyMap from "@/components/BountyMap";

export default function MapPage() {
    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-center mb-4">
                Pager Map
            </h1>

            <div className="max-w-5xl mx-auto">
                <BountyMap />
            </div>
        </main>
    );
}
