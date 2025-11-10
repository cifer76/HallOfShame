export interface ShameContent {
  title: string;
  content: string;
  images?: string[]; // Base64 encoded images or Walrus blob IDs
}

export interface Shame {
  id: string;
  title: string;
  blobId: string;
  blobObjectId: string; // Sui object ID of the Walrus blob
  author: string;
  timestamp: number;
  upvoteCount: number;
  content?: ShameContent; // Loaded from Walrus
}


