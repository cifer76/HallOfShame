import { ShameContent, WalrusUploadResponse } from '../types';

const WALRUS_PUBLISHER_URL = import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

/**
 * Upload shame content to Walrus
 */
export async function uploadToWalrus(content: ShameContent): Promise<string> {
  try {
    const jsonData = JSON.stringify(content);
    const blob = new Blob([jsonData], { type: 'application/json' });

    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/blobs`, {
      method: 'PUT',
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.statusText}`);
    }

    const result: WalrusUploadResponse = await response.json();
    
    // Extract blob ID from response
    const blobId = result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;
    
    if (!blobId) {
      throw new Error('No blob ID returned from Walrus');
    }

    return blobId;
  } catch (error) {
    console.error('Error uploading to Walrus:', error);
    throw error;
  }
}

/**
 * Fetch shame content from Walrus
 */
export async function fetchFromWalrus(blobId: string): Promise<ShameContent> {
  try {
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/${blobId}`);

    if (!response.ok) {
      throw new Error(`Walrus fetch failed: ${response.statusText}`);
    }

    const content: ShameContent = await response.json();
    return content;
  } catch (error) {
    console.error('Error fetching from Walrus:', error);
    throw error;
  }
}

/**
 * Compress and convert image to base64
 */
export async function imageToBase64(file: File, maxWidth: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


