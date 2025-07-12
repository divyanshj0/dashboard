'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut, FiEdit2 } from 'react-icons/fi';
import clsx from 'clsx';
import { BsDatabaseUp } from "react-icons/bs";
import CreateDashboardModal from '@/components/CreateDashboardModal';
import WidgetPlacementModal from '@/components/WidgetPlacementModal';
import WidgetRenderer from '@/components/WidgetRenderer';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState({});
  const [config, setConfig] = useState(null);
  const [layout, setLayout] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [createdWidgets, setCreatedWidgets] = useState([]);

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
        {/* Header */}
        <div className="flex flex-col md:flex-row mx-4 p-2 justify-between items-start md:items-center bg-blue-100 rounded-md gap-2">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <img src="/company_logo[1].png" alt="logo" className="w-48" />
            <p className="text-2xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
            <div className="flex gap-2 items-center">
              <p className="text-lg font-medium">Last Updated</p>
              <span>10 July 2025</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={dotClass} />
            <p className={textClass}>Normal</p>
          </div>
          <div className="relative inline-block text-left md:mr-10">
            <div
              className="text-md bg-white shadow-md p-2 flex items-center text-black rounded-md cursor-pointer"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <FiUser size={24} className="mr-2" /> {name}
            </div>

            {showMenu && (
              <div className="absolute left-[-28px] min-w-fit mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className="flex items-center px-4 py-2 text-lg text-blue-600 hover:bg-gray-100"
                    onClick={() => {
                      setShowCreateModal(true);
                      setShowMenu(false);
                    }}
                  >
                    <FiEdit2 size={20} className="mr-2" /> Customize
                  </button>
                  <Link href="/dataupdate" className="px-4 py-2 text-blue-600 text-lg flex justify-center"><BsDatabaseUp size={20} className="mr-2" />DataUpdate</Link>
                  <button
                    className="flex items-center  px-4 py-2 text-lg text-red-600 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={20} className="mr-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
          existingWidgets={config?.widgets || []}  // Pass saved widgets
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
