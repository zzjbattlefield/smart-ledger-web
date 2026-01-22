import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, useToast } from '../../components/ui';
import { useUserStore } from '../../store';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isLoading } = useUserStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
    confirmPassword?: string;
    nickname?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!phone) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '手机号格式不正确';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6 || password.length > 32) {
      newErrors.password = '密码长度6-32位';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    if (nickname && nickname.length > 50) {
      newErrors.nickname = '昵称最长50字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(phone, password, nickname || undefined);
      toast.success('注册成功');
      navigate('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
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
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
          创建账号
        </h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          开始您的智能记账之旅
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
          type="text"
          placeholder="请输入昵称（选填）"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          leftIcon={<User className="w-5 h-5" />}
          error={errors.nickname}
          maxLength={50}
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="请输入密码（6-32位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          error={errors.password}
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="请确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword}
        />

        <div className="mt-4">
          <Button type="submit" fullWidth loading={isLoading}>
            注册
          </Button>
        </div>

        <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary mt-4">
          已有账号？
          <Link to="/login" className="text-cta-blue font-medium ml-1">
            立即登录
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
