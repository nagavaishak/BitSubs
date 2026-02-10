import { Request, Response, NextFunction } from 'express';
import { callReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

interface X402Config {
  contractAddress: string;
  contractName: string;
  network: 'testnet' | 'mainnet';
  serviceAddress: string;
}

export function x402SubscriptionMiddleware(config: X402Config) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const subscriberId = req.headers['x-subscriber-id'] as string;

    if (!subscriberId) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Open a subscription channel first',
        instructions: 'POST /api/channels/open with {deposit, ratePerBlock}'
      });
    }

    try {
      // Query Clarity contract (READ-ONLY - NO WRITE)
      const network = config.network === 'testnet' ? new StacksTestnet() : new StacksMainnet();

      const result = await callReadOnlyFunction({
        contractAddress: config.contractAddress,
        contractName: config.contractName,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(subscriberId),
          principalCV(config.serviceAddress)
        ],
        network,
        senderAddress: subscriberId
      });

      const response = cvToJSON(result);

      if (!response.value || response.value.active?.value === false) {
        return res.status(402).json({
          error: 'Subscription Expired',
          message: 'Insufficient balance in channel',
          remainingBalance: response.value?.remaining?.value || '0',
          instructions: 'Close and reopen channel, or wait for existing to expire'
        });
      }

      // Access granted - no write transaction needed
      next();

    } catch (error: any) {
      console.error('Channel verification failed:', error);
      return res.status(500).json({
        error: 'Verification Failed',
        message: error.message
      });
    }
  };
}
