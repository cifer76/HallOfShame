import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Send, X } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { createWalrusBlobFlow, imageToBase64 } from '../utils/walrus';
import { appendPublishShame } from '../utils/suiClient';
import { ShameContent } from '../types';

export function PublishPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      try {
        const base64 = await imageToBase64(files[i]);
        newImages.push(base64);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    setImages(prev => [...prev, ...newImages].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!account || !title.trim() || !content.trim() || publishing) return;

    try {
      setPublishing(true);
      setUploadProgress('Preparing Walrus blob...');

      const shameContent: ShameContent = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      };

      const { flow, epochs, walrusClient } = createWalrusBlobFlow(shameContent);

      await flow.encode();

      setUploadProgress('Registering blob (signature 1 of 2)...');
      const registerTx = flow.register({
        epochs,
        deletable: false,
        owner: account.address,
      });

      await registerTx.prepareForSerialization({ client: walrusClient });

      const registerResult = await signAndExecute({
        transaction: registerTx as any,
      });

      const registerDigest =
        (registerResult as any)?.digest ?? (registerResult as any)?.effects?.transactionDigest;
      if (!registerDigest) {
        throw new Error('Unable to retrieve digest from blob registration transaction');
      }

      setUploadProgress('Uploading blob data to Walrus...');
      await flow.upload({ digest: registerDigest });

      setUploadProgress('Certifying blob & publishing shame (signature 2 of 2)...');
      const certifyTx = flow.certify();
      const { blobId, blobObject } = await flow.getBlob();
      const blobObjectId = blobObject.id.id;

      appendPublishShame(certifyTx, title.trim(), blobId, blobObjectId, account.address);
      await certifyTx.prepareForSerialization({ client: walrusClient });

      await signAndExecute({
        transaction: certifyTx as any,
      });

      setUploadProgress('');
      alert('Shame published successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error publishing shame:', error);
      alert('Failed to publish: ' + (error as Error).message);
      setUploadProgress('');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white p-6 border border-gray-300">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Publish New Shame</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter shame title..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-red-700"
              maxLength={200}
              disabled={publishing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your shame..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-700 resize-none"
              disabled={publishing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (Optional, max 4)
            </label>
            
            {images.length < 4 && (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-red-700 cursor-pointer">
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={publishing}
                />
              </label>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-32 object-cover border border-gray-300"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100"
                      disabled={publishing}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent"></div>
              <span className="text-sm text-gray-700">{uploadProgress}</span>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-300 p-3">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Publishing is free - no payment required
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100"
              disabled={publishing}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={!account || !title.trim() || !content.trim() || publishing}
              className={`px-4 py-2 text-sm border ${
                account && title.trim() && content.trim() && !publishing
                  ? 'bg-red-800 hover:bg-red-900 text-white border-red-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
              }`}
            >
              <Send className="w-4 h-4 inline mr-1" />
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

