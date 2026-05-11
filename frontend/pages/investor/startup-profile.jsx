/**
 * Startup Profile Page
 * Standalone page for viewing startup details
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import StartupDetails from "../../investor/StartupDetails";
import EscrowInvest from "../../components/EscrowInvest";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StartupProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [showInvestFlow, setShowInvestFlow] = useState(false);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No startup ID provided</p>
          <Link href="/investor-platform" className="text-blue-600 hover:underline">
            ← Back to Investments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/investor-platform"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Investments
        </Link>

        {!showInvestFlow ? (
          <>
            <StartupDetails startupId={id} />
            {user && (
              <div className="mt-6">
                <button
                  onClick={() => setShowInvestFlow(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Invest in this Startup
                </button>
              </div>
            )}
          </>
        ) : (
          <div>
            <button
              onClick={() => setShowInvestFlow(false)}
              className="mb-4 text-blue-600 hover:underline"
            >
              ← Back to Details
            </button>
            <EscrowInvest
              startup={{ startup_id: id }}
              onSuccess={() => {
                setShowInvestFlow(false);
                router.push("/investor-platform");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

