import { useCurrentAccount, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
import { Wallet, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    if (account?.address) {
      suiClient.getBalance({ owner: account.address })
        .then(result => {
          const balanceInSui = (Number(result.totalBalance) / 1_000_000_000).toFixed(4);
          setBalance(balanceInSui);
        })
        .catch(console.error);
    }
  }, [account, suiClient]);

  if (account) {
    return (
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
          <span className="text-xs text-gray-500">{balance} SUI</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}

export function WalletStatus() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Wallet className="w-5 h-5 text-yellow-600" />
        <span className="text-sm text-yellow-700">
          Please connect your Sui Wallet to interact
        </span>
      </div>
    );
  }

  return null;
}


