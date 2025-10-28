import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Revelation } from '../types';

const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';
const SUI_RPC_URL = import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';
const HALL_OF_SHAME_ID = import.meta.env.VITE_HALL_OF_SHAME_ID || '';

export const suiClient = new SuiClient({ url: SUI_RPC_URL });

/**
 * Create transaction to publish a revelation
 */
export function createPublishTransaction(
  blobId: string,
  paymentAmount: bigint,
  walletAddress: string
): Transaction {
  const tx = new Transaction();
  
  // Split coin for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [paymentAmount]);
  
  // Get clock object
  tx.moveCall({
    target: `${PACKAGE_ID}::hall_of_shame::publish_revelation`,
    arguments: [
      tx.object(HALL_OF_SHAME_ID),
      tx.pure.string(blobId),
      paymentCoin,
      tx.object('0x6'), // Clock object
    ],
  });

  return tx;
}

/**
 * Create transaction to upvote a revelation
 */
export function createUpvoteTransaction(
  revelationId: string,
  paymentAmount: bigint
): Transaction {
  const tx = new Transaction();
  
  // Split coin for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [paymentAmount]);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::hall_of_shame::upvote_revelation`,
    arguments: [
      tx.object(revelationId),
      paymentCoin,
    ],
  });

  return tx;
}

/**
 * Parse revelation object from Sui response
 */
export function parseRevelation(obj: SuiObjectResponse): Revelation | null {
  if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
    return null;
  }

  const fields = obj.data.content.fields as any;
  
  return {
    id: obj.data.objectId,
    blobId: bytesToString(fields.blob_id),
    author: fields.author,
    timestamp: Number(fields.timestamp),
    upvoteCount: Number(fields.upvote_count),
    totalValueLocked: Number(fields.total_value_locked),
  };
}

/**
 * Fetch all revelations
 */
export async function fetchRevelations(): Promise<Revelation[]> {
  try {
    // Query all Revelation objects
    const response = await suiClient.getOwnedObjects({
      owner: HALL_OF_SHAME_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const revelations: Revelation[] = [];
    
    for (const obj of response.data) {
      const revelation = parseRevelation(obj);
      if (revelation) {
        revelations.push(revelation);
      }
    }

    // Sort by upvotes (descending), then by timestamp (newest first)
    revelations.sort((a, b) => {
      if (b.upvoteCount !== a.upvoteCount) {
        return b.upvoteCount - a.upvoteCount;
      }
      return b.timestamp - a.timestamp;
    });

    return revelations;
  } catch (error) {
    console.error('Error fetching revelations:', error);
    return [];
  }
}

/**
 * Fetch dynamic fields to get revelations from HallOfShame
 */
export async function fetchRevelationsFromHall(): Promise<string[]> {
  try {
    if (!HALL_OF_SHAME_ID) {
      return [];
    }

    const response = await suiClient.getDynamicFields({
      parentId: HALL_OF_SHAME_ID,
    });

    return response.data.map(field => field.objectId);
  } catch (error) {
    console.error('Error fetching revelation IDs:', error);
    return [];
  }
}

/**
 * Helper to convert bytes to string
 */
function bytesToString(bytes: number[] | Uint8Array): string {
  if (Array.isArray(bytes)) {
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Helper to get network configuration
 */
export function getNetworkConfig() {
  return {
    network: SUI_NETWORK,
    rpcUrl: SUI_RPC_URL,
    packageId: PACKAGE_ID,
    hallOfShameId: HALL_OF_SHAME_ID,
  };
}


