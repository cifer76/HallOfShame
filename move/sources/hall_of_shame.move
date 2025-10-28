module hall_of_shame::hall_of_shame {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;

    // Error codes
    const EInsufficientPayment: u64 = 1;
    const ERevelationNotFound: u64 = 2;
    const EInvalidBlobId: u64 = 3;

    // Minimum payment amounts (in MIST/smallest unit)
    const MIN_PUBLISH_AMOUNT: u64 = 1_000_000_000; // 1 SUI (using SUI as example, replace with WAL)
    const MIN_UPVOTE_AMOUNT: u64 = 100_000_000;    // 0.1 SUI

    // Revelation struct - stores metadata on-chain
    public struct Revelation has key, store {
        id: UID,
        blob_id: vector<u8>,           // Walrus blob ID
        author: address,
        timestamp: u64,
        upvote_count: u64,
        total_value_locked: Balance<SUI>,  // Accumulated payment from upvotes
    }

    // Shared object that maintains all revelations
    public struct HallOfShame has key {
        id: UID,
        revelations: vector<ID>,
        total_revelations: u64,
    }

    // Events
    public struct RevelationPublished has copy, drop {
        revelation_id: ID,
        author: address,
        blob_id: vector<u8>,
        timestamp: u64,
        amount_paid: u64,
    }

    public struct RevelationUpvoted has copy, drop {
        revelation_id: ID,
        upvoter: address,
        amount_paid: u64,
        new_upvote_count: u64,
        new_total_value: u64,
    }

    // Initialize the shared HallOfShame object
    fun init(ctx: &mut TxContext) {
        let hall = HallOfShame {
            id: object::new(ctx),
            revelations: vector::empty(),
            total_revelations: 0,
        };
        transfer::share_object(hall);
    }

    // Publish a new revelation
    public entry fun publish_revelation(
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

        // Create revelation
        let revelation_uid = object::new(ctx);
        let revelation_id = object::uid_to_inner(&revelation_uid);
        
        let revelation = Revelation {
            id: revelation_uid,
            blob_id,
            author: tx_context::sender(ctx),
            timestamp: sui::clock::timestamp_ms(clock),
            upvote_count: 0,
            total_value_locked: coin::into_balance(payment),
        };

        // Add to hall
        vector::push_back(&mut hall.revelations, revelation_id);
        hall.total_revelations = hall.total_revelations + 1;

        // Emit event
        event::emit(RevelationPublished {
            revelation_id,
            author: tx_context::sender(ctx),
            blob_id: revelation.blob_id,
            timestamp: revelation.timestamp,
            amount_paid: amount,
        });

        // Share the revelation object
        transfer::share_object(revelation);
    }

    // Upvote an existing revelation
    public entry fun upvote_revelation(
        revelation: &mut Revelation,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Validate payment
        let amount = coin::value(&payment);
        assert!(amount >= MIN_UPVOTE_AMOUNT, EInsufficientPayment);

        // Add payment to revelation's total value locked
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut revelation.total_value_locked, payment_balance);

        // Increment upvote count
        revelation.upvote_count = revelation.upvote_count + 1;

        // Emit event
        event::emit(RevelationUpvoted {
            revelation_id: object::uid_to_inner(&revelation.id),
            upvoter: tx_context::sender(ctx),
            amount_paid: amount,
            new_upvote_count: revelation.upvote_count,
            new_total_value: balance::value(&revelation.total_value_locked),
        });
    }

    // View functions
    public fun get_blob_id(revelation: &Revelation): vector<u8> {
        revelation.blob_id
    }

    public fun get_author(revelation: &Revelation): address {
        revelation.author
    }

    public fun get_timestamp(revelation: &Revelation): u64 {
        revelation.timestamp
    }

    public fun get_upvote_count(revelation: &Revelation): u64 {
        revelation.upvote_count
    }

    public fun get_total_value_locked(revelation: &Revelation): u64 {
        balance::value(&revelation.total_value_locked)
    }

    public fun get_total_revelations(hall: &HallOfShame): u64 {
        hall.total_revelations
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}





