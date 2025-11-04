import { useState } from 'react';
import { X, Upload, Send } from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { uploadToWalrus, imageToBase64 } from '../utils/walrus';
import { createPublishTransaction } from '../utils/suiClient';
import { ShameContent } from '../types';

interface PublishFormProps {
  onClose: () => void;
  onPublishSuccess?: () => void;
}

const MIN_PUBLISH_AMOUNT = 1_000_000_000n; // 1 SUI

export function PublishForm({ onClose, onPublishSuccess }: PublishFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

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
      setUploadProgress('Uploading to Walrus...');

      // Prepare content
      const shameContent: ShameContent = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      };

      // Upload to Walrus
      const blobId = await uploadToWalrus(shameContent);
      
      setUploadProgress('Creating transaction...');

      // Create and execute transaction
      const tx = createPublishTransaction(blobId, MIN_PUBLISH_AMOUNT, account.address);

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: () => {
            setUploadProgress('');
            alert('Shame published successfully!');
            onPublishSuccess?.();
            onClose();
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            alert('Failed to publish shame: ' + error.message);
            setUploadProgress('');
          },
        }
      );
    } catch (error) {
      console.error('Error publishing shame:', error);
      alert('Failed to publish: ' + (error as Error).message);
      setUploadProgress('');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Publish Shame</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter shame title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              disabled={publishing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (Optional, max 4)
            </label>
            
            {images.length < 4 && (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-600 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-500" />
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
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent"></div>
              <span className="text-sm text-gray-700">{uploadProgress}</span>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Cost:</strong> 1 SUI to publish this shame (coins will be burnt)
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={publishing}
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!account || !title.trim() || !content.trim() || publishing}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              account && title.trim() && content.trim() && !publishing
                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}


