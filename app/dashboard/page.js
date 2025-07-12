'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut, FiEdit2, FiMenu, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { BsDatabaseUp } from 'react-icons/bs';
import Link from 'next/link';
import CreateDashboardModal from '@/components/CreateDashboardModal';
import WidgetPlacementModal from '@/components/WidgetPlacementModal';
import WidgetRenderer from '@/components/WidgetRenderer';

export default function Dashboard() {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState({});
  const [config, setConfig] = useState(null);
  const [layout, setLayout] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [createdWidgets, setCreatedWidgets] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lastUpdated = '10 July 2025';
  const status = 'Normal';

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = localStorage.getItem('tb_token');
      const devices = JSON.parse(localStorage.getItem('tb_devices'));
      const userId = localStorage.getItem('tb_userId');

      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch('/api/thingsboard/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, devices, userId }),
        });

        const result = await res.json();
        setTelemetry(result.telemetry || {});
        setConfig(result.config || null);
        setLayout(result.layout || []);
      } catch (err) {
        console.error('Telemetry/config fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const user = localStorage.getItem('userName');
    if (user) setName(user);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleSaveLayout = async (newLayout) => {
    const token = localStorage.getItem('tb_token');
    const userId = localStorage.getItem('tb_userId');

    const updatedConfig = {
      ...config,
      layout: newLayout,
    };

    try {
      const res = await fetch('/api/thingsboard/saveDashboardConfig', {
        method: 'POST',
        body: JSON.stringify({
          token,
          userId,
          config: updatedConfig,
        }),
      });

      if (res.ok) {
        setConfig(updatedConfig);
        setLayout(newLayout);
      } else {
        console.error('Failed to save layout config');
      }
    } catch (err) {
      console.error('Layout save error:', err);
    }
  };

  const dotClass = clsx('h-3 w-3 rounded-full', 'bg-green-500');
  const textClass = clsx('text-lg font-medium', 'text-green-500');

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-blue-700 font-medium">Loading dashboard...</p>
        </div>
      )}

      <main className={clsx('min-h-screen w-full bg-gray-100', { 'opacity-50 pointer-events-none': loading })}>
        {/* Responsive Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-blue-100 rounded-md shadow-md mx-4 mt-2">
          <div className="flex items-center gap-2">
            <img src="/company_logo[1].png" alt="logo" className="w-32 md:w-48" />
            <p className="text-xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
          </div>
          {/* Desktop Options */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={dotClass} />
              <p className={textClass}>{status}</p>
            </div>
            <div className="flex gap-2 items-center">
              <p className="text-lg font-medium">Last Updated</p>
              <span>{lastUpdated}</span>
            </div>
            <div className="relative inline-block text-left">
              <div
                className="text-md bg-white shadow-md p-2 flex items-center text-black rounded-md cursor-pointer"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <FiUser size={24} className="mr-2" /> {name}
              </div>
              {showMenu && (
              <div className="absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className="flex items-center px-4 py-2 text-lg text-blue-600 hover:bg-gray-100 w-full"
                    onClick={() => {
                      setShowCreateModal(true);
                    }}
                  >
                    <FiEdit2 size={20} className="mr-2" /> Customize
                  </button>
                  <Link href="/dataupdate" className="px-4 py-2 text-blue-600 text-lg flex justify-center"><BsDatabaseUp size={20} className="mr-2" />DataUpdate</Link>
                  <button
                    className="flex items-center px-4 py-2 text-lg text-red-600 hover:bg-gray-100 w-full"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={20} className="mr-2" /> Logout
                  </button>
                </div>
              </div>
              )}  
            </div>
          </div>

          {/* Mobile Menu Icon */}
          <button className="md:hidden p-2 rounded hover:bg-blue-200" onClick={() => setShowSidebar(true)}>
            <FiMenu size={28} />
          </button>
        </div>

        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="fixed left-[33%] inset-0 z-50 bg-black bg-opacity-40 flex">
            <div className="w-64 bg-white p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setShowSidebar(false)}>
                  <FiX size={24} />
                </button>
              </div>
              <div className="flex  gap-2">
                <p className='text-lg font-medium'>Profile</p>
                <p className="text-gray-700 font-medium mb-1">{name}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className='text-lg font-medium'>Status</p>
                <div className='flex items-center gap-2'>
                  <span className={dotClass} />
                  <p className={textClass}>{status}</p>
                </div>
              </div>
              <div className="text-lg font-medium">
                
                <button
                  className="flex items-center px-2 py-1 text-blue-600 hover:bg-gray-100 rounded w-full"
                  onClick={() => {
                    setShowCreateModal(true);
                    setShowSidebar(false);
                  }}
                >
                  <FiEdit2 size={20} className="mr-2" /> Customize
                </button>
                <Link href="/dataupdate" className="flex items-center px-2 py-1 text-blue-600 hover:bg-gray-100 rounded w-full">
                  <BsDatabaseUp size={20} className="mr-2" /> DataUpdate
                </Link>
                <button
                  className="flex items-center px-2 py-1 text-red-600 hover:bg-gray-100 rounded w-full"
                  onClick={handleLogout}
                >
                  <FiLogOut size={20} className="mr-2" /> Logout
                </button>

              </div>
              <div>
                <p className="font-medium">Last Updated</p>
                <p>{lastUpdated}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!config ? (
          <div className="h-[75vh] flex items-center justify-center">
            <button
              className="bg-blue-600 text-white text-lg px-6 py-3 rounded hover:bg-blue-700"
              onClick={() => setShowCreateModal(true)}
            >
              Create Dashboard
            </button>
          </div>
        ) : (
          <div className="mt-4 px-4 min-h-[72vh]">
            <WidgetRenderer config={config} telemetry={telemetry} layout={layout} onLayoutSave={handleSaveLayout} />
          </div>
        )}

        {/* Footer */}
        <div className="bg-blue-100 text-center mx-4 mt-6 py-4 rounded-md">
          <p className="text-lg text-black">© 2025 All rights reserved. Developed and managed by TheElitePro</p>
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateDashboardModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          existingWidgets={config?.widgets || []}
          onNext={(widgets) => {
            setCreatedWidgets(widgets);
            setShowCreateModal(false);
            setShowPlacementModal(true);
          }}
        />
      )}

      {showPlacementModal && (
        <WidgetPlacementModal
          widgets={createdWidgets}
          onSave={(finalWidgets) => {
            const updatedConfig = {
              widgets: finalWidgets,
              layout: finalWidgets.map(w => w.layout),
            };
            setConfig(updatedConfig);
            setLayout(updatedConfig.layout);
            setShowPlacementModal(false);
          }}
          onCancel={() => setShowPlacementModal(false)}
        />
      )}
    </>
  );
}
