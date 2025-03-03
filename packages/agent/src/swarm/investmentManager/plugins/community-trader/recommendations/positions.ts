import {
    logger,
    type Action,
    type IAgentRuntime,
    type Memory,
    type UUID
} from "@elizaos/core";
import { v4 as uuidv4 } from 'uuid';
import { formatFullReport } from "../reports";
import type { TokenPerformance, Transaction } from "../types";
import { TrustTradingService } from "../tradingService";

export const getPositions: Action = {
    name: "TRUST_GET_POSITIONS",
    description:
        "Retrieves and formats position data for the agent's portfolio",
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "{{agentName}} show me my positions",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "<NONE>",
                    action: "TRUST_GET_POSITIONS",
                },
            },
        ],
    ],
    similes: ["GET_POSITIONS", "SHOW_PORTFOLIO"],

    async handler(runtime, message, _state, _options, callback: any) {
        console.log("getPositions is running");
        const tradingService = runtime.getService("trust_trading") as TrustTradingService;

        try {
            const [positions, user] = await Promise.all([
                tradingService.getOpenPositionsWithBalance(),
                runtime.databaseAdapter.getEntityById(message.userId),
            ]);
            // console.log("Positions:", positions);

            if (!user) {
                logger.error(
                    "No User Found, no entity score can be generated"
                );
                return;
            }

            const entity = await runtime.databaseAdapter.getEntityById(user.id);

            const filteredPositions = positions.filter(
                (pos) =>
                    pos.entityId === entity?.id &&
                    pos.isSimulation === false
            );

            if (filteredPositions.length === 0 && callback) {
                const responseMemory: Memory = {
                    content: {
                        text: "No open positions found.",
                        inReplyTo: message.id
                            ? message.id
                            : undefined,
                        action: "TRUST_GET_POSITIONS",
                    },
                    userId: message.userId,
                    agentId: message.agentId,
                    metadata: message.metadata,
                    roomId: message.roomId,
                    createdAt: Date.now() * 1000,
                };
                await callback(responseMemory);
                return;
            }

            const transactions =
                filteredPositions.length > 0
                    ? await tradingService.getPositionsTransactions(
                          filteredPositions.map((p) => p.id)
                      )
                    : [];

            const tokens: TokenPerformance[] = [];

            const tokenSet = new Set<string>();
            for (const position of filteredPositions) {
                if (tokenSet.has(`${position.chain}:${position.tokenAddress}`))
                    continue;

                const tokenPerformance = await tradingService.getTokenPerformance(
                    position.chain,
                    position.tokenAddress
                );

                if (tokenPerformance) {
                    // Ensure all required fields are present
                    tokens.push({
                        chain: position.chain,
                        address: position.tokenAddress,
                        ...tokenPerformance
                    });
                }

                tokenSet.add(`${position.chain}:${position.tokenAddress}`);
            }

            // Map transactions to the expected type
            const mappedTransactions = transactions.map(tx => {
                const position = filteredPositions.find(p => p.tokenAddress === tx.tokenAddress);
                return {
                    id: uuidv4() as UUID,
                    positionId: position?.id as UUID || uuidv4() as UUID,
                    chain: position?.chain || '',
                    type: tx.type.toUpperCase() as "buy" | "sell" | "transfer_in" | "transfer_out",
                    tokenAddress: tx.tokenAddress,
                    transactionHash: tx.transactionHash,
                    amount: BigInt(tx.amount),
                    price: tx.price?.toString(),
                    isSimulation: tx.isSimulation,
                    timestamp: new Date(tx.timestamp)
                } as unknown as Transaction;
            });

            const {
                positionReports,
                tokenReports,
                totalCurrentValue,
                totalPnL,
                totalRealizedPnL,
                totalUnrealizedPnL,
                positionsWithBalance,
            } = formatFullReport(tokens, filteredPositions, mappedTransactions);

            if (callback) {
                const formattedPositions = positionsWithBalance
                    .map(({ position, token, transactions }) => {
                        const _latestTx = transactions[transactions.length - 1];
                        const currentValue = token.price
                            ? (
                                  Number(position.balance) * token.price
                              ).toString()
                            : "0";
                        console.log("Calculated current value:", currentValue);
                        const pnlPercent =
                            token.price && position.initialPrice
                                ? (
                                      ((Number(token.price) -
                                          Number(position.initialPrice)) /
                                          Number(position.initialPrice)) *
                                      100
                                  ).toFixed(2)
                                : "0";

                        return (
                            `**${token.symbol} (${token.name})**\n` +
                            `Address: ${token.address}\n` +
                            `Price: $${token.price}\n` +
                            `Value: $${currentValue}\n` +
                            `P&L: ${pnlPercent}%\n`
                        );
                    })
                    .join("\n\n");

                const summary =
                    `💰 **Your Portfolio Summary**\nTotal Value: ${totalCurrentValue}\nTotal P&L: ${totalPnL}\nRealized: ${totalRealizedPnL}\nUnrealized: ${totalUnrealizedPnL}`;

                const responseMemory: Memory = {
                    content: {
                        text:
                            positionsWithBalance.length > 0
                                ? `${summary}\n\n${formattedPositions}`
                                : "No open positions found.",
                        inReplyTo: message.id
                            ? message.id
                            : undefined,
                        action: "TRUST_GET_POSITIONS"
                    },
                    userId: message.userId,
                    metadata: message.metadata,
                    agentId: message.agentId,
                    roomId: message.roomId,
                    createdAt: Date.now() * 1000,
                };
                await callback(responseMemory);
            }
        } catch (error) {
            console.error("Error in getPositions:", error);
            throw error;
        }
    },

    async validate(_runtime: IAgentRuntime, message: Memory) {
        if (message.agentId === message.userId) return false;
        return true;
    },
};
