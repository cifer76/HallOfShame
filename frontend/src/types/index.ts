export interface RevelationContent {
  title: string;
  content: string;
  images?: string[]; // Base64 encoded images or Walrus blob IDs
}

export interface Revelation {
  id: string;
  blobId: string;
  author: string;
  timestamp: number;
  upvoteCount: number;
  totalValueLocked: number;
  content?: RevelationContent; // Loaded from Walrus
}

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      blobId: string;
    };
  };
  alreadyCertified?: {
    blobId: string;
  };
}


