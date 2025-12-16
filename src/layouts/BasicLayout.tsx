import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomTab from './BottomTab';

const BasicLayout = () => {
  return (
    <div className="min-h-screen bg-ios-background pb-24">
      <main className="mx-auto max-w-md bg-ios-background min-h-screen shadow-2xl shadow-black/5 overflow-hidden">
        <Outlet />
      </main>
      <BottomTab />
    </div>
  );
};

export default BasicLayout;
