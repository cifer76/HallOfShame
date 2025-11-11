import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Shame, ShameContent } from '../types';
import { fetchShameById, createUpvoteTransaction } from '../utils/suiClient';
import { fetchFromWalrus, getWalrusClient } from '../utils/walrus';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Toast } from './Toast';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      loadShame();
    }
  }, [id]);

  async function loadShame(withSpinner: boolean = true) {
    if (!id) return;

    try {
      if (withSpinner) {
        setLoading(true);
      }
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
      if (withSpinner) {
        setLoading(false);
      }
    }
  }

  async function handleUpvote() {
    if (!account || upvoting || !shame) return;
    if (!shame.sharedBlobId) {
      setToast({ message: 'Missing shared blob reference for this shame.', type: 'error' });
      return;
    }

    try {
      setUpvoting(true);

      const EXTENDED_EPOCHS_PER_UPVOTE = 1;
      const walrusClient = getWalrusClient();
      const tx = await createUpvoteTransaction(
        shame.id,
        shame.sharedBlobId,
        EXTENDED_EPOCHS_PER_UPVOTE,
        account.address,
      );

      await tx.prepareForSerialization({ client: walrusClient });
      await signAndExecute({ transaction: tx as any });
      setShame((prev) =>
        prev
          ? {
              ...prev,
              upvoteCount: prev.upvoteCount + 1,
            }
          : prev,
      );
      await loadShame(false);
      setToast({ message: 'Thanks! Your upvote extended this shame.', type: 'success' });
    } catch (error) {
      console.error('Upvote failed:', error);
      setToast({
        message: `Failed to upvote: ${(error as Error).message}`,
        type: 'error',
      });
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
       {toast && <Toast message={toast.message} type={toast.type} />}
       <div className="flex items-start gap-6">
         <div className="flex flex-col items-center gap-2">
           <button
             onClick={handleUpvote}
             disabled={!account || upvoting}
             className={`flex items-center justify-center h-14 w-14 rounded-full border transition-colors ${
               account
                 ? 'bg-red-800 hover:bg-red-900 text-white border-red-800'
                 : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
             }`}
             title={account ? 'Upvote' : 'Connect wallet to upvote'}
           >
             <ArrowUp className="w-6 h-6" />
           </button>
           <div className="text-xs text-gray-500 text-center w-16">{shame.upvoteCount} points</div>
         </div>
 
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 border border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {shame.title || content?.title || 'Untitled'}
            </h1>
            <div className="text-xs text-gray-500 text-right mb-8">{formatDate(shame.timestamp)}</div>

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
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 border border-gray-300 text-sm space-y-3">
              <div>
                <div className="text-gray-500 uppercase tracking-wide text-xs mb-1">• View Shame object on SuiVision</div>
                <a
                  className="text-red-800 hover:text-red-900 underline block truncate"
                  href={`https://testnet.suivision.xyz/object/${shame.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`https://testnet.suivision.xyz/object/${shame.id}`}
                >
                  {`https://testnet.suivision.xyz/object/${shame.id}`}
                </a>
              </div>
              <div>
                <div className="text-gray-500 uppercase tracking-wide text-xs mb-1">• View Blob on Walrus Explorer</div>
                <a
                  className="text-red-800 hover:text-red-900 underline block truncate"
                  href={`https://walruscan.com/testnet/blob/${shame.blobId}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`https://walruscan.com/testnet/blob/${shame.blobId}`}
                >
                  {`https://walruscan.com/testnet/blob/${shame.blobId}`}
                </a>
              </div>
            </div>
          </div>
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

