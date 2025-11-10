import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Shame } from '../types';

const SUI_NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';
const SUI_RPC_URL = import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';
const HALL_OF_SHAME_ID = import.meta.env.VITE_HALL_OF_SHAME_ID || '';

export const suiClient = new SuiClient({ url: SUI_RPC_URL });

export function appendPublishShame(
  tx: Transaction,
  title: string,
  blobId: string,
  blobObjectId: string,
  sender: string,
) {
  tx.setSenderIfNotSet(sender);

  tx.moveCall({
    target: `${PACKAGE_ID}::hall_of_shame::publish_shame`,
    arguments: [
      tx.object(HALL_OF_SHAME_ID),
      tx.pure.string(title),
      tx.pure.string(blobId),
      tx.object(blobObjectId),
      tx.object('0x6'),
    ],
  });

  return tx;
}

export function createPublishTransaction(
  title: string,
  blobId: string,
  blobObjectId: string,
  sender: string,
): Transaction {
  const tx = new Transaction();
  return appendPublishShame(tx, title, blobId, blobObjectId, sender);
}

/**
 * Create transaction to upvote a shame (no payment required)
 */
export function createUpvoteTransaction(
  shameId: string,
  sender: string,
): Transaction {
  const tx = new Transaction();
  tx.setSenderIfNotSet(sender);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::hall_of_shame::upvote_shame`,
    arguments: [
      tx.object(shameId),
    ],
  });

  return tx;
}

/**
 * Parse shame object from Sui response
 */
export function parseShame(obj: SuiObjectResponse): Shame | null {
  if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
    return null;
  }

  const fields = obj.data.content.fields as any;
  
  // Handle title - may not exist for old shames
  let title = '';
  if (fields.title) {
    title = bytesToString(fields.title);
  } else {
    // Fallback for old shames without title
    title = 'Untitled';
  }
  
  const blobId = bytesToString(fields.blob_id);
  const blobObjectId =
    typeof fields.blob_object_id === 'string'
      ? fields.blob_object_id
      : fields.blob_object_id
      ? bytesToString(fields.blob_object_id)
      : '';

  return {
    id: obj.data.objectId,
    title,
    blobId,
    blobObjectId,
    author: fields.author,
    timestamp: Number(fields.timestamp),
    upvoteCount: Number(fields.upvote_count),
  };
}

/**
 * Fetch all shames
 */
export async function fetchShames(): Promise<Shame[]> {
  try {
    if (!PACKAGE_ID) {
      return [];
    }

    // Query ShamePublished events to get all shame IDs
    const events = await suiClient.queryEvents({
      query: {
        MoveModule: {
          package: PACKAGE_ID,
          module: 'hall_of_shame',
        },
      },
      limit: 1000, // Adjust as needed
    });

    const shameIds: string[] = [];
    for (const event of events.data) {
      if (event.parsedJson && typeof event.parsedJson === 'object' && 'shame_id' in event.parsedJson) {
        const shameId = (event.parsedJson as any).shame_id;
        if (shameId && typeof shameId === 'string') {
          shameIds.push(shameId);
        }
      }
    }

    // Remove duplicates
    const uniqueShameIds = Array.from(new Set(shameIds));

    if (uniqueShameIds.length === 0) {
      return [];
    }

    // Fetch all shame objects
    const objects = await suiClient.multiGetObjects({
      ids: uniqueShameIds,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const shames: Shame[] = [];
    for (const obj of objects) {
      const shame = parseShame(obj);
      if (shame) {
        shames.push(shame);
      }
    }

    // Sort by upvotes (descending), then by timestamp (newest first)
    shames.sort((a, b) => {
      if (b.upvoteCount !== a.upvoteCount) {
        return b.upvoteCount - a.upvoteCount;
      }
      return b.timestamp - a.timestamp;
    });

    return shames;
  } catch (error) {
    console.error('Error fetching shames:', error);
    return [];
  }
}

/**
 * Fetch a single shame by ID
 */
export async function fetchShameById(shameId: string): Promise<Shame | null> {
  try {
    const obj = await suiClient.getObject({
      id: shameId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    return parseShame(obj);
  } catch (error) {
    console.error('Error fetching shame by ID:', error);
    return null;
  }
}

/**
 * Fetch dynamic fields to get shames from HallOfShame
 */
export async function fetchShamesFromHall(): Promise<string[]> {
  try {
    if (!HALL_OF_SHAME_ID) {
      return [];
    }

    const response = await suiClient.getDynamicFields({
      parentId: HALL_OF_SHAME_ID,
    });

    return response.data.map(field => field.objectId);
  } catch (error) {
    console.error('Error fetching shame IDs:', error);
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


