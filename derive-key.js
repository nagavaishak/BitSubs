const { mnemonicToSeedSync } = require('@scure/bip39');
const { HDKey } = require('@scure/bip32');

const MNEMONIC = "slam cube nerve logic between gas surge worth panic delay fetch tattoo lamp pioneer useless scrub potato camp soap retire defense remove edit damp";

// Derive Stacks wallet key using BIP44 path
// m/44'/5757'/0'/0/0 is the standard Stacks derivation path
const seed = mnemonicToSeedSync(MNEMONIC);
const masterKey = HDKey.fromMasterSeed(seed);

// Derive first account (index 0)
const stacksPath = "m/44'/5757'/0'/0/0";
const accountKey = masterKey.derive(stacksPath);

const privateKeyHex = Buffer.from(accountKey.privateKey).toString('hex');

console.log('Derived Stacks Account:');
console.log('='.repeat(70));
console.log(`Private Key: ${privateKeyHex}`);
console.log('='.repeat(70));
