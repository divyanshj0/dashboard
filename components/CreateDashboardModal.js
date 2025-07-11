'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

export default function CreateDashboardModal({ open, onClose, onNext, existingWidgets = [] }) {
  const [widgets, setWidgets] = useState([]);
  const [devices, setDevices] = useState([]);
  // Load existing widgets when modal opens
  useEffect(() => {
    const tbDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
    const token = localStorage.getItem('tb_token');

    Promise.all(
      tbDevices.map(dev =>
        fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${dev.id.id}/values/attributes?keys=telemetryKeys`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        }).then(res => res.json()).then(attrs => {
          const teleAttr = attrs.find(a => a.key === 'telemetryKeys');
          const keys = teleAttr?.value?.telemetryKeys || [];
          return { id: dev.id.id, name: dev.name, keys };
        })
      )
    ).then(setDevices).catch(console.error);
    if (open) {
      // Deep copy to prevent modifying original props
      const copied = existingWidgets.map(w => ({ ...w }));
      setWidgets(copied);
    }
  }, [open, existingWidgets]);

  const updateWidget = (index, field, value) => {
    const updated = [...widgets];
    updated[index][field] = value;
    setWidgets(updated);
  };

  const addWidget = () => {
    setWidgets([
      ...widgets,
      {
        id: uuidv4(),
        name: '',
        deviceId: '',
        key: '',
        unit: '',
        type: 'linechart',
      },
    ]);
  };

  const removeWidget = (index) => {
    const updated = [...widgets];
    updated.splice(index, 1);
    setWidgets(updated);
  };

  const handleNext = () => {
    onNext(widgets);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md shadow-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-xl font-semibold mb-4">Configure Dashboard Widgets</h2>

        <div className="grid grid-cols-1 gap-4">
          {widgets.map((wd, i) => (
          <div key={wd.id || i} className="grid grid-cols-6 gap-2 items-center mb-2">
            <input
              className="col-span-2 p-2 border rounded"
              placeholder="Name"
              value={wd.name}
              onChange={e => updateWidget(i, 'name', e.target.value)}
            />
            <select
              className="col-span-1 p-2 border rounded"
              value={wd.deviceId}
              onChange={e => updateWidget(i, 'deviceId', e.target.value)}
            >
              <option value="">Device</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              className="col-span-1 p-2 border rounded"
              value={wd.key}
              onChange={e => updateWidget(i, 'key', e.target.value)}
              disabled={!wd.deviceId}
            >
              <option value="">Telemetry</option>
              {devices.find(d => d.id === wd.deviceId)?.keys.map(k => (
                <option key={k} value={k}>{k}</option>
              )) || []}
            </select>
            <input
              className="col-span-1 p-2 border rounded"
              placeholder="Unit"
              value={wd.unit}
              onChange={e => updateWidget(i, 'unit', e.target.value)}
            />
            <select
              className="col-span-1 p-2 border rounded"
              value={wd.type}
              onChange={e => updateWidget(i, 'type', e.target.value)}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
              <option value="donut">Donut</option>
              <option value="table">Table</option>
            </select>
              <button
                onClick={() => removeWidget(i)}
                className="col-span-1 text-red-600 flex gap-1 items-center"
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={addWidget}
            className="flex items-center gap-2 text-blue-600"
          >
            <FiPlus /> Add Widget
          </button>

          <div className="flex gap-3">
            <button
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
