# DeFi Protocol Data Collection TODO

This document outlines the exact data needed to make our DeFi position scanning adapters accurate. Currently, all protocol-specific adapters return 0 positions because they're using guessed resource patterns and field names.

## Current Problem

Our adapters are scanning for resources like:

```typescript
// These are WRONG - just pattern guesses
r.type.includes('::lending::');
r.type.includes('::pool::');
r.type.includes('::farming::');
```

And accessing fields like:

```typescript
// These are assumptions
resource.data.supplied_amount;
resource.data.borrowed_amount;
resource.data.lp_tokens;
```

## Required Data for Each Protocol

### **1. Thala (DEX & Farming)**

**Status**: 🔍 PARTIALLY DISCOVERED

```typescript
// LP Token - DISCOVERED FROM INDEXER ✅
- THALA-LP Token: "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d"

// Entry Functions - DISCOVERED FROM INDEXER ✅
- coin_wrapper::add_liquidity_weighted (at 0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5)

// Creator Address - DISCOVERED FROM INDEXER ✅
- LP Creator: "0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5"

// Storage Patterns - DISCOVERED FROM INDEXER ✅
- LP Storage: "0x896a3e42805ab36d86ad26d10ad1f1bf4e38ad2c088ae9047f023389db638344"

// STILL NEED TO DISCOVER 🔍
- Stable Pool: "0x[ADDRESS]::stable_pool::StablePool<...>"
- Weighted Pool: "0x[ADDRESS]::weighted_pool::WeightedPool<...>"
- Farm Position: "0x[ADDRESS]::farming::UserStake"
- Data Structure Fields
```

### **2. LiquidSwap (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Liquidity Pool: "0x[ADDRESS]::liquidity_pool::LiquidityPool<...>"
- LP Token: "0x[ADDRESS]::lp_coin::LP<...>"
- User Position: "0x[ADDRESS]::scripts::UserLiquidity"

// Data Structure Fields
- pool.data.coin_a_reserves
- pool.data.coin_b_reserves
- pool.data.lp_supply
- position.data.lp_amount

// Contract Addresses
- Router V2: "0x..."
- Pool Registry: "0x..."
```

### **3. PancakeSwap (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Pair: "0x[ADDRESS]::swap::PairInfo<...>"
- LP Token: "0x[ADDRESS]::swap::LPToken<...>"
- MasterChef Position: "0x[ADDRESS]::masterchef::UserInfo"
- CAKE Staking: "0x[ADDRESS]::cake_pool::UserInfo"

// Data Structure Fields
- pair.data.reserve_x
- pair.data.reserve_y
- pair.data.lp_supply
- masterchef.data.amount
- masterchef.data.reward_debt

// Contract Addresses
- Factory: "0x..."
- Router: "0x..."
- MasterChef: "0x..."
- CAKE Token: "0x..."
- CAKE Pool: "0x..."
```

### **4. Aries Markets (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- User Position: "0x[ADDRESS]::controller::UserPosition"
- Market Info: "0x[ADDRESS]::controller::Market"
- aToken Balance: "0x[ADDRESS]::atoken::AToken"

// Data Structure Fields
- position.data.supplied_assets[]
- position.data.borrowed_assets[]
- position.data.collateral_value
- market.data.cash_reserve
- market.data.total_borrows

// Contract Addresses
- Controller: "0x..."
- Interest Model: "0x..."
- Oracle: "0x..."
- aToken implementations: { "aUSDC": "0x...", "aAPT": "0x..." }
```

### **5. Cellana Finance (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Pool: "0x[ADDRESS]::pool::Pool<...>"
- Position: "0x[ADDRESS]::position::Position"
- Farm: "0x[ADDRESS]::farm::UserFarm"

// Data Structure Fields
- pool.data.token0_amount
- pool.data.token1_amount
- pool.data.total_shares
- farm.data.staked_amount
- farm.data.reward_claimed

// Contract Addresses
- Factory: "0x..."
- Router: "0x..."
- Farm Controller: "0x..."
```

