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
            Publishing a shame requires paying two small costs: WAL to cover storage on Walrus for the content itself, and SUI
            for the transaction gas on the Sui blockchain. Beyond those, there are no extra platform fees.
          </p>

          <p>
            Content is written with Walrus&apos; maximum retention window (53 epochs), so every shame will eventually expire.
            To keep a post alive past that point you currently need to extend the blob through another Walrus-compatible tool.
            Support for extending storage directly from this site is on the roadmap.
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

