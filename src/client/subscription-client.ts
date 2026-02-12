import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  principalCV,
  uintCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  callReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { privateKeyToAccount } from 'x402-stacks';

export class BitSubsClient {
  private network: StacksTestnet;
  private stacksAddress: string;

  constructor(
    private privateKey: string,
    private contractAddress: string,
    private contractName: string,
    private serviceAddress: string
  ) {
    this.network = new StacksTestnet();
    const account = privateKeyToAccount(privateKey, 'testnet');
    this.stacksAddress = account.address;
  }

  private async createPaymentProof(resource: string): Promise<string> {
    // Simple proof: base64(address:resource)
    // For production, this should be a proper signature
    const proof = Buffer.from(`${this.stacksAddress}:${resource}`).toString('base64');
    return proof;
  }

  async makeRequest(endpoint: string): Promise<any> {
    let response = await fetch(endpoint);

    // x402 Protocol: Handle 402 Payment Required
    if (response.status === 402) {
      const body: any = await response.json();
      console.log('💰 402 Payment Required - x402 instructions received');

      const hasChannel = await this.checkExistingChannel();

      if (!hasChannel) {
        console.log('🔓 Opening channel per x402 instructions...');
        // Support both v2 (accepts[]) and v1 (x402.paymentInstructions.tokens[]) formats
        const instructions = body.accepts?.[0] || body.x402?.paymentInstructions?.tokens?.[0];
        await this.openChannelFromInstructions(instructions.contractCall);
        console.log('✅ Channel opened');
        await this.sleep(15000); // Wait for confirmation
      }

      // x402 Protocol: Retry with payment proof
      const resourcePath = new URL(endpoint).pathname;
      const paymentProof = await this.createPaymentProof(resourcePath);

      response = await fetch(endpoint, {
        headers: {
          'x-payment-proof': paymentProof,
          'x-stacks-address': this.stacksAddress
        }
      });
    }

    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 402) {
      throw new Error('Subscription expired');
    } else {
      throw new Error(`Request failed: ${response.status}`);
    }
  }

  private async openChannelFromInstructions(contractCall: any): Promise<string> {
    const depositAmount = this.parseArg(contractCall.functionArgs[1]);

    const txOptions = {
      contractAddress: contractCall.contractAddress,
      contractName: contractCall.contractName,
      functionName: contractCall.functionName,
      functionArgs: [
        principalCV(this.parseArg(contractCall.functionArgs[0])),
        uintCV(depositAmount),
        uintCV(this.parseArg(contractCall.functionArgs[2]))
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditions: [
        makeStandardSTXPostCondition(
          this.stacksAddress,
          FungibleConditionCode.Equal,
          depositAmount
        )
      ]
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;
    return txId;
  }

  private parseArg(arg: string): any {
    const [type, value] = arg.split(':');
    if (type === 'uint') return BigInt(value);
    if (type === 'principal') return value;
    return value;
  }

  private async checkExistingChannel(): Promise<boolean> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(this.stacksAddress),
          principalCV(this.serviceAddress)
        ],
        network: this.network,
        senderAddress: this.stacksAddress
      });

      const data = cvToJSON(result);
      return data.value?.active?.value === true;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAddress(): string {
    return this.stacksAddress;
  }
}