### **6. SushiSwap (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Pair: "0x[ADDRESS]::pair::PairMetadata<...>"
- LP Token: "0x[ADDRESS]::pair::LPToken<...>"
- MiniChef Position: "0x[ADDRESS]::minichef::UserInfo"

// Data Structure Fields
- pair.data.reserve0
- pair.data.reserve1
- pair.data.total_supply
- minichef.data.amount
- minichef.data.reward_debt

// Contract Addresses
- Factory: "0x..."
- Router: "0x..."
- MiniChef: "0x..."
- SUSHI Token: "0x..."
```

### **7. Merkle Trade (Derivatives)**

**Status**: ✅ DISCOVERED DATA

```typescript
// Resource Types - DISCOVERED FROM INDEXER ✅
- MKLP Token: "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<T>"
- Example: MKLP<W_USDC>: "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::fa_box::W_USDC>"

// Entry Functions - DISCOVERED FROM INDEXER ✅
- managed_house_lp::cancel_redeem_plan
- managed_house_lp::convert_mklp_type
- managed_house_lp::redeem
- managed_house_lp::register_redeem_plan
- managed_protocol_reward::claim_rewards

// Contract Addresses - DISCOVERED FROM INDEXER ✅
- Main Contract: "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06"

// Storage Patterns - DISCOVERED FROM INDEXER ✅
- Example Storage ID: "0xffdc46faa8975905de6a9436f8c4c3e82b224550aa08d46029f789e849031978"

// Data Structure Fields - NEED TO DISCOVER 🔍
- mklp.data.balance (likely amount field)
- staking.data.staked_amount
- position.data.size
- position.data.collateral
```

### **8. Echelon (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- Supply Position: "0x[ADDRESS]::lending::SupplyPosition"
- Borrow Position: "0x[ADDRESS]::lending::BorrowPosition"
- eToken Balance: "0x[ADDRESS]::etoken::Balance"

// Data Structure Fields
- supply.data.amount
- supply.data.interest_index
- borrow.data.principal
- borrow.data.interest_owed
- etoken.data.shares

// Contract Addresses
- Lending Pool: "0x..."
- Interest Calculator: "0x..."
- Price Oracle: "0x..."
- eToken Registry: { "eUSDC": "0x...", "eAPT": "0x..." }
```

### **9. Echo Lending (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- Lender Position: "0x[ADDRESS]::lending::LenderInfo"
- Borrower Position: "0x[ADDRESS]::lending::BorrowerInfo"
- Collateral: "0x[ADDRESS]::lending::Collateral"

// Data Structure Fields
- lender.data.supplied_amount
- lender.data.interest_earned
- borrower.data.borrowed_amount
- borrower.data.collateral_locked
- collateral.data.amount

// Contract Addresses
- Main Pool: "0x..."
- Collateral Manager: "0x..."
- Rate Model: "0x..."
```

### **10. Meso Finance (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- Account: "0x[ADDRESS]::account::Account"
- mToken: "0x[ADDRESS]::mtoken::MToken"
- Debt Position: "0x[ADDRESS]::debt::DebtPosition"

// Data Structure Fields
- account.data.deposits[]
- account.data.borrows[]
- mtoken.data.balance
- mtoken.data.exchange_rate
- debt.data.principal
- debt.data.interest_rate

// Contract Addresses
- Comptroller: "0x..."
- mToken Factory: "0x..."
- Oracle: "0x..."
- mToken Registry: { "mUSDC": "0x...", "mAPT": "0x..." }
```

### **11. Joule Finance (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- Deposit: "0x[ADDRESS]::deposit::UserDeposit"
- Loan: "0x[ADDRESS]::loan::UserLoan"
- jToken: "0x[ADDRESS]::jtoken::JToken"

// Data Structure Fields
- deposit.data.amount
- deposit.data.jtoken_minted
- loan.data.borrowed
- loan.data.collateral_ratio
- jtoken.data.total_supply

// Contract Addresses
- Lending Core: "0x..."
- jToken Registry: "0x..."
- Risk Manager: "0x..."
```

### **12. Superposition (Lending)**

**Status**: L Need Data

```typescript
// Resource Types
- Position: "0x[ADDRESS]::position::Position"
- sToken: "0x[ADDRESS]::stoken::SToken"
- Collateral: "0x[ADDRESS]::collateral::CollateralInfo"

