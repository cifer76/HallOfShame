module hall_of_shame::hall_of_shame {
    use sui::event;

    // Error codes
    const EInvalidBlobId: u64 = 1;
    const EInvalidTitle: u64 = 2;
    const EInvalidBlobObjectId: u64 = 3;

    // Shame struct - stores metadata on-chain
    public struct Shame has key, store {
        id: UID,
        title: vector<u8>,             // Shame title
        blob_id: vector<u8>,           // Walrus blob ID
        blob_object_id: vector<u8>,    // Walrus blob object ID (Sui object ID)
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
        blob_object_id: vector<u8>,
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

    // Publish a new shame (no payment required)
    public fun publish_shame(
        hall: &mut HallOfShame,
        title: vector<u8>,
        blob_id: vector<u8>,
        blob_object_id: vector<u8>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(vector::length(&title) > 0, EInvalidTitle);
        assert!(vector::length(&blob_id) > 0, EInvalidBlobId);
        assert!(vector::length(&blob_object_id) > 0, EInvalidBlobObjectId);

        // Create shame
        let shame_uid = object::new(ctx);
        let shame_id = object::uid_to_inner(&shame_uid);
        
        let shame = Shame {
            id: shame_uid,
            title,
            blob_id,
            blob_object_id,
            author: tx_context::sender(ctx),
            timestamp: sui::clock::timestamp_ms(clock),
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
            blob_object_id: shame.blob_object_id,
            timestamp: shame.timestamp,
        });

        // Share the shame object
        transfer::share_object(shame);
    }

    // Upvote an existing shame (no payment required)
    public fun upvote_shame(
        shame: &mut Shame,
        ctx: &mut TxContext
    ) {
        // Increment upvote count
        shame.upvote_count = shame.upvote_count + 1;

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

    public fun get_blob_object_id(shame: &Shame): vector<u8> {
        shame.blob_object_id
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





