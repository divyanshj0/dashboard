'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from "./login/page";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tb_token');
    const userAuthority = localStorage.getItem('userAuthority');

    if (token && userAuthority) {
      if (userAuthority === 'TENANT_ADMIN') {
        router.replace('/admindashboard');
      } else if (userAuthority === 'CUSTOMER_USER') {
        router.replace('/dashboard');
      }
    } else {
      setCheckingAuth(false); 
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-blue-700 font-medium">Loading dashboard...</p>
      </div>
    );
  }
  return (
    <LoginPage />
  );
}