import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '../../components/ui';
import { useUserStore } from '../../store';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isLoading } = useUserStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!phone) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '手机号格式不正确';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(phone, password);
      toast.success('登录成功');
      navigate('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      toast.error(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col min-h-[80vh]"
    >
      {/* Header */}
      <div className="py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cta-blue to-blue-600 flex items-center justify-center shadow-fab"
        >
          <Wallet className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
          Smart Ledger
        </h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          智能记账，轻松理财
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        <Input
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-5 h-5" />}
          error={errors.phone}
          maxLength={11}
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          error={errors.password}
        />

        <div className="mt-6">
          <Button type="submit" fullWidth size="lg" loading={isLoading}>
            登录
          </Button>
        </div>

        <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary mt-4">
          还没有账号？
          <Link to="/register" className="text-cta-blue font-medium ml-1">
            立即注册
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
