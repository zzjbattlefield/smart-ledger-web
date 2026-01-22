import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  FolderOpen,
  Upload,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Dialog, useToast } from '../../components/ui';
import { useUserStore, useThemeStore } from '../../store';
import { billApi } from '../../api';
import type { Theme } from '../../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Detect parser type from filename
      let parserType = 'alipay';
      const filename = file.name.toLowerCase();
      if (filename.includes('wechat') || filename.includes('weixin') || filename.includes('微信')) {
        parserType = 'wechat';
      }

      const { data } = await billApi.import(file, parserType);
      const { total, failed } = data.data;

      if (failed > 0) {
        toast.warning(`导入完成：成功 ${total - failed} 条，失败 ${failed} 条`);
      } else {
        toast.success(`成功导入 ${total} 条账单`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入失败';
      toast.error(message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const menuItems = [
    {
      icon: FolderOpen,
      label: '分类管理',
      onClick: () => navigate('/category'),
    },
    {
      icon: Upload,
      label: '导入账单',
      onClick: () => fileInputRef.current?.click(),
      loading: isImporting,
    },
    {
      icon: theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor,
      label: '主题设置',
      value: themeOptions.find((t) => t.value === theme)?.label,
      onClick: () => setShowThemeDialog(true),
    },
  ];

  return (
    <div className="min-h-screen pb-8 safe-area-top">
      {/* Header */}
      <header className="px-4 py-6">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-6">
          我的
        </h1>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-cta-blue/10 flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nickname}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-cta-blue" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {user?.nickname || '用户'}
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {user?.phone}
            </p>
          </div>
        </motion.div>
      </header>

      {/* Menu */}
      <div className="px-4">
        <div className="card p-0 divide-y divide-gray-100 dark:divide-zinc-900">
          {menuItems.map(({ icon: Icon, label, value, onClick, loading }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={loading}
              className="flex items-center gap-4 w-full p-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-cta-blue border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                )}
              </div>
              <span className="flex-1 text-left text-light-text dark:text-dark-text">
                {label}
              </span>
              {value && (
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {value}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowLogoutDialog(true)}
            className="text-expense-red border-expense-red/20"
          >
            <LogOut className="w-5 h-5 mr-2" />
            退出登录
          </Button>
        </motion.div>

        {/* Version */}
        <p className="mt-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Smart Ledger v1.0.0
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImport}
        className="hidden"
      />

      {/* Theme Dialog */}
      <Dialog
        open={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        title="主题设置"
      >
        <div className="space-y-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setShowThemeDialog(false);
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                theme === value
                  ? 'bg-cta-blue/10 border-2 border-cta-blue'
                  : 'bg-gray-50 dark:bg-zinc-900 border-2 border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  theme === value
                    ? 'text-cta-blue'
                    : 'text-light-text-secondary dark:text-dark-text-secondary'
                }`}
              />
              <span
                className={
                  theme === value
                    ? 'text-cta-blue font-medium'
                    : 'text-light-text dark:text-dark-text'
                }
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="确认退出"
      >
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          确定要退出登录吗？
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowLogoutDialog(false)}
          >
            取消
          </Button>
          <Button variant="danger" fullWidth onClick={handleLogout}>
            退出
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
