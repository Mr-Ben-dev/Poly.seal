import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useTheme } from '@/providers';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Hexagon,
  LayoutDashboard,
  FilePlus,
  Upload,
  ShieldCheck,
  Lock,
  Bot,
  Landmark,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/create', label: 'Create Batch', icon: FilePlus },
  { path: '/commit', label: 'Commit', icon: Upload },
  { path: '/verify', label: 'Verify', icon: ShieldCheck },
  { path: '/escrow', label: 'Escrow', icon: Lock },
  { path: '/agent', label: 'Agent', icon: Bot },
  { path: '/vault', label: 'Vault', icon: Landmark },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/docs', label: 'Help', icon: HelpCircle },
];

export function Header() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card px-4 py-3"
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <Hexagon className="w-10 h-10 text-primary-500 fill-primary-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-accent-500 rounded-full" />
                </div>
              </motion.div>
              <span className="font-display text-xl font-bold gradient-text">
                Polyseal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      relative px-3 py-2 rounded-lg font-medium text-sm
                      transition-all duration-200
                      flex items-center gap-2
                      ${isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggle}
                className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 
                  text-surface-600 dark:text-surface-400
                  hover:bg-surface-200 dark:hover:bg-surface-700
                  transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* Wallet Connect */}
              <div className="hidden sm:block">
                <DynamicWidget />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-surface-100 dark:bg-surface-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pt-4 border-t border-surface-200 dark:border-surface-700"
            >
              <nav className="flex flex-col gap-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      ${location.pathname === path
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'text-surface-600 dark:text-surface-400'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 sm:hidden">
                <DynamicWidget />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </header>
  );
}
