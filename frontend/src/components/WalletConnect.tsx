import { useCurrentAccount, useDisconnectWallet, useSuiClient, useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: connect } = useConnectWallet();
  const wallets = useWallets();
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

  const handleConnect = () => {
    // Use the first available wallet if any
    const wallet = wallets[0];
    if (wallet) {
      connect({ wallet });
    }
  };

  if (account) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-100">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </span>
        <span className="text-red-200">({balance} SUI)</span>
        <button
          onClick={() => disconnect()}
          className="text-red-100 hover:text-white hover:underline ml-2"
          title="Disconnect wallet"
        >
          [disconnect]
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="text-sm text-red-100 hover:text-white hover:underline"
    >
      Connect Wallet
    </button>
  );
}

export function WalletStatus() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
        Please connect your Sui Wallet to interact
      </div>
    );
  }

  return null;
}


