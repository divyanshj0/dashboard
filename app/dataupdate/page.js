'use client';
import { useEffect, useState } from 'react';

export default function DataUpdatePage() {
    const [token, setToken] = useState('');
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState('');
    const [telemetryKeys, setTelemetryKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [customKey, setCustomKey] = useState('');
    const [value, setValue] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem('tb_token');
        const storedDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
        if (storedToken) setToken(storedToken);
        if (storedDevices.length > 0) {
            setDevices(storedDevices);
        }
    }, []);

    useEffect(() => {
        const fetchKeys = async () => {
            if (!deviceId || !token) return;
            try {
                const res = await fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${deviceId}/keys/timeseries`, {
                    headers: { 'X-Authorization': `Bearer ${token}` }
                });
                const keys = await res.json();
                setTelemetryKeys(keys || []);
            } catch (err) {
                console.error('Failed to fetch keys:', err);
                setTelemetryKeys([]);
            }
        };
        fetchKeys();
    }, [deviceId, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const keyToSend = selectedKey === 'custom' ? customKey.trim() : selectedKey;
        if (!deviceId || !keyToSend || !value) return alert('All fields are required.');

        try {
            const response = await fetch('/api/thingsboard/sendTelemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, deviceId, key: keyToSend, value })
            });

            if (!response.ok) throw new Error('Failed to send telemetry');

            alert('✅ Telemetry sent successfully!');
            setSelectedKey('');
            setCustomKey('');
            setValue('');
            setDeviceId('');
        } catch (err) {
            console.error(err);
            alert('❌ Failed to send telemetry');
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-semibold mb-4">Manual Telemetry Update</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Device Selector */}
                <div>
                    <label className="block text-sm font-medium">Select Device:</label>
                    <select
                        className="w-full border p-2 rounded mt-1"
                        value={deviceId}
                        onChange={(e) => {
                            setDeviceId(e.target.value);
                            setSelectedKey('');
                            setCustomKey('');
                        }}
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
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                    >
                        <option value="">-- Select Key --</option>
                        {telemetryKeys.map((key) => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                        <option value="custom">Other (Custom Key)</option>
                    </select>
                </div>

                {/* Custom Key Input */}
                {selectedKey === 'custom' && (
                    <div>
                        <label className="block text-sm font-medium">Custom Key Name:</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded mt-1"
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
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
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="e.g. 23.5"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Send Telemetry
                </button>

            </form>
        </div>
    );
}
