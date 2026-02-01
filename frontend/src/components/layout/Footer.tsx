import { Link } from 'react-router-dom';
import { Hexagon, Github, Twitter, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <Hexagon className="w-8 h-8 text-primary-500 fill-primary-500/20" />
                <span className="font-display text-xl font-bold gradient-text">
                  Polyseal
                </span>
              </Link>
              <p className="text-surface-600 dark:text-surface-400 text-sm max-w-md">
                Merkle-sealed receipts for USDC on Polygon. Create verifiable batch receipts 
                with privacy-preserving proofs that anyone can verify.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-surface-900 dark:text-surface-100">
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/dashboard" className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors">
                    Create Batch
                  </Link>
                </li>
                <li>
                  <Link to="/verify" className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors">
                    Verify Receipt
                  </Link>
                </li>
                <li>
                  <Link to="/escrow" className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors">
                    Escrow
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-surface-900 dark:text-surface-100">
                Resources
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/docs" className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://polygonscan.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors"
                  >
                    Polygonscan
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-8 pt-8 border-t border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-surface-500">
              © 2026 Polyseal. Built on Polygon.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-surface-500 hover:text-primary-500 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-surface-500 hover:text-primary-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-surface-500 hover:text-primary-500 transition-colors"
                aria-label="Documentation"
              >
                <FileText className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
