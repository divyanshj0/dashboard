'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

export default function SetupTelemetryModal({ open, onClose, userId, token }) {
    const router = useRouter();
    const [devices, setDevices] = useState([]);
    const [telemetrySetup, setTelemetrySetup] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newCustomKey, setNewCustomKey] = useState({});

    useEffect(() => {
        if (!open || !token || !userId) return;

        const fetchUserDevicesAndConfig = async () => {
            setLoading(true);
            try {
                // Fetch all devices from local storage
                const storedDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
                
                const devicesWithKeysPromises = (storedDevices || []).map(async (dev) => {
                    const keysRes = await fetch(`${process.env.NEXT_PUBLIC_TB_URL}/api/plugins/telemetry/DEVICE/${dev.id.id}/keys/timeseries`, {
                        headers: { 'X-Authorization': `Bearer ${token}` }
                    });
                    const keys = await keysRes.json();
                    return { ...dev, keys: keys || [] };
                });
                const devicesWithKeys = await Promise.all(devicesWithKeysPromises);
                setDevices(devicesWithKeys);

                // Fetch existing telemetry setup from user attributes
                const configRes = await fetch('/api/thingsboard/telemetry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, userId,key:'telemetrySetup'}),
                });
                const userSetup = await configRes.json();
                setTelemetrySetup(userSetup||[]);

            } catch (err) {
                console.error('Error fetching data for setup:', err);
                toast.error('Failed to load telemetry setup data.');
                if (err.message === 'Unauthorized') {
                    localStorage.clear();
                    router.push('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserDevicesAndConfig();
    }, [open, userId, token, router]);
    
    const handleAddEntry = () => {
        setTelemetrySetup(prev => [...prev, {
            id: uuidv4(),
            deviceId: '',
            deviceName: '',
            keys: [],
        }]);
    };

    const handleRemoveEntry = (id) => {
        setTelemetrySetup(prev => prev.filter(entry => entry.id !== id));
    };

    const handleDeviceChange = (entryId, deviceId) => {
        const selectedDevice = devices.find(d => d.id.id === deviceId);
        setTelemetrySetup(prev => 
            prev.map(entry => {
                if (entry.id === entryId) {
                    return {
                        ...entry,
                        deviceId: deviceId,
                        deviceName: selectedDevice?.name || '',
                        keys: [], // Reset keys when device changes
                    };
                }
                return entry;
            })
        );
    };

    const handleKeyChange = (entryId, key, isChecked) => {
        setTelemetrySetup(prev => 
            prev.map(entry => {
                if (entry.id === entryId) {
                    let newKeys = [...entry.keys];
                    if (isChecked) {
                        newKeys.push({ key: key, unit: '' });
                    } else {
                        newKeys = newKeys.filter(k => k.key !== key);
                    }
                    return { ...entry, keys: newKeys };
                }
                return entry;
            })
        );
    };
    
    const handleSelectAllKeysChange = (entryId, availableKeys, isChecked) => {
        setTelemetrySetup(prev =>
            prev.map(entry => {
                if (entry.id === entryId) {
                    const newKeys = isChecked
                        ? availableKeys.map(key => ({ key, unit: entry.keys.find(k => k.key === key)?.unit || '' }))
                        : [];
                    return { ...entry, keys: newKeys };
                }
                return entry;
            })
        );
    };

    const handleAddCustomKey = (entryId, newKeyName) => {
        if (!newKeyName.trim()) {
            toast.error("Please enter a key name.");
            return;
        }
        const keyExists = devices.some(dev => dev.id.id === telemetrySetup.find(ts => ts.id === entryId)?.deviceId && dev.keys.includes(newKeyName));
        if(keyExists){
            toast.error("This key already exists for the selected device.");
            return;
        }

        setDevices(prev => prev.map(dev => {
            if (dev.id.id === telemetrySetup.find(ts => ts.id === entryId)?.deviceId) {
                return { ...dev, keys: [...dev.keys, newKeyName] };
            }
            return dev;
        }));

        setTelemetrySetup(prev => prev.map(entry => {
            if (entry.id === entryId) {
                const newKeys = [...entry.keys];
                if (!newKeys.some(k => k.key === newKeyName)) {
                    newKeys.push({ key: newKeyName, unit: '' });
                }
                return { ...entry, keys: newKeys };
            }
            return entry;
        }));

        setNewCustomKey(prev => ({ ...prev, [entryId]: '' }));
    };

    const handleUnitChange = (entryId, key, unit) => {
      setTelemetrySetup(prev =>
          prev.map(entry => {
              if (entry.id === entryId) {
                  return {
                      ...entry,
                      keys: entry.keys.map(k => k.key === key ? { ...k, unit: unit } : k)
                  };
              }
              return entry;
          })
      );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/thingsboard/saveTelemetrySetup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, userId, telemetrySetup }),
            });

            if (res.status === 401) {
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save telemetry setup.');
            }

            toast.success('Telemetry setup saved successfully!');
            onClose();
        } catch (err) {
            console.error('Save failed:', err);
            toast.error(err.message === 'Unauthorized' ? 'Session expired. Please log in again.' : 'Failed to save telemetry setup.');
            if (err.message === 'Unauthorized') {
                localStorage.clear();
                router.push('/');
            }
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full h-[90vh] relative flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-semibold text-blue-700">Setup Telemetry for User</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-red-600 transition-transform duration-200 hover:scale-105">
                        <FiX size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-gray-500">Loading devices and existing setup...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {telemetrySetup.map(entry => {
                                const selectedDevice = devices.find(d => d.id.id === entry.deviceId);
                                const availableKeys = selectedDevice?.keys || [];
                                const allKeysSelected = availableKeys.length > 0 && availableKeys.every(key => entry.keys.some(k => k.key === key));

                                return (
                                    <div key={entry.id} className="border p-4 rounded-md bg-gray-50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <select
                                                value={entry.deviceId}
                                                onChange={(e) => handleDeviceChange(entry.id, e.target.value)}
                                                className="w-full border p-2 rounded-md focus:ring-blue-500"
                                            >
                                                <option value="">Select Device</option>
                                                {devices.map(d => (
                                                    <option key={d.id.id} value={d.id.id}>{d.name}</option>
                                                ))}
                                            </select>
                                            {telemetrySetup.length > 1 && (
                                                <button onClick={() => handleRemoveEntry(entry.id)} className="text-red-500 hover:text-red-700 ml-4">
                                                    <FiTrash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                        {entry.deviceId && (
                                            <div className="border p-3 rounded-md bg-gray-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-sm font-medium">Telemetry Keys:</h3>
                                                    <label className="flex items-center text-sm font-medium">
                                                        <input
                                                            type="checkbox"
                                                            checked={allKeysSelected}
                                                            onChange={(e) => handleSelectAllKeysChange(entry.id, availableKeys, e.target.checked)}
                                                            className="form-checkbox"
                                                        />
                                                        <span className="ml-2">Select All</span>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {availableKeys.map(key => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`key-${entry.id}-${key}`}
                                                                checked={entry.keys.some(k => k.key === key)}
                                                                onChange={(e) => handleKeyChange(entry.id, key, e.target.checked)}
                                                                className="form-checkbox"
                                                            />
                                                            <label htmlFor={`key-${entry.id}-${key}`} className="text-sm cursor-pointer">{key}</label>
                                                            {entry.keys.some(k => k.key === key) && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Unit"
                                                                    value={entry.keys.find(k => k.key === key)?.unit || ''}
                                                                    onChange={(e) => handleUnitChange(entry.id, key, e.target.value)}
                                                                    className="w-20 text-xs border rounded-md px-1"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="New Custom Key"
                                                        value={newCustomKey[entry.id] || ''}
                                                        onChange={(e) => setNewCustomKey(prev => ({ ...prev, [entry.id]: e.target.value }))}
                                                        className="flex-grow p-2 border rounded-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddCustomKey(entry.id, newCustomKey[entry.id])}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <button
                                onClick={handleAddEntry}
                                className="w-full mt-4 py-2 px-4 bg-blue-100 text-blue-700 rounded-md border border-dashed border-blue-300 hover:bg-blue-200"
                            >
                                <FiPlus className="inline-block mr-2" /> Add Device Telemetry
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={clsx(
                                    "px-4 py-2 text-white rounded hover:bg-blue-700",
                                    saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"
                                )}
                            >
                                {saving ? 'Saving...' : 'Save Telemetry Setup'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}