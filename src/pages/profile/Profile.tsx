import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, Grid, Shield, Upload, Download } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { useUserStore } from '@/store/userStore';
import { BillImportDialog } from '@/components/bill/BillImportDialog';

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, logout } = useUserStore();
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuGroups = [
    [
      { icon: Grid, label: '分类管理', color: 'bg-ios-orange', onClick: () => navigate('/category') },
      { icon: Download, label: '导入数据', color: 'bg-ios-green', onClick: () => setShowImportDialog(true) },
      { icon: Upload, label: '导出数据', color: 'bg-ios-blue' },
    ]
  ];

  return (
    <div className="min-h-screen pt-14 pb-24 bg-ios-background">
      <Header title="个人中心" />
      
      <div className="px-4 mt-6">
        {/* User Card */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden">
            {userInfo?.avatar_url ? (
              <img src={userInfo.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-ios-blue text-white text-2xl font-bold">
                {userInfo?.nickname?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ios-text">{userInfo?.nickname || '游客用户'}</h2>
            <p className="text-ios-subtext">{userInfo?.phone || '暂无手机号'}</p>
          </div>
        </div>

        {/* Menu Groups */}
        <div className="space-y-6">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {group.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={item.onClick}
                  className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-md text-white ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-base font-medium">{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              ))}
            </div>
          ))}

          <button 
            onClick={handleLogout}
            className="w-full bg-white text-ios-red font-semibold py-4 rounded-xl shadow-sm active:bg-gray-50 transition-colors"
          >
            退出登录
          </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          Smart Ledger v1.0.0
        </p>
      </div>

      <BillImportDialog 
        isOpen={showImportDialog} 
        onClose={() => setShowImportDialog(false)} 
      />
    </div>
  );
};

export default Profile;