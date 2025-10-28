import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { WalletConnect, WalletStatus } from './components/WalletConnect';
import { RevelationCard } from './components/RevelationCard';
import { PublishForm } from './components/PublishForm';
import { Revelation } from './types';
import { fetchRevelations } from './utils/suiClient';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getNetworkConfig, suiClient } from './utils/suiClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

function HallOfShameApp() {
  const [revelations, setRevelations] = useState<Revelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = getNetworkConfig();

  useEffect(() => {
    loadRevelations();
  }, []);

  async function loadRevelations() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRevelations();
      setRevelations(data);
    } catch (err) {
      console.error('Error loading revelations:', err);
      setError('Failed to load revelations. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Hall of Shame
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Decentralized Bulletin Board on Walrus & Sui
              </p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <WalletStatus />

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {revelations.length} Revelation{revelations.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={loadRevelations}
              disabled={loading}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => setShowPublishForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Publish Revelation
          </button>
        </div>

        {/* Configuration Notice */}
        {!config.packageId && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">Configuration Required</h3>
              <p className="text-sm text-orange-800">
                Please deploy the smart contract and update the <code className="bg-orange-100 px-1 rounded">.env</code> file with:
              </p>
              <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
                <li><code className="bg-orange-100 px-1 rounded">VITE_PACKAGE_ID</code></li>
                <li><code className="bg-orange-100 px-1 rounded">VITE_HALL_OF_SHAME_ID</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Revelations Grid */}
        {loading && revelations.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : revelations.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Revelations Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to publish a revelation on the Hall of Shame!</p>
            <button
              onClick={() => setShowPublishForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Publish First Revelation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {revelations.map(revelation => (
              <RevelationCard
                key={revelation.id}
                revelation={revelation}
                onUpvoteSuccess={loadRevelations}
              />
            ))}
          </div>
        )}
      </main>

      {/* Publish Form Modal */}
      {showPublishForm && (
        <PublishForm
          onClose={() => setShowPublishForm(false)}
          onPublishSuccess={loadRevelations}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>Built with ❤️ on Sui & Walrus</p>
          <p className="mt-1">
            Network: <span className="font-mono font-semibold">{config.network}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ testnet: { url: suiClient.transport.url } }} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <HallOfShameApp />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}


