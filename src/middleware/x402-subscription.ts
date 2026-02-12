import { Request, Response, NextFunction } from 'express';
import {
  callReadOnlyFunction,
  cvToJSON,
  principalCV
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  X402_HEADERS,
} from 'x402-stacks';

interface X402Config {
  contractAddress: string;
  contractName: string;
  network: 'testnet' | 'mainnet';
  serviceAddress: string;
}

function buildPaymentInstructions(config: X402Config, resource: string) {
  const network = config.network === 'testnet' ? 'stacks-testnet' : 'stacks-mainnet';
  return {
    status: 402,
    error: 'Payment Required',
    x402Version: 2,
    resource: { url: resource, description: 'Open subscription channel for continuous API access' },
    accepts: [
      {
        scheme: 'subscription-channel',
        network,
        token: 'STX',
        amount: '1000000',
        payTo: config.serviceAddress,
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
      },
      {
        scheme: 'subscription-channel',
        network,
        token: 'sBTC',
        amount: '10000',
        payTo: config.serviceAddress,
        contractCall: {
          contractAddress: config.contractAddress,
          contractName: config.contractName,
          functionName: 'open-channel-sbtc',
          functionArgs: [
            `principal:${config.serviceAddress}`,
            'uint:10000',
            'uint:1'
          ]
        }
      }
    ]
  };
}

export function x402SubscriptionMiddleware(config: X402Config) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['x-payment-proof'] as string;
    const stacksAddress = req.headers['x-stacks-address'] as string;

    // x402 Protocol: Return payment instructions if no proof provided
    if (!paymentProof || !stacksAddress) {
      const paymentRequired = buildPaymentInstructions(config, req.path);
      res.setHeader(
        X402_HEADERS.PAYMENT_REQUIRED,
        Buffer.from(JSON.stringify(paymentRequired)).toString('base64')
      );
      return res.status(402).json(paymentRequired);
    }

    try {
      // Verify subscription channel on-chain (read-only, zero gas)
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
        const paymentRequired = {
          ...buildPaymentInstructions(config, req.path),
          error: 'Subscription Expired',
          currentBalance: channelData.value?.remaining?.value || '0',
        };
        res.setHeader(
          X402_HEADERS.PAYMENT_REQUIRED,
          Buffer.from(JSON.stringify(paymentRequired)).toString('base64')
        );
        return res.status(402).json(paymentRequired);
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
