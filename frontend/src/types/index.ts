export interface ShameContent {
  title: string;
  content: string;
  images?: string[]; // Base64 encoded images or Walrus blob IDs
}

export interface Shame {
  id: string;
  blobId: string;
  author: string;
  timestamp: number;
  upvoteCount: number;
  totalBurnt: number;
  content?: ShameContent; // Loaded from Walrus
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


