import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Shame, ShameContent } from '../types';
import { fetchShameById, createUpvoteTransaction } from '../utils/suiClient';
//import { appendExtendWalrusBlob, fetchFromWalrus, getWalrusClient } from '../utils/walrus';
import { fetchFromWalrus } from '../utils/walrus';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

export function ShameDetail() {
  const { id } = useParams<{ id: string }>();
  const [shame, setShame] = useState<Shame | null>(null);
  const [content, setContent] = useState<ShameContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (id) {
      loadShame();
    }
  }, [id]);

  async function loadShame() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const shameData = await fetchShameById(id);
      if (!shameData) {
        setError('Shame not found');
        return;
      }

      setShame(shameData);

      // Load content from Walrus
      const contentData = await fetchFromWalrus(shameData.blobId);
      setContent(contentData);
    } catch (err) {
      console.error('Failed to load shame:', err);
      setError('Failed to load shame');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpvote() {
    if (!account || upvoting || !shame) return;

    try {
      setUpvoting(true);

      const tx = createUpvoteTransaction(shame.id, account.address);
      //const walrusClient = getWalrusClient();

      //tx.setGasBudgetIfNotSet(50_000_000n); // 50M MIST = 0.05 SUI
      //await appendExtendWalrusBlob(tx, shame.blobObjectId, 1);

      // Prepare transaction with client before walrus extension (needed for coin balance resolution)
      // The walrus extension resolves coin balances during its call, so client must be available
      //await tx.prepareForSerialization({ client: walrusClient });

      await signAndExecute({ transaction: tx as any });
      await loadShame();
    } catch (error) {
      console.error('Upvote failed:', error);
      alert('Failed to upvote: ' + (error as Error).message);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-6 border border-gray-300">
          <div className="h-6 bg-gray-200 w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 w-full mb-2"></div>
          <div className="h-4 bg-gray-200 w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !shame) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-6 border border-gray-300">
          <p className="text-gray-700">{error || 'Shame not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 border border-gray-300">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">{shame.title || content?.title || 'Untitled'}</h1>
        
        <div className="mb-4 text-sm text-gray-600">
          <span>{shame.upvoteCount} points</span>
          <span className="mx-2">|</span>
          <span>{formatDate(shame.timestamp)}</span>
        </div>

        <div className="mb-6 text-gray-700 whitespace-pre-wrap">{content?.content}</div>

        {content?.images && content.images.length > 0 && (
          <div
            className={`mb-6 grid gap-4 ${
              content.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {content.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Shame image ${idx + 1}`}
                className="w-full border border-gray-300 object-cover cursor-pointer"
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-gray-300">
          <button
            onClick={handleUpvote}
            disabled={!account || upvoting}
            className={`px-3 py-1 text-sm border ${
              account
                ? 'bg-red-800 hover:bg-red-900 text-white border-red-800'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
            }`}
          >
            <ArrowUp className="w-4 h-4 inline mr-1" />
            {upvoting ? 'Upvoting...' : 'Upvote'}
          </button>
        </div>
      </div>
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <img
            src={selectedImage}
            alt="Shame full view"
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

