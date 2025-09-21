// PayWiser Token - NTT compatible token for Wormhole
module paywiser_token::paywiser_token {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::event;

    /// The type identifier of PayWiser token
    struct PAYWISER_TOKEN has drop {}

    /// Token metadata and configuration
    struct TokenInfo has key, store {
        id: UID,
        name: vector<u8>,
        symbol: vector<u8>,
        description: vector<u8>,
        icon_url: vector<u8>,
        decimals: u8,
        total_supply: u64,
        max_supply: u64,
    }

    /// Capability for minting tokens (only owner can mint)
    struct MintCap has key, store {
        id: UID,
    }

    /// Event emitted when tokens are minted
    struct TokenMinted has copy, drop {
        amount: u64,
        recipient: address,
    }

    /// Event emitted when tokens are burned
    struct TokenBurned has copy, drop {
        amount: u64,
        burner: address,
    }

    /// Module initializer - called when the module is published
    fun init(witness: PAYWISER_TOKEN, ctx: &mut TxContext) {
        // Create the currency with initial metadata
        let (treasury_cap, metadata) = coin::create_currency<PAYWISER_TOKEN>(
            witness,
            8, // decimals
            b"PWSR", // symbol
            b"PayWiser Token", // name
            b"The native token for PayWiser ecosystem - enabling face recognition payments and cross-chain transfers via Wormhole NTT", // description
            option::some(sui::url::new_unsafe_from_bytes(b"https://paywiser.com/token-icon.png")), // icon URL
            ctx
        );

        // Create token info object
        let token_info = TokenInfo {
            id: object::new(ctx),
            name: b"PayWiser Token",
            symbol: b"PWSR",
            description: b"The native token for PayWiser ecosystem - enabling face recognition payments and cross-chain transfers via Wormhole NTT",
            icon_url: b"https://paywiser.com/token-icon.png",
            decimals: 8,
            total_supply: 0,
            max_supply: 1000000000000000, // 10 million tokens with 8 decimals
        };

        // Create mint capability
        let mint_cap = MintCap {
            id: object::new(ctx),
        };

        // Transfer ownership to deployer
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_transfer(mint_cap, tx_context::sender(ctx));
        transfer::share_object(token_info);
        transfer::public_freeze_object(metadata);
    }

    /// Mint new tokens (only treasury cap holder can call)
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<PAYWISER_TOKEN>,
        token_info: &mut TokenInfo,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Check max supply constraint
        assert!(token_info.total_supply + amount <= token_info.max_supply, 0);
        
        // Mint the tokens
        let coin = coin::mint(treasury_cap, amount, ctx);
        
        // Update total supply
        token_info.total_supply = token_info.total_supply + amount;
        
        // Emit event
        event::emit(TokenMinted {
            amount,
            recipient,
        });
        
        // Transfer to recipient
        transfer::public_transfer(coin, recipient);
    }

    /// Burn tokens (anyone can burn their own tokens)
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<PAYWISER_TOKEN>,
        token_info: &mut TokenInfo,
        coin: Coin<PAYWISER_TOKEN>,
        ctx: &TxContext
    ) {
        let amount = coin::value(&coin);
        
        // Burn the tokens
        coin::burn(treasury_cap, coin);
        
        // Update total supply
        token_info.total_supply = token_info.total_supply - amount;
        
        // Emit event
        event::emit(TokenBurned {
            amount,
            burner: tx_context::sender(ctx),
        });
    }

    /// Get token information
    public fun get_token_info(token_info: &TokenInfo): (vector<u8>, vector<u8>, u8, u64, u64) {
        (token_info.name, token_info.symbol, token_info.decimals, token_info.total_supply, token_info.max_supply)
    }

    /// Mint tokens for NTT bridging (special function for Wormhole)
    public fun mint_for_ntt(
        treasury_cap: &mut TreasuryCap<PAYWISER_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<PAYWISER_TOKEN> {
        coin::mint(treasury_cap, amount, ctx)
    }

    /// Burn tokens for NTT bridging (special function for Wormhole)
    public fun burn_for_ntt(
        treasury_cap: &mut TreasuryCap<PAYWISER_TOKEN>,
        coin: Coin<PAYWISER_TOKEN>
    ): u64 {
        let amount = coin::value(&coin);
        coin::burn(treasury_cap, coin);
        amount
    }

    /// Create a zero-value coin (useful for testing)
    public fun zero(ctx: &mut TxContext): Coin<PAYWISER_TOKEN> {
        coin::zero<PAYWISER_TOKEN>(ctx)
    }

    /// Join two coins
    public entry fun join(coin1: &mut Coin<PAYWISER_TOKEN>, coin2: Coin<PAYWISER_TOKEN>) {
        coin::join(coin1, coin2);
    }

    /// Split a coin
    public entry fun split(
        coin: &mut Coin<PAYWISER_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let split_coin = coin::split(coin, amount, ctx);
        transfer::public_transfer(split_coin, recipient);
    }

    #[test_only]
    /// Test helper function
    public fun init_for_testing(ctx: &mut TxContext) {
        init(PAYWISER_TOKEN {}, ctx);
    }
}

