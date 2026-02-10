import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  uintCV,
  callReadOnlyFunction,
  cvToJSON
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

export interface ChannelInfo {
  active: boolean;
  remaining: bigint;
  deposit: bigint;
  rate: bigint;
  openedAt: bigint;
}

export class BitSubsClient {
  private network: StacksTestnet | StacksMainnet;

  constructor(
    private privateKey: string,
    private contractAddress: string,
    private contractName: string,
    networkType: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.network = networkType === 'testnet' ? new StacksTestnet() : new StacksMainnet();
  }

  async openChannel(
    serviceAddress: string,
    depositAmount: bigint,
    ratePerBlock: bigint
  ): Promise<string> {
    console.log('🔓 Opening subscription channel...');
    console.log(`   Deposit: ${depositAmount} microSTX`);
    console.log(`   Rate: ${ratePerBlock} microSTX per block`);

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'open-channel',
      functionArgs: [
        principalCV(serviceAddress),
        uintCV(depositAmount),
        uintCV(ratePerBlock)
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;

    console.log(`✅ Channel opened. Transaction: ${txId}`);
    return txId;
  }

  async closeChannel(serviceAddress: string): Promise<string> {
    console.log('🔒 Closing subscription channel...');

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'close-channel',
      functionArgs: [principalCV(serviceAddress)],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;

    console.log(`✅ Channel closed. Transaction: ${txId}`);
    return txId;
  }

  async forceCloseChannel(
    subscriberAddress: string,
    serviceAddress: string
  ): Promise<string> {
    console.log('⚠️  Force closing subscription channel...');

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'force-close-channel',
      functionArgs: [
        principalCV(subscriberAddress),
        principalCV(serviceAddress)
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;

    console.log(`✅ Channel force closed. Transaction: ${txId}`);
    return txId;
  }

  async getChannelInfo(
    subscriberAddress: string,
    serviceAddress: string
  ): Promise<ChannelInfo | null> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(subscriberAddress),
          principalCV(serviceAddress)
        ],
        network: this.network,
        senderAddress: subscriberAddress
      });

      const response = cvToJSON(result);

      if (response.value) {
        return {
          active: response.value.active?.value || false,
          remaining: BigInt(response.value.remaining?.value || '0'),
          deposit: BigInt(response.value.deposit?.value || '0'),
          rate: BigInt(response.value.rate?.value || '0'),
          openedAt: BigInt(response.value['opened-at']?.value || '0')
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get channel info:', error);
      return null;
    }
  }
}
