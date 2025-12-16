import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUserStore } from '@/store/userStore';
import { register } from '@/api/auth';

const Register = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ phone: '', password: '', nickname: '' });
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      setError('请填写所有必填项');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data } = await register(form);
      setAuth(data.data.token, data.data.user);
      localStorage.setItem('token', data.data.token);
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pt-20 sm:items-center sm:justify-center sm:bg-ios-background sm:pt-0">
      <motion.div 
        className="w-full max-w-sm sm:rounded-3xl sm:bg-white sm:p-8 sm:shadow-ios-lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-ios-text">创建账号</h1>
          <p className="mt-3 text-lg text-ios-subtext">开启您的智能记账之旅</p>
        </motion.div>

        <form onSubmit={handleRegister} className="space-y-5">
          <motion.div variants={itemVariants}>
            <Input
              label="手机号"
              placeholder="请输入手机号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              type="tel"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="昵称 (选填)"
              placeholder="我们该如何称呼您？"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Input
              label="密码"
              placeholder="请设置登录密码"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </motion.div>

          {error && (
            <motion.p className="text-sm text-ios-red text-center">{error}</motion.p>
          )}

          <motion.div variants={itemVariants} className="pt-4">
            <Button type="submit" className="w-full shadow-lg shadow-ios-blue/30" isLoading={loading}>
              立即注册
            </Button>
          </motion.div>
        </form>
        
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-ios-subtext">
            已有账号？{' '}
            <button 
              onClick={() => navigate('/login')}
              className="font-semibold text-ios-blue hover:underline"
            >
              去登录
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;