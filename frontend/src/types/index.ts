export interface ShameContent {
  title: string;
  content: string;
  images?: string[]; // Base64 encoded images or Walrus blob IDs
}

export interface Shame {
  id: string;
  title: string;
  blobId: string;
  sharedBlobId: string; // Sui object ID of the shared wrapper around the Walrus blob
  author: string;
  timestamp: number;
  upvoteCount: number;
  content?: ShameContent; // Loaded from Walrus
}


