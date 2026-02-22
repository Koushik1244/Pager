import ConnectWallet from "@/components/ConnectWallet";
import CreateBounty from "@/components/CreateBounty";
import BountyFeed from "@/components/BountyFeed";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pager</h1>
          <Link
            href="/map"
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Map View
          </Link>
        </div>

        <ConnectWallet />
        <CreateBounty />
        <BountyFeed />
      </div>
    </main>
  );
}
