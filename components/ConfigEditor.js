'use client';
import { useEffect, useState } from 'react';

export default function ConfigEditor() {
  const [devices, setDevices] = useState([]);
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);

  const sections = ['inlet', 'pump', 'efficiency', 'output'];

  useEffect(() => {
    const fetchDevices = async () => {
      const tbDevices = JSON.parse(localStorage.getItem('tb_devices'));
      const token = localStorage.getItem('tb_token');
      const results = [];

      for (const device of tbDevices) {
        try {
          const attrRes = await fetch(
            `https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${device.id.id}/values/attributes?keys=telemetryKeys`,
            {
              headers: {
                'X-Authorization': `Bearer ${token}`
              }
            }
          );
          const attr = await attrRes.json();
          let keys = [];

          if (Array.isArray(attr) && attr.length > 0) {
            const telemetryAttr = attr.find(a => a.key === 'telemetryKeys');
            if (telemetryAttr && telemetryAttr.value) {
              keys = telemetryAttr.value.telemetryKeys || [];
            }
          }

          results.push({ id: device.id.id, name: device.name, keys });
        } catch (err) {
          console.error(`Failed to load keys for ${device.name}`, err);
        }
      }

      setDevices(results);
    };

    fetchDevices();
  }, []);


  const handleAdd = (sec) => {
    setConfig(prev => ({
      ...prev,
      [sec]: [...(prev[sec] || []), { deviceId: '', key: '', label: '', format: 'number' }]
    }));
  };

  const handleChange = (sec, idx, field, val) => {
    const arr = [...(config[sec] || [])];
    arr[idx] = { ...arr[idx], [field]: val };
    setConfig(prev => ({ ...prev, [sec]: arr }));
  };

  const saveConfig = async () => {
    setSaving(true);
    const token = localStorage.getItem('tb_token');
    const userId = localStorage.getItem('tb_userId')

    await fetch('/api/thingsboard/saveDashboardConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, config })
    });

    alert('Configuration saved successfully!');
    setSaving(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard Config Editor</h2>
      {sections.map(sec => (
        <div key={sec}>
          <h3 className="font-semibold capitalize">{sec}</h3>
          <button onClick={() => handleAdd(sec)} className="mt-1 px-2 py-1 bg-blue-600 text-white rounded">
            + Add Item
          </button>
          {(config[sec] || []).map((item, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <select value={item.deviceId} onChange={e => handleChange(sec, i, 'deviceId', e.target.value)} className="border p-1">
                <option value="">Device</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={item.key} onChange={e => handleChange(sec, i, 'key', e.target.value)} className="border p-1">
                <option value="">Key</option>
                {devices.find(d => d.id === item.deviceId)?.keys.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <input
                placeholder="Label"
                value={item.label}
                onChange={e => handleChange(sec, i, 'label', e.target.value)}
                className="border p-1"
              />
              <select value={item.format} onChange={e => handleChange(sec, i, 'format', e.target.value)} className="border p-1">
                <option value="number">Number</option>
                <option value="percent">Percent</option>
                <option value="string">String</option>
              </select>
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-end mt-4">
        <button onClick={saveConfig} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">
          {saving ? 'Saving...' : 'Save '}
        </button>
      </div>
    </div>
  );
}
