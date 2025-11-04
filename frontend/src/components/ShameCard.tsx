import { useState, useEffect } from 'react';
import { ArrowUp, Calendar, Coins, User } from 'lucide-react';
import { Shame, ShameContent } from '../types';
import { fetchFromWalrus } from '../utils/walrus';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { createUpvoteTransaction } from '../utils/suiClient';

interface ShameCardProps {
  shame: Shame;
  onUpvoteSuccess?: () => void;
}

const MIN_UPVOTE_AMOUNT = 100_000_000n; // 0.1 SUI

export function ShameCard({ shame, onUpvoteSuccess }: ShameCardProps) {
  const [content, setContent] = useState<ShameContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    loadContent();
  }, [shame.blobId]);

  async function loadContent() {
    try {
      setLoading(true);
      const data = await fetchFromWalrus(shame.blobId);
      setContent(data);
    } catch (error) {
      console.error('Failed to load shame content:', error);
      setContent({ title: 'Error Loading Content', content: 'Failed to fetch from Walrus' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpvote() {
    if (!account || upvoting) return;

    try {
      setUpvoting(true);
      const tx = createUpvoteTransaction(shame.id, MIN_UPVOTE_AMOUNT);

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: () => {
            console.log('Upvote successful');
            onUpvoteSuccess?.();
          },
          onError: (error) => {
            console.error('Upvote failed:', error);
            alert('Failed to upvote: ' + error.message);
          },
        }
      );
    } finally {
      setUpvoting(false);
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSUI = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(4);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{content?.title || 'Untitled'}</h3>
        
        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">{content?.content}</p>
        </div>

        {content?.images && content.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {content.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Shame image ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="font-mono">
                {shame.author.slice(0, 6)}...{shame.author.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(shame.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-semibold">
            <Coins className="w-4 h-4" />
            <span>{formatSUI(shame.totalBurnt)} SUI burnt</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-700 font-semibold">
              <ArrowUp className="w-5 h-5" />
              <span className="text-lg">{shame.upvoteCount}</span>
            </div>
            <span className="text-sm text-gray-500">upvotes</span>
          </div>

          <button
            onClick={handleUpvote}
            disabled={!account || upvoting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              account
                ? 'bg-gray-800 hover:bg-gray-900 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
            {upvoting ? 'Upvoting...' : 'Upvote (0.1 SUI burnt)'}
          </button>
        </div>
      </div>
    </div>
  );
}


