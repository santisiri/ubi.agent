import { type Content, type Memory, type UUID as CoreUUID, type Entity as CoreEntity } from "@elizaos/core";
import type { MessageRecommendation } from "./recommendations/schema";

// Re-export UUID type for use in other files
export type UUID = CoreUUID;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Pretty<type> = { [key in keyof type]: type[key] } & unknown;

type ExtractVariables<T extends string> =
    T extends `${infer Start}{{${infer Var}}}${infer Rest}`
        ? Var | ExtractVariables<Rest>
        : never;

export type TemplateVariables<T extends string> = Pretty<{
    [K in ExtractVariables<T>]: string;
}>;

type SQLiteValue = string | number | null;

type ToSQLiteType<T> = T extends boolean
    ? number
    : T extends Date
      ? string
      : T extends bigint
        ? string
        : T extends Array<any>
          ? string
          : T extends object
            ? string
            : T extends SQLiteValue
              ? T
              : never;

export type ToSQLiteRecord<T extends Record<string, any>> = {
    [K in keyof T]: ToSQLiteType<T[K]>;
};

export type RecommenderMetricsRow = ToSQLiteRecord<RecommenderMetrics>;
export type TokenPerformanceRow = ToSQLiteRecord<TokenPerformance>;
export type PositionRow = ToSQLiteRecord<Position>;
export type TransactionRow = ToSQLiteRecord<Transaction>;

export interface RecommenderMetrics {
    entityId: UUID;
    platform: string;
    totalRecommendations: number;
    successfulRecs: number;
    failedTrades: number;
    totalProfit: number;
    avgTokenPerformance: number;
    consistencyScore: number;
    trustScore: number;
    lastUpdated: Date;
    createdAt: Date;
}

export interface RecommenderMetricsHistory {
    entityId: UUID;
    metrics: RecommenderMetrics;
    timestamp: Date;
}

