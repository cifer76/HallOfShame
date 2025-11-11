import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { NavBar } from './components/NavBar';
import { ShameDetail } from './components/ShameDetail';
import { PublishPage } from './components/PublishPage';
import { About } from './components/About';
import { WalletStatus } from './components/WalletConnect';
import { Shame } from './types';
import { fetchShames } from './utils/suiClient';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getNetworkConfig } from './utils/suiClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

function HomePage() {
  const [shames, setShames] = useState<Shame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const config = getNetworkConfig();

  useEffect(() => {
    loadShames();
  }, []);

  async function loadShames() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchShames();
      setShames(data);
    } catch (err) {
      console.error('Error loading shames:', err);
      setError('Failed to load shames. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div className="bg-white min-h-full">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <WalletStatus />

        {/* Configuration Notice */}
        {!config.packageId && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-semibold mb-1">Configuration Required</div>
                <div>Please deploy the smart contract and update .env with VITE_PACKAGE_ID and VITE_HALL_OF_SHAME_ID</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-red-800">
          <div className="flex items-center gap-3">
            <button
              onClick={loadShames}
              disabled={loading}
              className="text-sm text-gray-600 hover:underline"
              title="Refresh"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <button
            onClick={() => navigate('/new')}
            className="text-sm text-gray-600 hover:underline"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New Shame
          </button>
        </div>

        {/* Shames List */}
        {loading && shames.length === 0 ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="py-2 border-b border-gray-200">
                <div className="h-4 bg-gray-200 w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : shames.length === 0 ? (
          <div className="py-8 text-center text-gray-600">
            <div className="mb-4">No shames yet.</div>
            <button
              onClick={() => navigate('/new')}
              className="text-sm text-gray-600 hover:underline"
            >
              Be the first to submit
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {shames.map((shame, index) => (
              <div
                key={shame.id}
                className="py-2 border-b border-gray-200 hover:bg-red-50 cursor-pointer"
                onClick={() => navigate(`/shame/${shame.id}`)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-sm min-w-[2rem]">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      <span>{shame.title || 'Untitled'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <span>{shame.upvoteCount} points</span>
                      <span className="mx-1">|</span>
                      <span>{formatDate(shame.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <div className="min-h-[100vh] bg-white flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shame/:id" element={<ShameDetail />} />
          <Route path="/new" element={<PublishPage />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <footer className="py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-500">
          Powered by Sui blockchain and Walrus decentralized storage infrastructure.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const config = getNetworkConfig();
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ testnet: { url: config.rpcUrl } }} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
