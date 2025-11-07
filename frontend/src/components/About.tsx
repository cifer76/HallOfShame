export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 border border-gray-300">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">About</h1>
        
        <div className="space-y-4 text-gray-700">
          <p>
            Hall of Shame is a decentralized bulletin board built on Sui blockchain and Walrus storage.
          </p>
          
          <p>
            Users can publish shames (posts) with titles, content, and images. All metadata is stored on-chain on Sui,
            while the full content (including images) is stored on Walrus, a decentralized storage network.
          </p>
          
          <p>
            Each shame can be upvoted by other users. The platform is free to use - no payment is required to publish or upvote.
          </p>
          
          <p>
            This is a demonstration of decentralized content publishing, combining the security and transparency of blockchain
            with efficient decentralized storage for media content.
          </p>
        </div>
      </div>
    </div>
  );
}