export interface TokenPerformance {
    chain?: string;
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    metadata?: Record<string, any>;
    price?: number;
    price24hChange?: number;
    volume?: number;
    volume24hChange?: number;
    trades?: number;
    trades24hChange?: number;
    liquidity?: number;
    holders?: number;
    holders24hChange?: number;
    initialMarketCap?: number;
    currentMarketCap?: number;
    rugPull?: boolean;
    isScam?: boolean;
    sustainedGrowth?: boolean;
    rapidDump?: boolean;
    suspiciousVolume?: boolean;
    validationTrust?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Conviction levels for recommendations
 * IMPORTANT: Must match the enum in config.ts
 */
export enum Conviction {
    NONE = "NONE",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}

/**
 * Recommendation types
 * IMPORTANT: Must match the enum in config.ts
 */
export enum RecommendationType {
    BUY = "buy",
    DONT_BUY = "DONT_BUY",
    SELL = "sell",
    DONT_SELL = "DONT_SELL",
    NONE = "NONE",
    HOLD = "HOLD"
}

export type TokenRecommendation = {
    id: UUID;
    entityId: UUID;
    chain: string;
    tokenAddress: string;
    conviction: Conviction;
    type: RecommendationType;
    initialMarketCap: string;
    initialLiquidity: string;
    initialPrice: string;
    marketCap: string;
    liquidity: string;
    price: string;
    rugPull: boolean;
    isScam: boolean;
    riskScore: number;
    performanceScore: number;
    metadata: Record<string, any>;
    status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "WITHDRAWN";
    createdAt: Date;
    updatedAt: Date;
};

export interface Position {
    id: UUID;
    entityId: UUID;
    tokenAddress: string;
    chain: string;
    walletAddress: string;
    balance: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: Date;
    closedAt?: Date;
    isSimulation: boolean;
    amount: string;
    initialPrice: string;
    currentPrice?: string;
    recommendationId: UUID;
}

export type PositionWithBalance = Position & {
    balance: bigint;
};

/**
 * Unified transaction type enums to ensure consistency
 * IMPORTANT: Must match the enum in config.ts
 */
export enum TransactionType {
    BUY = "buy",
    SELL = "sell",
    TRANSFER_IN = "transfer_in",
    TRANSFER_OUT = "transfer_out"
}

/**
 * Complete transaction interface with all possible fields
 */
export interface Transaction {
    id: UUID;
    positionId: UUID;
    tokenAddress: string;
    type: TransactionType;
    amount: string;
    valueUsd?: number;
    marketCap?: number;
    liquidity?: number;
    price: string;
    isSimulation: boolean;
    timestamp: Date;
    chain?: string;
    transactionHash?: string;
}

export type SellDetails = {
    price: number;
    timestamp: string;
    amount: bigint;
    receivedSol: bigint;
    valueUsd: number;
    profitUsd: number;
    profitPercent: number;
    marketCap: number;
    marketCapChange: number;
    liquidity: number;
    liquidityChange: number;
    rapidDump: boolean;
    entityId: string;
};

export type BuyData = {
    positionId: string;
    chain: string;
    tokenAddress: string;
    walletAddress: string;
    entityID: UUID;
    recommendationId: string;
    solAmount: bigint;
    buyAmount: bigint;
    timestamp: Date;
    initialTokenPriceUsd: string;
    isSimulation: boolean;
    txHash: string;
};

export type SellData = {
    positionId: string;
    chain: string;
    tokenAddress: string;
    walletAddress: string;
    entityID: UUID;
    solAmount: bigint;
    sellAmount: bigint;
    timestamp: Date;
    isSimulation: boolean;
    txHash: string;
};

export type RecommenderAnalytics = {
    entityId: string;
    trustScore: number;
    riskScore: number;
    consistencyScore: number;
    recommenderMetrics: RecommenderMetrics;
};

export type TokenRecommendationSummary = {
    chain: string;
    tokenAddress: string;
    averageTrustScore: number;
    averageRiskScore: number;
    averageConsistencyScore: number;
    recommenders: RecommenderAnalytics[];
};

export type TransactionData = {
    chain: string;
    tokenAddress: string;
    pairId: string;
    amount: string;
    currentBalance: string;
    sellRecommenderId: string;
    walletAddress: string;
    transaction: any | null;
    isSimulation: boolean;
};

export type QuoteResult<Data = any> = {
    amountOut: bigint;
    data?: Data;
};

export type SwapInResult<Data = any> = {
    txHash: string;
    amountOut: bigint;
    timestamp: Date;
    data?: Data;
};

export type QuoteInParams = {
    inputToken: string;
    outputToken: string;
    amountIn: bigint;
    slippageBps?: number;
};

export type SwapInParams<SwapData = any> = {
    inputToken: string;
    outputToken: string;
    amountIn: bigint;
    minAmountOut: bigint;
    isSimulation: boolean;
    data?: SwapData;
};

export interface TrustWalletProvider<
    QuoteData = any,
    TQuoteResult extends QuoteResult<QuoteData> = QuoteResult<QuoteData>,
    SwapResultData = any,
    TSwapResult extends
        SwapInResult<SwapResultData> = SwapInResult<SwapResultData>,
> {
    getCurrencyAddress(): string;
    getAddress(): string;
    getQuoteIn(props: QuoteInParams): Promise<TQuoteResult>;
    swapIn(props: SwapInParams<QuoteData>): Promise<TSwapResult>;

    executeSwap<SwapData = any, SwapResultData = any>(params: {
        inputToken: string;
        outputToken: string;
        swapData: SwapData;
    }): Promise<SwapInResult<SwapResultData>>;

    getTokenFromWallet(tokenSymbol: string): Promise<string | null>;
    getAccountBalance(): Promise<bigint>;
}

export type TokenMetadata = {
    chain: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    metadata: Record<string, any>;
};

export type TokenMarketData = {
    price: number;
    priceUsd: string;
    price24hChange: number;

    marketCap: number;

    uniqueWallet24h: number;
    uniqueWallet24hChange: number;

    volume24h: number;
    volume24hChange: number;

    trades: number;
    trades24hChange: number;

    liquidityUsd: number;

    holders: number;
};

export interface RecommendationMemory extends Memory {
    content: Content & {
        recommendation: MessageRecommendation & {
            confirmed?: boolean;
        };
    };
}

// TODO: Consolidate this into "Entity" with metadata
export type Account = {
    id: UUID;
    name: string;
    username: string;
    email: string;
    avatarUrl: string;
    telegramId: string;
    discordId: string;
};

export type TokenTradeData = {
    address: string;
    holder: number;
    market: number;
    last_trade_unix_time: number;
    last_trade_human_time: string;
    price: number;
    history_30m_price: number;
    price_change_30m_percent: number;
    history_1h_price: number;
    price_change_1h_percent: number;
    history_2h_price: number;
    price_change_2h_percent: number;
    history_4h_price: number;
    price_change_4h_percent: number;
    history_6h_price: number;
    price_change_6h_percent: number;
    history_8h_price: number;
    price_change_8h_percent: number;
    history_12h_price: number;
    price_change_12h_percent: number;
    history_24h_price: number;
    price_change_24h_percent: number;
    unique_wallet_30m: number;
    unique_wallet_history_30m: number;
    unique_wallet_30m_change_percent: number;
    unique_wallet_1h: number;
    unique_wallet_history_1h: number;
    unique_wallet_1h_change_percent: number;
    unique_wallet_2h: number;
    unique_wallet_history_2h: number;
    unique_wallet_2h_change_percent: number;
    unique_wallet_4h: number;
    unique_wallet_history_4h: number;
    unique_wallet_4h_change_percent: number;
    unique_wallet_8h: number;
    unique_wallet_history_8h: number | null;
    unique_wallet_8h_change_percent: number | null;
    unique_wallet_24h: number;
    unique_wallet_history_24h: number | null;
    unique_wallet_24h_change_percent: number | null;
    trade_30m: number;
    trade_history_30m: number;
    trade_30m_change_percent: number;
    sell_30m: number;
    sell_history_30m: number;
    sell_30m_change_percent: number;
    buy_30m: number;
    buy_history_30m: number;
    buy_30m_change_percent: number;
    volume_30m: number;
    volume_30m_usd: number;
    volume_history_30m: number;
    volume_history_30m_usd: number;
    volume_30m_change_percent: number;
    volume_buy_30m: number;
    volume_buy_30m_usd: number;
    volume_buy_history_30m: number;
    volume_buy_history_30m_usd: number;
    volume_buy_30m_change_percent: number;
    volume_sell_30m: number;
    volume_sell_30m_usd: number;
    volume_sell_history_30m: number;
    volume_sell_history_30m_usd: number;
    volume_sell_30m_change_percent: number;
    trade_1h: number;
    trade_history_1h: number;
    trade_1h_change_percent: number;
    sell_1h: number;
    sell_history_1h: number;
    sell_1h_change_percent: number;
    buy_1h: number;
    buy_history_1h: number;
    buy_1h_change_percent: number;
    volume_1h: number;
    volume_1h_usd: number;
    volume_history_1h: number;
    volume_history_1h_usd: number;
    volume_1h_change_percent: number;
    volume_buy_1h: number;
    volume_buy_1h_usd: number;
    volume_buy_history_1h: number;
    volume_buy_history_1h_usd: number;
    volume_buy_1h_change_percent: number;
    volume_sell_1h: number;
    volume_sell_1h_usd: number;
    volume_sell_history_1h: number;
    volume_sell_history_1h_usd: number;
    volume_sell_1h_change_percent: number;
    trade_2h: number;
    trade_history_2h: number;
    trade_2h_change_percent: number;
    sell_2h: number;
    sell_history_2h: number;
    sell_2h_change_percent: number;
    buy_2h: number;
    buy_history_2h: number;
    buy_2h_change_percent: number;
    volume_2h: number;
    volume_2h_usd: number;
    volume_history_2h: number;
    volume_history_2h_usd: number;
    volume_2h_change_percent: number;
    volume_buy_2h: number;
    volume_buy_2h_usd: number;
    volume_buy_history_2h: number;
    volume_buy_history_2h_usd: number;
    volume_buy_2h_change_percent: number;
    volume_sell_2h: number;
    volume_sell_2h_usd: number;
    volume_sell_history_2h: number;
    volume_sell_history_2h_usd: number;
    volume_sell_2h_change_percent: number;
    trade_4h: number;
    trade_history_4h: number;
    trade_4h_change_percent: number;
    sell_4h: number;
    sell_history_4h: number;
    sell_4h_change_percent: number;
    buy_4h: number;
    buy_history_4h: number;
    buy_4h_change_percent: number;
    volume_4h: number;
    volume_4h_usd: number;
    volume_history_4h: number;
    volume_history_4h_usd: number;
    volume_4h_change_percent: number;
    volume_buy_4h: number;
    volume_buy_4h_usd: number;
    volume_buy_history_4h: number;
    volume_buy_history_4h_usd: number;
    volume_buy_4h_change_percent: number;
    volume_sell_4h: number;
    volume_sell_4h_usd: number;
    volume_sell_history_4h: number;
    volume_sell_history_4h_usd: number;
    volume_sell_4h_change_percent: number;
    trade_8h: number;
    trade_history_8h: number | null;
    trade_8h_change_percent: number | null;
    sell_8h: number;
    sell_history_8h: number | null;
    sell_8h_change_percent: number | null;
    buy_8h: number;
    buy_history_8h: number | null;
    buy_8h_change_percent: number | null;
    volume_8h: number;
    volume_8h_usd: number;
    volume_history_8h: number;
    volume_history_8h_usd: number;
    volume_8h_change_percent: number | null;
    volume_buy_8h: number;
    volume_buy_8h_usd: number;
    volume_buy_history_8h: number;
    volume_buy_history_8h_usd: number;
    volume_buy_8h_change_percent: number | null;
    volume_sell_8h: number;
    volume_sell_8h_usd: number;
    volume_sell_history_8h: number;
    volume_sell_history_8h_usd: number;
    volume_sell_8h_change_percent: number | null;
    trade_24h: number;
    trade_history_24h: number;
    trade_24h_change_percent: number | null;
    sell_24h: number;
    sell_history_24h: number;
    sell_24h_change_percent: number | null;
    buy_24h: number;
    buy_history_24h: number;
    buy_24h_change_percent: number | null;
    volume_24h: number;
    volume_24h_usd: number;
    volume_history_24h: number;
    volume_history_24h_usd: number;
    volume_24h_change_percent: number | null;
    volume_buy_24h: number;
    volume_buy_24h_usd: number;
    volume_buy_history_24h: number;
    volume_buy_history_24h_usd: number;
    volume_buy_24h_change_percent: number | null;
    volume_sell_24h: number;
    volume_sell_24h_usd: number;
    volume_sell_history_24h: number;
    volume_sell_history_24h_usd: number;
    volume_sell_24h_change_percent: number | null;
};

export type HolderData = {
    address: string;
    balance: string;
};

export type TokenSecurityData = {
    ownerBalance: string;
    creatorBalance: string;
    ownerPercentage: number;
    creatorPercentage: number;
    top10HolderBalance: string;
    top10HolderPercent: number;
};

export type ProcessedTokenData = {
    token: TokenOverview;
    security: TokenSecurityData;
    tradeData: TokenTradeData;
    holderDistributionTrend: string; // 'increasing' | 'decreasing' | 'stable'
    highValueHolders: {
        holderAddress: string;
        balanceUsd: string;
    }[];
    recentTrades: boolean;
    highSupplyHoldersCount: number;
    dexScreenerData: DexScreenerData;

    isDexScreenerListed: boolean;
    isDexScreenerPaid: boolean;
};

export type DexScreenerPair = {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity?: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
    pairCreatedAt: number;
    info: {
        imageUrl: string;
        websites: { label: string; url: string }[];
        socials: { type: string; url: string }[];
    };
    boosts: {
        active: number;
    };
};

export type DexScreenerData = {
    schemaVersion: string;
    pairs: DexScreenerPair[];
};

export type Prices = {
    solana: { usd: string };
    bitcoin: { usd: string };
    ethereum: { usd: string };
};

export type CalculatedBuyAmounts = {
    none: 0;
    low: number;
    medium: number;
    high: number;
};

export type WalletPortfolioItem = {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    balance: string;
    uiAmount: string;
    priceUsd: string;
    valueUsd: string;
    valueSol?: string;
};

export type WalletPortfolio = {
    totalUsd: string;
    totalSol?: string;
    items: WalletPortfolioItem[];
};

export type TokenOverview = {
    address: string;
    name: string;
    symbol: string;
    decimals?: number;
    logoURI?: string;
};

export interface BuySignalMessage {
    positionId?: string;
    tokenAddress: string;
    chain: string;
    walletAddress: string;
    isSimulation: boolean;
    entityId: string;
    recommendationId: string;
    price: string;
    marketCap: string;
    liquidity: string;
    amount: string;
    type: RecommendationType;
    conviction: Conviction;
}

export interface Trade {
    id: string;
    positionId: string;
    type: TransactionType.BUY | TransactionType.SELL;
    amount: bigint;
    price: bigint;
    timestamp: Date;
    txHash: string;
}

export interface TradePerformance {
    token_address: string;
    recommender_id: string;
    buy_price: number;
    sell_price: number;
    buy_timeStamp: string;
    sell_timeStamp: string;
    buy_amount: number;
    sell_amount: number;
    buy_sol: number;
    received_sol: number;
    buy_value_usd: number;
    sell_value_usd: number;
    profit_usd: number;
    profit_percent: number;
    buy_market_cap: number;
    sell_market_cap: number;
    market_cap_change: number;
    buy_liquidity: number;
    sell_liquidity: number;
    liquidity_change: number;
    last_updated: string;
    rapidDump: boolean;
}

export interface Entity extends CoreEntity {
    platform?: string;
}