// Data Structure Fields
- position.data.supplied[]
- position.data.borrowed[]
- position.data.health_factor
- stoken.data.shares
- collateral.data.locked_amount

// Contract Addresses
- Protocol Controller: "0x..."
- sToken Registry: "0x..."
- Liquidation Engine: "0x..."
```

### **13. VibrantX (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Pool: "0x[ADDRESS]::amm::Pool<...>"
- LP Position: "0x[ADDRESS]::amm::LPPosition"
- Staking: "0x[ADDRESS]::staking::StakeInfo"

// Data Structure Fields
- pool.data.reserve_a
- pool.data.reserve_b
- pool.data.lp_total_supply
- lp_position.data.shares
- staking.data.staked_lp

// Contract Addresses
- AMM Router: "0x..."
- Pool Factory: "0x..."
- Staking Rewards: "0x..."
- VBX Token: "0x..."
```

### **14. Kana Labs (DEX & Perps)**

**Status**: L Need Data

```typescript
// Resource Types
- LP Pool: "0x[ADDRESS]::pool::LiquidityPool<...>"
- Perp Position: "0x[ADDRESS]::perps::Position"
- Staking: "0x[ADDRESS]::staking::UserStake"

// Data Structure Fields
- pool.data.token0_reserve
- pool.data.token1_reserve
- perp.data.size
- perp.data.margin
- perp.data.pnl
- staking.data.amount

// Contract Addresses
- DEX Router: "0x..."
- Perps Engine: "0x..."
- Staking Pool: "0x..."
- KANA Token: "0x..."
```

### **15. Hyperion (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- AMM Pool: "0x[ADDRESS]::pool::AMMPool<...>"
- User Liquidity: "0x[ADDRESS]::liquidity::UserLiquidity"
- Stake: "0x[ADDRESS]::rewards::StakedLP"

// Data Structure Fields
- pool.data.balance_x
- pool.data.balance_y
- pool.data.k_constant
- liquidity.data.lp_tokens
- stake.data.amount

// Contract Addresses
- Factory: "0x..."
- Router: "0x..."
- Rewards Distributor: "0x..."
```

### **16. Panora Exchange (DEX Aggregator)**

**Status**: 🔍 PARTIALLY DISCOVERED

```typescript
// Entry Functions - DISCOVERED FROM INDEXER ✅
- panora_swap::router_entry (at 0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c)

// Contract Addresses - DISCOVERED FROM INDEXER ✅
- Main Router: "0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c"

// STILL NEED TO DISCOVER 🔍
- LP Token: "0x[ADDRESS]::lp::LPToken<...>"
- Limit Order: "0x[ADDRESS]::orderbook::Order"
- User Balance: "0x[ADDRESS]::balance::UserBalance"
- Data Structure Fields
```

### **17. Uptos Pump (Meme Coin Launcher)**

**Status**: 🔍 PARTIALLY DISCOVERED

```typescript
// Protocol Token - DISCOVERED FROM INDEXER ✅
- UPT Token: "0xe1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a::uptos::UptosCoin"

// Contract Addresses - DISCOVERED FROM INDEXER ✅
- Main Contract: "0xe1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a"

// STILL NEED TO DISCOVER 🔍
- Bonding Curve: "0x[ADDRESS]::bonding::BondingCurve"
- User Position: "0x[ADDRESS]::pump::UserPosition"
- Creator Allocation: "0x[ADDRESS]::pump::CreatorVesting"
- Data Structure Fields
```

### **18. Thetis Market (DEX)**

**Status**: L Need Data

```typescript
// Resource Types
- Market Pool: "0x[ADDRESS]::market::Pool<...>"
- LP Share: "0x[ADDRESS]::market::LPShare"
- Yield Vault: "0x[ADDRESS]::vault::UserDeposit"

// Data Structure Fields
- pool.data.asset_a_amount
- pool.data.asset_b_amount
- pool.data.fee_rate
- lp_share.data.shares
- vault.data.deposited
- vault.data.yield_earned

