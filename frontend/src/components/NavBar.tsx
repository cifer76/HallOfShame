import { Link } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';

export function NavBar() {
  return (
    <div className="bg-red-900 border-b border-red-800">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-bold text-white hover:underline">
              Hall of Shame
            </Link>
            <Link to="/about" className="text-sm text-red-100 hover:text-white hover:underline">
              About
            </Link>
          </div>
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}

