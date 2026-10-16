import BountyMap from "@/components/BountyMap";

export default function MapPage() {
    return (
        <main className="min-h-screen bg-backgroundLight dark:bg-backgroundDark transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-textMainLight dark:text-textMainDark">
                        Bounty Map
                    </h1>
                    <p className="text-sm text-textMutedDark">
                        Explore active bounties around the world
                    </p>
                </div>

                {/* Glass Container */}
                <div className="
                    rounded-2xl
                    overflow-hidden
                    border border-primary/20
                    shadow-xl
                    bg-white/60 dark:bg-cardDark/60
                    backdrop-blur-md
                ">
                    <BountyMap />
                </div>
            </div>
        </main>
    );
}