// Contract Addresses
- Market Factory: "0x..."
- Router: "0x..."
- Yield Strategy: "0x..."
- THETIS Token: "0x..."
```

## Additional Global Requirements

### **Price Oracles**

**Status**: L Need Data

```typescript
// Need addresses for:
- Pyth Oracle: "0x..."
- Switchboard Oracle: "0x..."
- Protocol-specific oracles
```

### **Common Token Addresses**

**Status**: ✅ DISCOVERED FROM INDEXER

```typescript
// Standard tokens discovered:
- APT: "0x1::aptos_coin::AptosCoin"
- USDC: "0x397071c01929cc6672a17f130bd62b1bce224309029837ce4f18214cc83ce2a7::USDC::USDC"

// Liquid Staking Tokens discovered:
- tAPT (Tortuga): "0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin"
- vstAPT: "0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183::vcoins::V<0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt>"
- vAPT: "0xb7d960e5f0a58cc0817774e611d7e3ae54c6843816521f02d7ced583d6434896::vcoins::V<0x1::aptos_coin::AptosCoin>"

// DEX LP Tokens discovered:
- THALA-LP: "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d"
- CELL (Cellana): "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"

// Other Protocol Tokens discovered:
- MKLP (Merkle): "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<T>"
- UPT (Uptos): "0xe1d39a72bd69bc2ebfe008bb925badb23a32883b077218b9e167f74cf703db1a::uptos::UptosCoin"
```

### **GraphQL Query Patterns**

**Status**: L Need Data

```typescript
// For protocols using global storage instead of resources:
- Table handles
- Event emission patterns
- View function signatures
```

## Data Collection Methods

### 1. **Protocol Documentation**

- [ ] Review GitHub repositories for Move source code
- [ ] Check developer documentation
- [ ] Find integration guides
- [ ] Look for contract deployment addresses

### 2. **On-Chain Discovery**

- [ ] Analyze transactions from known protocol users
- [ ] Inspect event logs for resource patterns
- [ ] Query resources of active DeFi users
- [ ] Map actual field structures

### 3. **Direct Protocol Contact**

- [ ] Reach out via Discord/Telegram communities
- [ ] Contact developer relations teams
- [ ] Request partnership/integration support
- [ ] Ask for internal documentation

### 4. **Test Transactions**

- [ ] Make small test positions on each protocol
- [ ] Analyze resulting resource structures
- [ ] Map field names and data types
- [ ] Document position lifecycle changes

## Immediate Action Items

1. **High Priority** (DEX protocols with likely high usage)
   - [ ] Thala - Most mature DEX
   - [ ] LiquidSwap - Popular AMM
   - [ ] PancakeSwap - Major brand

2. **Medium Priority** (Lending protocols)
   - [ ] Aries Markets - Main lending protocol
   - [ ] Echelon - Growing lending
   - [ ] Meso Finance - Compound fork

3. **Low Priority** (Newer/Smaller protocols)
   - [ ] All remaining protocols

## Success Criteria

 **Complete when each protocol adapter can:**

1. Find actual user positions (not 0 results)
2. Calculate accurate USD values
3. Identify correct position types
4. Extract meaningful metadata

## Progress Summary

✅ **MAJOR BREAKTHROUGH: Used Aptos Indexer API to discover real protocol data!**

### Data Successfully Discovered:

- **Merkle Trade**: Complete contract address, MKLP token types, entry functions, storage patterns
- **Thala**: LP token address, entry functions, creator addresses
- **Panora Exchange**: Router contract address, entry functions
- **Uptos Pump**: Protocol token address, main contract
- **Common Tokens**: Real addresses for APT, USDC, liquid staking tokens, LP tokens

### Next Phase - Resource Structure Discovery:

Now that we have real contract addresses, we can:

1. Query resources directly using REST API
2. Analyze actual data structures
3. Update adapters with correct field names
4. Test on live data

## Notes

- Current GenericTokenAdapter finds 2 LP tokens, proving the infrastructure works
- The issue is purely protocol-specific resource identification
- **NEW**: We now have real contract addresses for several protocols!
- Once we map the data structures, adapters will work correctly
- This data collection is no longer blocking - we have actionable data!
