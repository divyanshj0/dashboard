'use client';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut, FiEdit2, FiMenu, FiX, FiLayout } from 'react-icons/fi';
import clsx from 'clsx';
import { BsDatabaseUp } from 'react-icons/bs';
import CreateDashboardModal from '@/components/CreateDashboardModal';
import WidgetPlacementModal from '@/components/WidgetPlacementModal';
import WidgetRenderer from '@/components/WidgetRenderer';
import DataUpdate from '@/components/updateData';
import { toast } from 'react-toastify';

export default function DashboardPage({ params }) {
  const { username, userId } = params;
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [layout, setLayout] = useState([]);
  const [draftLayout, setDraftLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [createdWidgets, setCreatedWidgets] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpdateData, setShowUpdateData] = useState(false);
  const [token, setToken] = useState('');
  const [saveLayout, setSaveLayout] = useState(false);
  const [save, setSave] = useState(false);
  const [latestTelemetryTime, setLatestTelemetryTime] = useState(null); 
  const status = 'Normal';
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = localStorage.getItem('tb_token');
      const devices = JSON.parse(localStorage.getItem('tb_devices'));
      setToken(token);
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
        setConfig(result.config || null);
        setLayout(result.layout || []);
      } catch (err) {
        console.error('Telemetry/config fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  const handleLogout = () => {
    router.push('/admindashboard');
    
  };

  const handleSaveLayout = async (newLayout) => {
    const token = localStorage.getItem('tb_token');

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
        toast.success('Layout saved Succesfully!!')
      } else {
        toast.error('Failed to save layout config');
      }
    } catch (err) {
      toast.error('Layout save error:', err);
    }
  };
  const handleSaveConfig = async (newConfig) => {
    const token = localStorage.getItem('tb_token');

    try {
      const res = await fetch('/api/thingsboard/saveDashboardConfig', {
        method: 'POST',
        body: JSON.stringify({
          token,
          userId,
          config: newConfig,
        }),
      });

      if (res.ok) {
        setConfig(newConfig);
      } else {
        toast.error('Failed to save config');
      }
    } catch (err) {
      toast.error('Config save error:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
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
        <div className="flex justify-between items-center px-4 py-2 bg-blue-100 rounded-md shadow-md mx-4">
          <div className="flex flex-col items-start md:items-center md:flex-row md:gap-2">
            <img src="/company_logo[1].png" alt="logo" className=" w-48" />
            <span className="text-xl md:text-2xl font-semibold">Water Monitoring Dashboard</span>
            <div className={`hidden ${!config || config.widgets.length === 0 ? '' : 'md:flex'} gap-2 items-center`}>
              <p className="text-md font-medium">Last Updated</p>
              <span>{formatTimestamp(latestTelemetryTime)}</span>
            </div>
          </div>
          {/* Desktop Options */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={dotClass} />
              <p className={textClass}>{status}</p>
            </div>
            <div className="relative inline-block text-left" ref={menuRef}>
              <div
                className="text-md bg-white shadow-md p-2 flex items-center text-black rounded-md cursor-pointer"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <FiUser size={24} className="mr-2" /> {username}
              </div>
              {showMenu && (
                <div className="absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      className="flex items-center px-4 py-2 text-lg text-blue-600 hover:bg-gray-100 w-full"
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowMenu((prev) => !prev);
                      }}
                    >
                      <FiEdit2 size={20} className="mr-2" /> Customize
                    </button>
                    <button
                      className="flex items-center px-4 py-2 text-lg text-blue-600 hover:bg-gray-100 w-full"
                      onClick={() => {
                        setDraftLayout(layout); // store current layout for editing
                        setSaveLayout(true);
                        setShowMenu((prev) => !prev);
                      }}
                    >
                      <FiLayout size={20} className="mr-2" />Edit Layout
                    </button>

                    <button
                      className="px-4 py-2 text-blue-600 text-lg flex items-center hover:bg-gray-100 w-max"
                      onClick={() => {
                        setShowUpdateData(true); setShowMenu((prev) => !prev);
                      }}
                    >
                      <BsDatabaseUp size={20} className="mr-2" />Data Update
                    </button>
                    <button
                      className="flex items-center px-4 py-2 text-lg text-red-600 hover:bg-gray-100 w-max"
                      onClick={() => {
                        handleLogout();
                        setShowMenu((prev) => !prev);
                      }}
                    >
                      <FiLogOut size={20} className="mr-2" /> Admin Panel
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
          <div className="md:hidden fixed left-[33%] inset-0 z-50 bg-black bg-opacity-40 rounded-sm flex">
            <div className="w-full bg-lime-100 p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setShowSidebar(false)}>
                  <FiX size={24} />
                </button>
              </div>
              <div className="flex gap-5 items-center">
                <p className='text-lg font-medium'>Profile</p>
                <p className="text-gray-700 font-medium mb-1 flex items-center"> <FiUser size={20} className='mr-2' /> {username}</p>
              </div>
              <div className="flex items-center gap-5">
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
                <button className="flex items-center px-2 py-1 text-blue-600 hover:bg-gray-100 rounded w-full"
                  onClick={() => { setDraftLayout(layout); setSaveLayout(true); setShowSidebar(false); }}>
                  <FiLayout size={20} className="mr-2" /> Edit Layout
                </button>
                <button className="flex items-center px-2 py-1 text-blue-600 hover:bg-gray-100 rounded w-full"
                  onClick={() => { setShowUpdateData(true); setShowSidebar(false); }}>
                  <BsDatabaseUp size={20} className="mr-2" /> Data Update
                </button>
                <button
                  className="flex items-center px-4 py-2 text-lg text-red-600 hover:bg-gray-100 w-full"
                  onClick={() => {
                    handleLogout();
                  }}
                >
                  <FiLogOut size={20} className="mr-2" /> Logout
                </button>

              </div>
              <div className={`${!config || config.widgets.length === 0 ? 'hidden' : ''}`}>
                <p className="font-medium">Last Updated</p>
                <span>{formatTimestamp(latestTelemetryTime)}</span> 
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!config || config.widgets.length === 0 ? (
          <div className="h-[75vh] flex items-center justify-center">
            <button
              className="bg-blue-600 text-white text-lg px-6 py-3 rounded hover:bg-blue-700"
              onClick={() => setShowCreateModal(true)}
            >
              Create Dashboard
            </button>
          </div>
        ) : (
          <div className="mt-4 px-4 min-h-[74vh] flex flex-col justify-between">
            <WidgetRenderer
              config={config}
              layout={saveLayout ? (draftLayout ?? layout) : layout}
              onLayoutSave={(newLayout) => setDraftLayout(newLayout)}
              saveLayout={saveLayout}
              token={token}
              onLatestTimestampChange={setLatestTelemetryTime}
            />
            <div className={`justify-end gap-2 ${saveLayout ? "flex" : "hidden"}`}>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={async () => {
                  setSave(true);
                  if (draftLayout) {
                    await handleSaveLayout(draftLayout);
                  }
                  setSaveLayout(false);
                  setDraftLayout(null);
                  setSave(false);
                }}
              >
                {save ? "Saving..." : "Save Layout"}
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => {
                  setSaveLayout(false);
                  setDraftLayout(null);
                }}
              >
                Cancel
              </button>
            </div>
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
              layout: finalWidgets.map((w) => w.layout),
            };
            setConfig(updatedConfig);
            setLayout(updatedConfig.layout);
            handleSaveConfig(updatedConfig);
            setShowPlacementModal(false);
          }}
          onClose={() => setShowPlacementModal(false)}
        />
      )}
      {showUpdateData && (
        <DataUpdate
          onClose={() => setShowUpdateData(false)}
        />
      )}

    </>
  );
}