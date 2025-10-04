import { WalletConnector, WalletType, WalletInfo, TransactionRequest } from '../types';

export abstract class BaseWalletConnector implements WalletConnector {
  abstract type: WalletType;
  abstract name: string;
  abstract icon: string;
  abstract description: string;
  abstract isMobileSupported: boolean;

  abstract isInstalled(): boolean;
  abstract checkConnection(): Promise<WalletInfo | null>;
  abstract connect(): Promise<WalletInfo>;
  abstract disconnect(walletId: string): Promise<void>;
  abstract switchChain(walletId: string, chainId: string): Promise<void>;
  abstract getBalance(walletId: string): Promise<string>;
  abstract signMessage(walletId: string, message: string): Promise<string>;
  abstract sendTransaction(walletId: string, tx: TransactionRequest): Promise<string>;

  protected generateWalletId(address: string, type: WalletType): string {
    return `${type}-${address.toLowerCase()}`;
  }

  protected isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  protected formatBalance(balance: bigint, decimals: number = 18): string {
    const divisor = BigInt(10) ** BigInt(decimals);
    const intPart = balance / divisor;
    const remainder = balance % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 4);
    return `${intPart.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
  }
}
