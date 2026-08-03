/**
 * Future Solana settlement boundary.
 * D1 remains the source of truth for quotes and costs; only a quote hash and
 * deposit payment metadata may cross this interface.
 */
export const SOLANA_PAYMENT_ENABLED=false;

export interface SolanaQuoteSettlementIntent{
  quoteId:string;
  quoteVersionId:string;
  quoteHash:string;
  depositLamports:string;
  reference:string;
}

export interface SolanaWalletIdentity{
  publicKey:string;
}

export interface SolanaSettlementReceipt{
  signature:string;
  cluster:"mainnet-beta"|"devnet";
}

export interface SolanaWalletGateway{
  connect():Promise<SolanaWalletIdentity>;
  signQuoteAndPayDeposit(intent:SolanaQuoteSettlementIntent):Promise<SolanaSettlementReceipt>;
}

export function createSolanaSettlementMemo(intent:SolanaQuoteSettlementIntent){
  return JSON.stringify({
    version:1,
    quoteId:intent.quoteId,
    quoteVersionId:intent.quoteVersionId,
    quoteHash:intent.quoteHash,
    reference:intent.reference,
  });
}