module hall_of_shame::hall_of_shame {
    use sui::{
        coin::Coin,
        clock,
        event,
    };
    use wal::wal::WAL;
    use walrus::{blob::Blob, system::System};

    // Error codes
    const EInvalidBlobId: u64 = 1;
    const EInvalidTitle: u64 = 2;
    const ESharedBlobMismatch: u64 = 3;

    /// Local wrapper around a Walrus `Blob` that can be extended by anyone.
    public struct SharedBlob has key, store {
        id: UID,
        blob: Blob,
    }

    // Shame struct - stores metadata on-chain
    public struct Shame has key, store {
        id: UID,
        title: vector<u8>,          // Shame title
        blob_id: vector<u8>,        // Walrus blob ID (content identifier)
        shared_blob_id: ID,         // Shared wrapper around the Walrus blob
        author: address,
        timestamp: u64,
        upvote_count: u64,
    }

    // Shared object that maintains all shames
    public struct HallOfShame has key {
        id: UID,
        shames: vector<ID>,
        total_shames: u64,
    }

    // Events
    public struct ShamePublished has copy, drop {
        shame_id: ID,
        author: address,
        title: vector<u8>,
        blob_id: vector<u8>,
        shared_blob_id: ID,
        timestamp: u64,
    }

    public struct ShameUpvoted has copy, drop {
        shame_id: ID,
        upvoter: address,
        new_upvote_count: u64,
    }

    // Initialize the shared HallOfShame object
    fun init(ctx: &mut TxContext) {
        let hall = HallOfShame {
            id: object::new(ctx),
            shames: vector::empty(),
            total_shames: 0,
        };
        transfer::share_object(hall);
    }

    // Publish a new shame. Wraps the provided Walrus blob inside a module-local SharedBlob so its
    // ID can be stored on-chain and extended later.
    public fun publish_shame(
        hall: &mut HallOfShame,
        title: vector<u8>,
        blob_id: vector<u8>,
        blob: Blob,
        clock: &clock::Clock,
        ctx: &mut TxContext,
    ) {
        // Validate inputs
        assert!(vector::length(&title) > 0, EInvalidTitle);
        assert!(vector::length(&blob_id) > 0, EInvalidBlobId);

        // Create and share the blob wrapper, capturing its ID for later use.
        let shared_blob_uid = object::new(ctx);
        let shared_blob_id = object::uid_to_inner(&shared_blob_uid);
        transfer::share_object(SharedBlob { id: shared_blob_uid, blob });

        // Create shame object
        let shame_uid = object::new(ctx);
        let shame_id = object::uid_to_inner(&shame_uid);

        let shame = Shame {
            id: shame_uid,
            title,
            blob_id,
            shared_blob_id,
            author: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
            upvote_count: 0,
        };

        // Add to hall
        vector::push_back(&mut hall.shames, shame_id);
        hall.total_shames = hall.total_shames + 1;

        // Emit event
        event::emit(ShamePublished {
            shame_id,
            author: tx_context::sender(ctx),
            title: shame.title,
            blob_id: shame.blob_id,
            shared_blob_id: shame.shared_blob_id,
            timestamp: shame.timestamp,
        });

        // Share the shame object
        transfer::share_object(shame);
    }

    // Upvote an existing shame (no payment required)
    public fun upvote_shame(
        shame: &mut Shame,
        shared_blob: &mut SharedBlob,
        system: &mut System,
        payment: &mut Coin<WAL>,
        extended_epochs: u32,
        ctx: &mut TxContext,
    ) {
        assert!(object::uid_to_inner(&shared_blob.id) == shame.shared_blob_id, ESharedBlobMismatch);

        // Increment upvote count
        shame.upvote_count = shame.upvote_count + 1;

        // Extend blob lifetime using the supplied WAL payment.
        system.extend_blob(&mut shared_blob.blob, extended_epochs, payment);

        // Emit event
        event::emit(ShameUpvoted {
            shame_id: object::uid_to_inner(&shame.id),
            upvoter: tx_context::sender(ctx),
            new_upvote_count: shame.upvote_count,
        });
    }

    // View functions
    public fun get_title(shame: &Shame): vector<u8> {
        shame.title
    }

    public fun get_blob_id(shame: &Shame): vector<u8> {
        shame.blob_id
    }

    public fun get_shared_blob_id(shame: &Shame): ID {
        shame.shared_blob_id
    }

    public fun get_author(shame: &Shame): address {
        shame.author
    }

    public fun get_timestamp(shame: &Shame): u64 {
        shame.timestamp
    }

    public fun get_upvote_count(shame: &Shame): u64 {
        shame.upvote_count
    }

    public fun get_total_shames(hall: &HallOfShame): u64 {
        hall.total_shames
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}





