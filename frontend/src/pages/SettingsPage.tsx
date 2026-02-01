import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Palette,
  Bell,
  Shield,
  Coins,
  Save,
  Check,
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Select,
} from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { TOKENS } from '@/config';

const tokenOptions = [
  { value: TOKENS.USDC.address, label: 'USDC (Native)' },
  { value: TOKENS.USDCe.address, label: 'USDC.e (Bridged)' },
];

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [defaultToken, setDefaultToken] = useState<string>(TOKENS.USDC.address);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('polyseal-default-token');
    const savedNotifs = localStorage.getItem('polyseal-notifications');
    
    if (savedToken) setDefaultToken(savedToken);
    if (savedNotifs !== null) setNotifications(savedNotifs === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('polyseal-default-token', defaultToken);
    localStorage.setItem('polyseal-notifications', String(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="section-heading flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary-500" />
          Settings
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Configure your Polyseal preferences
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                label="Theme"
                value={theme}
                onChange={(val) => setTheme(val as 'light' | 'dark' | 'system')}
                options={themeOptions}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Defaults */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <CardTitle>Defaults</CardTitle>
                  <CardDescription>Set default values for new batches</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                label="Default Payment Token"
                value={defaultToken}
                onChange={setDefaultToken}
                options={tokenOptions}
              />
              <p className="text-sm text-surface-500 mt-2">
                This token will be pre-selected when creating new receipt batches
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">
                    Transaction Notifications
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Show notifications when transactions are confirmed
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications 
                      ? 'bg-primary-500' 
                      : 'bg-surface-300 dark:bg-surface-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      notifications ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </label>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Information about your data security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  🔒 Local-First
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Your receipt data stays on your device. Only the Merkle root hash 
                  is stored on-chain, preserving your privacy.
                </p>
              </div>
              <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  🔐 No Backend
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Polyseal is fully client-side. Your private keys and receipt data 
                  are never sent to any server.
                </p>
              </div>
              <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  ✅ Verifiable
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Anyone can verify receipt authenticity using the on-chain Merkle 
                  root and the provided proof.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            icon={saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
