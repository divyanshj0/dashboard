'use client';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function DataUpdate({ onClose }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [telemetrySetup, setTelemetrySetup] = useState([]);
  const [telemetryData, setTelemetryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const storedToken = localStorage.getItem('tb_token');
    const userId = localStorage.getItem('tb_userId');
    if (!storedToken || !userId) {
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return;
    }
    setToken(storedToken);

    const fetchTelemetrySetup = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/thingsboard/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken, userId, key: 'telemetrySetup' }),
        });
        
        if (res.status === 401) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          router.push('/');
          return;
        }

        const data = await res.json();
        setTelemetrySetup(data);

        const initialData = {};
        data.forEach(entry => {
          entry.keys.forEach(keyObj => {
            initialData[`${entry.deviceId}-${keyObj.key}`] = '';
          });
        });
        setTelemetryData(initialData);

      } catch (err) {
        console.error('Failed to fetch telemetry setup:', err);
        toast.error('Failed to load telemetry setup.');
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetrySetup();

  }, [router]);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const isMobile = window.innerWidth < 768;
      const dynamicItems = isMobile ? 6 : 10;
      setItemsPerPage(dynamicItems);
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const handleValueChange = (deviceId, key, value) => {
    setTelemetryData(prev => ({
      ...prev,
      [`${deviceId}-${key}`]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const dataToSend = new Map();
    let hasData = false;

    telemetrySetup.forEach(entry => {
      entry.keys.forEach(keyObj => {
        const key = keyObj.key;
        const value = telemetryData[`${entry.deviceId}-${key}`];

        if (value.trim() !== '') {
          if (!dataToSend.has(entry.deviceId)) {
            dataToSend.set(entry.deviceId, {});
          }
          dataToSend.get(entry.deviceId)[key] = isNaN(Number(value)) ? value : Number(value);
          hasData = true;
        }
      });
    });

    if (!hasData) {
      toast.error('Please enter at least one telemetry value to submit.');
      setSending(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failedDevices = [];

    for (const [deviceId, data] of dataToSend.entries()) {
      try {
        const res = await fetch('/api/thingsboard/sendTelemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deviceId, telemetryData: data })
        });

        if (res.status === 401) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          router.push('/');
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to send data for device ${deviceId}: ${errorText}`);
        }
        successCount++;
      } catch (err) {
        console.error(err);
        failCount++;
        failedDevices.push(deviceId);
      }
    }

    setSending(false);
    if (successCount > 0) {
      toast.success(`Data sent for ${successCount} device(s) successfully!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send data for ${failCount} device(s): ${failedDevices.join(', ')}.`);
    }

    if (successCount > 0) {
      onClose();
    }
  };

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const allTelemetryEntries = telemetrySetup.flatMap(entry =>
    entry.keys.map(keyObj => ({
      ...keyObj,
      deviceName: entry.deviceName,
      deviceId: entry.deviceId
    }))
  );
  
  const totalPages = Math.ceil(allTelemetryEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = allTelemetryEntries.slice(startIndex, endIndex);
  const column1Entries = currentEntries.slice(0, Math.ceil(currentEntries.length / 2));
  const column2Entries = currentEntries.slice(Math.ceil(currentEntries.length / 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700" aria-label="Close">
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Manual Telemetry Update</h2>
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        ) : telemetrySetup.length === 0 ? (
            <div className="text-center text-gray-500 h-40 flex items-center justify-center">
                <p>No telemetry has been configured for you by the administrator.</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                        {column1Entries.map(entry => (
                            <div key={`${entry.deviceId}-${entry.key}`} className="flex flex-col">
                                <label className="text-sm font-medium">{entry.deviceName} - {entry.key} {entry.unit ? `(${entry.unit})` : ''}:</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded mt-1"
                                    value={telemetryData[`${entry.deviceId}-${entry.key}`] || ''}
                                    onChange={e => handleValueChange(entry.deviceId, entry.key, e.target.value)}
                                    placeholder="Enter value"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        {column2Entries.map(entry => (
                            <div key={`${entry.deviceId}-${entry.key}`} className="flex flex-col">
                                <label className="text-sm font-medium">{entry.deviceName} - {entry.key} {entry.unit ? `(${entry.unit})` : ''}:</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded mt-1"
                                    value={telemetryData[`${entry.deviceId}-${entry.key}`] || ''}
                                    onChange={e => handleValueChange(entry.deviceId, entry.key, e.target.value)}
                                    placeholder="Enter value"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={clsx("p-2 rounded-md", {
                                "text-gray-400 cursor-not-allowed": currentPage === 1,
                                "text-blue-600 hover:bg-gray-200": currentPage > 1,
                            })}
                        >
                            <FiChevronLeft size={24} />
                        </button>
                        <span className="text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={clsx("p-2 rounded-md", {
                                "text-gray-400 cursor-not-allowed": currentPage === totalPages,
                                "text-blue-600 hover:bg-gray-200": currentPage < totalPages,
                            })}
                        >
                            <FiChevronRight size={24} />
                        </button>
                    </div>
                )}
                <div className="flex justify-end space-x-4 pt-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {sending ? 'Sending...' : 'Send All Data'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}