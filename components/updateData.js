'use client';
import { useEffect, useState } from 'react';

export default function DataUpdate({ onClose }) {
    const [token, setToken] = useState('');
    const [devices, setDevices] = useState([]);
    // State to manage multiple telemetry entries
    const [telemetryEntries, setTelemetryEntries] = useState([
        { id: Date.now(), deviceId: '', selectedKey: '', customKey: '', value: '' }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const storedToken = localStorage.getItem('tb_token');
        const storedDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
        if (storedToken) setToken(storedToken);
        if (storedDevices.length > 0) {
            setDevices(storedDevices);
        }
    }, []);

    const fetchKeys = async (deviceId, entryId) => {
        if (!deviceId || !token) {
            updateEntry(entryId, 'telemetryKeys', []); // Clear keys if no device selected
            return;
        }
        try {
            const res = await fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/keys/timeseries`, {
                headers: { 'X-Authorization': `Bearer ${token}` }
            });
            const keys = await res.json();
            updateEntry(entryId, 'telemetryKeys', keys || []);
        } catch (err) {
            console.error('Failed to fetch keys:', err);
            updateEntry(entryId, 'telemetryKeys', []);
        }
    };

    const addEntry = () => {
        setTelemetryEntries(prev => [...prev, { id: Date.now(), deviceId: '', selectedKey: '', customKey: '', value: '' }]);
    };

    const removeEntry = (id) => {
        setTelemetryEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const updateEntry = (id, field, value) => {
        setTelemetryEntries(prev =>
            prev.map(entry => {
                if (entry.id === id) {
                    const updatedEntry = { ...entry, [field]: value };
                    // Reset selectedKey and customKey if deviceId changes
                    if (field === 'deviceId') {
                        updatedEntry.selectedKey = '';
                        updatedEntry.customKey = '';
                        // Also, trigger fetching keys for the new device
                        fetchKeys(value, id);
                    }
                    // Clear customKey if selectedKey is not 'custom'
                    if (field === 'selectedKey' && value !== 'custom') {
                        updatedEntry.customKey = '';
                    }
                    return updatedEntry;
                }
                return entry;
            })
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const entry of telemetryEntries) {
            const keyToSend = entry.selectedKey === 'custom' ? entry.customKey.trim() : entry.selectedKey;

            if (!entry.deviceId || !keyToSend || entry.value === '') {
                alert(`Skipping invalid entry: Device, Key, and Value are required for each row.`);
                failCount++;
                continue;
            }

            try {
                const response = await fetch('/api/thingsboard/sendTelemetry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, deviceId: entry.deviceId, key: keyToSend, value: entry.value })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed for ${entry.deviceId}/${keyToSend}: ${errorText}`);
                }
                successCount++;
            } catch (err) {
                console.error(err);
                failCount++;
            }
        }

        setLoading(false);
        if (successCount > 0) {
            alert(`✅ Sent ${successCount} telemetry entries successfully!`);
        }
        if (failCount > 0) {
            alert(`❌ Failed to send ${failCount} telemetry entries.`);
        }
        // Reset form after submission
        setTelemetryEntries([{ id: Date.now(), deviceId: '', selectedKey: '', customKey: '', value: '' }]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl  p-6 relative">
                <button onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-semibold mb-4 text-blue-700">Manual Telemetry Update</h2>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto ">
                    {telemetryEntries.map((entry, index) => (
                        <div key={entry.id} className="border p-4 rounded-md bg-gray-50 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-800">Entry {index + 1}</h3>
                                {telemetryEntries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(entry.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        &times; Remove
                                    </button>
                                )}
                            </div>
                            {/* Device Selector */}
                            <div>
                                <label className="block text-sm font-medium">Select Device:</label>
                                <select
                                    className="w-full border p-2 rounded mt-1"
                                    value={entry.deviceId}
                                    onChange={e => updateEntry(entry.id, 'deviceId', e.target.value)}
                                >
                                    <option value="">-- Select Device --</option>
                                    {devices.map((d) => (
                                        <option key={d.id.id} value={d.id.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Telemetry Key Selector */}
                            <div>
                                <label className="block text-sm font-medium">Telemetry Key:</label>
                                <select
                                    className="w-full border p-2 rounded mt-1"
                                    value={entry.selectedKey}
                                    onChange={e => updateEntry(entry.id, 'selectedKey', e.target.value)}
                                    disabled={!entry.deviceId}
                                >
                                    <option value="">-- Select Key --</option>
                                    {/* Display keys specific to the selected device */}
                                    {entry.telemetryKeys && entry.telemetryKeys.map(key => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                    <option value="custom">Other (Custom Key)</option>
                                </select>
                            </div>

                            {/* Custom Key Input */}
                            {entry.selectedKey === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium">Custom Key Name:</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded mt-1"
                                        value={entry.customKey}
                                        onChange={e => updateEntry(entry.id, 'customKey', e.target.value)}
                                        placeholder="e.g. temperature"
                                    />
                                </div>
                            )}

                            {/* Value */}
                            <div>
                                <label className="block text-sm font-medium">Value:</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded mt-1"
                                    value={entry.value}
                                    onChange={e => updateEntry(entry.id, 'value', e.target.value)}
                                    placeholder="e.g. 23.5"
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addEntry}
                        className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-md border border-dashed border-blue-300 hover:bg-blue-200"
                    >
                        Add Another Telemetry Entry
                    </button>

                    <div className="flex justify-end space-x-4 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send All Data'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
