export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 border border-gray-300 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">About</h1>
          <div className="space-y-4 text-gray-700">
            <p>
              Hall of Shame is a decentralized bulletin board built on the Sui blockchain and Walrus storage.
            </p>

            <p>
              Users can publish shames (posts) with titles, content, and images. All metadata is stored on-chain on Sui,
              while the full content (including images) lives on Walrus, a decentralized storage network.
            </p>

            <p>
              Publishing a shame requires paying two small costs: WAL to cover storage on Walrus for the content itself, and SUI
              for the transaction gas on the Sui blockchain. Beyond those, there are no platform fees.
            </p>

            <p>
              This is a demonstration of decentralized content publishing, combining the security and transparency of blockchain
              with efficient decentralized storage for media content.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Posting Guidelines</h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            <li>Connect your preferred Sui wallet to log in before submitting a shame.</li>
            <li>Each new shame is initially funded to persist for seven epochs.<sup className="ml-0.5 text-xs">1</sup></li>
            <li>Every upvote adds one additional epoch of persistence to the shame.</li>
          </ol>
          <p className="mt-3 text-sm text-gray-500 italic">
            1. Hall of Shame currently operates on Sui testnet, where one epoch is approximately one day.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Shames' Lifetime</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Walrus is not designed to be a permanent storage inherently, it could remove the content that has not incentivized to persist. So there needs some intervention to extend the content's existence on the network.
            </p>
            <p>
              Though this design might introduce extra complexity for developers, it perfectly fits the scenario of Hall Of Shame. We want genuine shames to be exposed and recorded permanently, we are afraid of persisting false accusation for good projects, companies or people by any chance.
              The pruning mechanism provides a way to naturally remove these negative traces when content lacks community support.
            </p>

            <p>
              Every newly posted shame will get a initial 7 epochs lifespan on Walrus, before it's expired and removed from the network, user can upvote the shame to extend its lifespan, each upvote extends the lifespan of the content by 1 epoch.
              This creates a community-driven curation system where the community decides what content deserves to persist: if a posted shame is accurate and relevant, people will continue to upvote it, keeping it visible for longer. If it's false or unfair, few people will upvote it, allowing it to be naturally removed over time.
            </p>

            <p>
              We acknowledge this is a preliminary, naive mechanism. While it roughly works as an initial framework, creating a truly just and fair platform requires significantly more work. We will keep improving this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

