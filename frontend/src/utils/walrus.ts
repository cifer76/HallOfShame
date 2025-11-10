import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { walrus, WalrusClient } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

import { ShameContent } from '../types';

const WALRUS_AGGREGATOR_URL =
  import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
const WALRUS_UPLOAD_RELAY_URL =
  import.meta.env.VITE_WALRUS_UPLOAD_RELAY_URL || 'https://upload-relay.testnet.walrus.space';
const WALRUS_UPLOAD_RELAY_ENABLED =
  (import.meta.env.VITE_WALRUS_UPLOAD_RELAY_ENABLED || 'false').toLowerCase() === 'true';
export const WALRUS_MAX_STORAGE_EPOCHS = 53;
const REQUESTED_STORAGE_EPOCHS = Number(import.meta.env.VITE_WALRUS_STORAGE_EPOCHS);
export const WALRUS_STORAGE_EPOCHS =
  Number.isFinite(REQUESTED_STORAGE_EPOCHS) && REQUESTED_STORAGE_EPOCHS > 0
    ? Math.min(REQUESTED_STORAGE_EPOCHS, WALRUS_MAX_STORAGE_EPOCHS)
    : WALRUS_MAX_STORAGE_EPOCHS;

const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const SUI_RPC_URL = import.meta.env.VITE_SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK);

type WalrusExtendedClient = SuiClient & { walrus: WalrusClient };

let cachedWalrusClient: WalrusExtendedClient | null = null;

function createWalrusClient(): WalrusExtendedClient {
  const extensionOptions = WALRUS_UPLOAD_RELAY_ENABLED
    ? {
        uploadRelay: {
          host: WALRUS_UPLOAD_RELAY_URL,
        },
      }
    : {};

  return new SuiClient({ url: SUI_RPC_URL, network: SUI_NETWORK }).$extend(
    walrus({
      wasmUrl: walrusWasmUrl,
      ...extensionOptions,
    }),
  ) as WalrusExtendedClient;
}

export function getWalrusClient(): WalrusExtendedClient {
  if (!cachedWalrusClient) {
    cachedWalrusClient = createWalrusClient();
  }

  return cachedWalrusClient;
}

export function createWalrusBlobFlow(content: ShameContent) {
  const walrusClient = getWalrusClient();
  const encoded = new TextEncoder().encode(JSON.stringify(content));
  const flow = walrusClient.walrus.writeBlobFlow({ blob: encoded });

  return {
    walrusClient,
    flow,
    encoded,
    epochs: WALRUS_STORAGE_EPOCHS,
  };
}

export async function appendExtendWalrusBlob(
  tx: Transaction,
  blobObjectId: string,
  epochs: number = 1,
) {
  const walrusClient = getWalrusClient();
  await walrusClient.walrus.extendBlob({ blobObjectId, epochs })(tx);
}

export async function fetchFromWalrus(blobId: string): Promise<ShameContent> {
  try {
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);

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


