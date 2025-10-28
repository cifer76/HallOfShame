#[test_only]
module hall_of_shame::hall_of_shame_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use hall_of_shame::hall_of_shame::{Self, HallOfShame, Revelation};

    const ADMIN: address = @0xAD;
    const USER1: address = @0xB1;
    const USER2: address = @0xB2;

    fun setup_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        {
            hall_of_shame::init_for_testing(ts::ctx(&mut scenario));
            clock::create_for_testing(ts::ctx(&mut scenario));
        };
        scenario
    }

    #[test]
    fun test_publish_revelation() {
        let mut scenario = setup_test();
        
        // User1 publishes a revelation
        ts::next_tx(&mut scenario, USER1);
        {
            let mut hall = ts::take_shared<HallOfShame>(&scenario);
            let clock = ts::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1_000_000_000, ts::ctx(&mut scenario));
            let blob_id = b"test_blob_id_12345";

            hall_of_shame::publish_revelation(
                &mut hall,
                blob_id,
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            assert!(hall_of_shame::get_total_revelations(&hall) == 1, 0);

            ts::return_shared(hall);
            ts::return_shared(clock);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_upvote_revelation() {
        let mut scenario = setup_test();
        
        // User1 publishes a revelation
        ts::next_tx(&mut scenario, USER1);
        {
            let mut hall = ts::take_shared<HallOfShame>(&scenario);
            let clock = ts::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1_000_000_000, ts::ctx(&mut scenario));
            let blob_id = b"test_blob_id_12345";

            hall_of_shame::publish_revelation(
                &mut hall,
                blob_id,
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(hall);
            ts::return_shared(clock);
        };

        // User2 upvotes the revelation
        ts::next_tx(&mut scenario, USER2);
        {
            let mut revelation = ts::take_shared<Revelation>(&scenario);
            let payment = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));

            let initial_count = hall_of_shame::get_upvote_count(&revelation);
            
            hall_of_shame::upvote_revelation(
                &mut revelation,
                payment,
                ts::ctx(&mut scenario)
            );

            assert!(hall_of_shame::get_upvote_count(&revelation) == initial_count + 1, 0);
            assert!(hall_of_shame::get_total_value_locked(&revelation) == 1_100_000_000, 1);

            ts::return_shared(revelation);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = hall_of_shame::hall_of_shame::EInsufficientPayment)]
    fun test_publish_with_insufficient_payment() {
        let mut scenario = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut hall = ts::take_shared<HallOfShame>(&scenario);
            let clock = ts::take_shared<Clock>(&scenario);
            let payment = coin::mint_for_testing<SUI>(100, ts::ctx(&mut scenario)); // Too low
            let blob_id = b"test_blob_id";

            hall_of_shame::publish_revelation(
                &mut hall,
                blob_id,
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(hall);
            ts::return_shared(clock);
        };

        ts::end(scenario);
    }
}





