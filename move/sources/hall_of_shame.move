module hall_of_shame::hall_of_shame {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use sui::object;
    use sui::transfer;
    use sui::tx_context;

    // Error codes
    const EInsufficientPayment: u64 = 1;
    const EShameNotFound: u64 = 2;
    const EInvalidBlobId: u64 = 3;

    // Minimum payment amounts (in MIST/smallest unit)
    const MIN_PUBLISH_AMOUNT: u64 = 1_000_000_000; // 1 SUI (using SUI as example, replace with WAL)
    const MIN_UPVOTE_AMOUNT: u64 = 100_000_000;    // 0.1 SUI

    // Shame struct - stores metadata on-chain
    public struct Shame has key, store {
        id: UID,
        blob_id: vector<u8>,           // Walrus blob ID
        author: address,
        timestamp: u64,
        upvote_count: u64,
        total_burnt: u64,  // Total amount of coins burnt (for display purposes)
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
        blob_id: vector<u8>,
        timestamp: u64,
        amount_paid: u64,
    }

    public struct ShameUpvoted has copy, drop {
        shame_id: ID,
        upvoter: address,
        amount_paid: u64,
        new_upvote_count: u64,
        new_total_burnt: u64,
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

    // Publish a new shame
    public entry fun publish_shame(
        hall: &mut HallOfShame,
        blob_id: vector<u8>,
        payment: Coin<SUI>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Validate payment
        let amount = coin::value(&payment);
        assert!(amount >= MIN_PUBLISH_AMOUNT, EInsufficientPayment);
        assert!(vector::length(&blob_id) > 0, EInvalidBlobId);

        // Burn the payment by converting to Balance and dropping it
        // This removes the coins from circulation
        let payment_balance = coin::into_balance(payment);
        drop(payment_balance);

        // Create shame
        let shame_uid = object::new(ctx);
        let shame_id = object::uid_to_inner(&shame_uid);
        
        let shame = Shame {
            id: shame_uid,
            blob_id,
            author: tx_context::sender(ctx),
            timestamp: sui::clock::timestamp_ms(clock),
            upvote_count: 0,
            total_burnt: amount,
        };

        // Add to hall
        vector::push_back(&mut hall.shames, shame_id);
        hall.total_shames = hall.total_shames + 1;

        // Emit event
        event::emit(ShamePublished {
            shame_id,
            author: tx_context::sender(ctx),
            blob_id: shame.blob_id,
            timestamp: shame.timestamp,
            amount_paid: amount,
        });

        // Share the shame object
        transfer::share_object(shame);
    }

    // Upvote an existing shame
    public entry fun upvote_shame(
        shame: &mut Shame,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Validate payment
        let amount = coin::value(&payment);
        assert!(amount >= MIN_UPVOTE_AMOUNT, EInsufficientPayment);

        // Burn the payment by converting to Balance and dropping it
        // This removes the coins from circulation
        let payment_balance = coin::into_balance(payment);
        drop(payment_balance);

        // Update total burnt amount
        shame.total_burnt = shame.total_burnt + amount;

        // Increment upvote count
        shame.upvote_count = shame.upvote_count + 1;

        // Emit event
        event::emit(ShameUpvoted {
            shame_id: object::uid_to_inner(&shame.id),
            upvoter: tx_context::sender(ctx),
            amount_paid: amount,
            new_upvote_count: shame.upvote_count,
            new_total_burnt: shame.total_burnt,
        });
    }

    // View functions
    public fun get_blob_id(shame: &Shame): vector<u8> {
        shame.blob_id
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

    public fun get_total_burnt(shame: &Shame): u64 {
        shame.total_burnt
    }

    public fun get_total_shames(hall: &HallOfShame): u64 {
        hall.total_shames
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}





