'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiX, FiDownload, FiPlus } from 'react-icons/fi';
import clsx from 'clsx';
const TB_URL = process.env.NEXT_PUBLIC_TB_URL;
export default function ConfigReportModal({ onClose }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState({});
  const [reportOptions, setReportOptions] = useState({
    latest: true,
    avg: false,
    min: false,
    max: false
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState({});

  useEffect(() => {
    const storedToken = localStorage.getItem('tb_token');
    const storedDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
    if (storedToken) setToken(storedToken);
    if (storedDevices.length > 0) {
      fetchTelemetryKeys(storedToken, storedDevices);
    } else {
        setLoading(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fetchTelemetryKeys = async (token, storedDevices) => {
    setLoading(true);
    try {
      const promises = storedDevices.map(device =>
        fetch(`${TB_URL}/api/plugins/telemetry/DEVICE/${device.id.id}/keys/timeseries`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(keys => ({
            id: device.id.id,
            name: device.name,
            keys: keys || []
          }))
          .catch(err => {
            console.error(`Failed to fetch keys for device ${device.name}:`, err);
            return { id: device.id.id, name: device.name, keys: [] };
          })
      );
      const results = await Promise.all(promises);
      setDevices(results);
    } catch (error) {
        toast.error("Failed to load device telemetry keys.");
    } finally {
        setLoading(false);
    }
  };

  const handleDeviceSelection = (deviceId, isChecked) => {
    setSelectedDevices(prev =>
      isChecked ? [...prev, deviceId] : prev.filter(id => id !== deviceId)
    );
  };

  const handleKeySelection = (deviceId, key, isChecked) => {
    setSelectedKeys(prev => {
      const newKeys = { ...prev };
      if (isChecked) {
        newKeys[deviceId] = [...(newKeys[deviceId] || []), key];
      } else {
        newKeys[deviceId] = (newKeys[deviceId] || []).filter(k => k !== key);
      }
      return newKeys;
    });
  };

  const handleSelectAllKeys = (deviceId, keys, isChecked) => {
    setSelectedKeys(prev => ({
      ...prev,
      [deviceId]: isChecked ? keys : []
    }));
  };

  const handleAddCustomKey = (deviceId, keyName) => {
    if (!keyName.trim()) {
      toast.error('Please enter a key name.');
      return;
    }
    const device = devices.find(d => d.id === deviceId);
    if (device && !device.keys.includes(keyName)) {
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, keys: [...d.keys, keyName] } : d
      ));
      handleKeySelection(deviceId, keyName, true);
      setNewCustomKey(prev => ({...prev, [deviceId]: ''}));
    } else if (device && device.keys.includes(keyName)) {
      toast.info('This key already exists.');
    }
  };

  const handleDownload = async () => {
    const allSelectedKeys = Object.values(selectedKeys).flat();
    if (selectedDevices.length === 0 || allSelectedKeys.length === 0) {
      toast.error('Please select at least one device and one telemetry key.');
      return;
    }
    const selectedOptions = Object.keys(reportOptions).filter(key => reportOptions[key]);
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one report option (Latest, Avg, Min, Max).');
      return;
    }
    setDownloading(true);
    const reportData = [];
    try {
      for (const deviceId of selectedDevices) {
        const device = devices.find(d => d.id === deviceId);
        if (!device) continue;
        const deviceReport = { 'Device Name': device.name };
        const deviceKeys = selectedKeys[deviceId] || [];
        for (const key of deviceKeys) {
          const keyReport = { 'Telemetry Key': key };
          let fetchUrl = `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${key}&limit=1`;
          if (startDate && endDate) {
            const startTs = new Date(startDate).getTime();
            const endTs = new Date(endDate).getTime() + 86399999;
            fetchUrl = `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${key}&startTs=${startTs}&endTs=${endTs}`;
          }
          const res = await fetch(fetchUrl, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
          if (res.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            setDownloading(false);
            return;
          }
          const data = await res.json();
          const values = data[key]?.map(d => parseFloat(d.value)) || [];
          if (reportOptions.latest) {
            keyReport['Latest Value'] = values.length > 0 ? values[0] : 'N/A';
          }
          if (reportOptions.avg) {
            keyReport['Average'] = values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : 'N/A';
          }
          if (reportOptions.min) {
            keyReport['Min Value'] = values.length > 0 ? Math.min(...values) : 'N/A';
          }
          if (reportOptions.max) {
            keyReport['Max Value'] = values.length > 0 ? Math.max(...values) : 'N/A';
          }
          reportData.push({ ...deviceReport, ...keyReport });
        }
      }
      if (reportData.length > 0) {
        const headers = ['Device Name', 'Telemetry Key', ...selectedOptions.map(opt => {
          if (opt === 'latest') return 'Latest Value';
          if (opt === 'avg') return 'Average';
          if (opt === 'min') return 'Min Value';
          if (opt === 'max') return 'Max Value';
          return '';
        })];
        const csvContent = [
          headers.join(','),
          ...reportData.map(row => headers.map(h => row[h] ?? '').join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `config_report_${new Date().toISOString().split('T')[0]}.csv`;
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Report downloaded successfully!');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xl font-bold text-gray-600 hover:text-red-500"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Configure Report</h2>
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-500">Loading devices and keys...</p>
            </div>
        ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Devices:</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {devices.map(device => (
                  <label key={device.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={(e) => handleDeviceSelection(device.id, e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="ml-2 text-sm text-gray-700">{device.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedDevices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Telemetry Keys:</label>
                <div className="mt-2 space-y-2">
                  {selectedDevices.map(deviceId => {
                    const device = devices.find(d => d.id === deviceId);
                    const deviceKeys = device?.keys || [];
                    const allKeysSelected = deviceKeys.every(key => (selectedKeys[deviceId] || []).includes(key));
                    
                    return (
                      <div key={deviceId} className="border p-3 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-800">{device.name}</h3>
                          <label className="flex items-center text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={allKeysSelected}
                              onChange={(e) => handleSelectAllKeys(deviceId, deviceKeys, e.target.checked)}
                              className="form-checkbox"
                            />
                            <span className="ml-2">Select All</span>
                          </label>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {deviceKeys.map(key => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(selectedKeys[deviceId] || []).includes(key)}
                                onChange={(e) => handleKeySelection(deviceId, key, e.target.checked)}
                                className="form-checkbox"
                              />
                              <span className="ml-2 text-sm text-gray-700">{key}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add new key"
                            value={newCustomKey[deviceId] || ''}
                            onChange={(e) => setNewCustomKey(prev => ({...prev, [deviceId]: e.target.value}))}
                            className="flex-grow p-2 border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomKey(deviceId, newCustomKey[deviceId])}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                          >
                            <FiPlus size={20} /> Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Options:</label>
              <div className="mt-2 flex gap-4">
                {Object.keys(reportOptions).map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportOptions[option]}
                      onChange={(e) => setReportOptions({ ...reportOptions, [option]: e.target.checked })}
                      className="form-checkbox"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range (Optional):</label>
              <div className="mt-2 flex gap-4">
                <div>
                  <label className="block text-xs font-medium">Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className={clsx(
              "px-4 py-2 text-white rounded hover:bg-blue-700",
              downloading || loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"
            )}
          >
            {downloading ? 'Generating...' : <><FiDownload className="inline-block mr-2" /> Download Report</>}
          </button>
        </div>
      </div>
    </div>
  );
}