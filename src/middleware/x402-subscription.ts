import { Request, Response, NextFunction } from 'express';
import {
  callReadOnlyFunction,
  cvToJSON,
  principalCV
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

interface X402Config {
  contractAddress: string;
  contractName: string;
  network: 'testnet' | 'mainnet';
  serviceAddress: string;
}

export function x402SubscriptionMiddleware(config: X402Config) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['x-payment-proof'] as string;
    const stacksAddress = req.headers['x-stacks-address'] as string;

    // x402 Protocol: Return payment instructions if no proof provided
    if (!paymentProof || !stacksAddress) {
      return res.status(402).json({
        error: 'Payment Required',
        x402: {
          version: 1,
          paymentInstructions: {
            network: 'stacks-testnet',
            chainId: 'stacks:testnet',
            tokens: [
              {
                token: 'STX',
                amount: '1000000',
                recipient: config.serviceAddress,
                contractCall: {
                  contractAddress: config.contractAddress,
                  contractName: config.contractName,
                  functionName: 'open-channel',
                  functionArgs: [
                    `principal:${config.serviceAddress}`,
                    'uint:1000000',
                    'uint:100'
                  ]
                }
              }
            ],
            description: 'Open subscription channel for continuous API access',
            resource: req.path
          }
        }
      });
    }

    try {
      // Verify payment channel on-chain
      const network = config.network === 'testnet'
        ? new StacksTestnet()
        : new StacksMainnet();

      const result = await callReadOnlyFunction({
        contractAddress: config.contractAddress,
        contractName: config.contractName,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(stacksAddress),
          principalCV(config.serviceAddress)
        ],
        network,
        senderAddress: stacksAddress
      });

      const channelData = cvToJSON(result);

      // x402 Protocol: Return payment instructions if channel inactive
      if (!channelData.value || channelData.value.active?.value === false) {
        return res.status(402).json({
          error: 'Subscription Expired',
          x402: {
            version: 1,
            currentBalance: channelData.value?.remaining?.value || '0',
            paymentInstructions: {
              network: 'stacks-testnet',
              tokens: [{
                token: 'STX',
                amount: '1000000',
                recipient: config.serviceAddress,
                contractCall: {
                  contractAddress: config.contractAddress,
                  contractName: config.contractName,
                  functionName: 'open-channel',
                  functionArgs: [
                    `principal:${config.serviceAddress}`,
                    'uint:1000000',
                    'uint:100'
                  ]
                }
              }]
            }
          }
        });
      }

      console.log(`✅ x402 verified: ${stacksAddress} - balance: ${channelData.value.remaining?.value}`);
      next();

    } catch (error: any) {
      console.error('x402 verification failed:', error);
      return res.status(500).json({
        error: 'Verification Failed',
        message: error.message
      });
    }
  };
}
