'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

export default function CreateDashboardModal({ open, onClose, onNext, existingWidgets = [] }) {
  const [devices, setDevices] = useState([]);
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    if (open) {
      setWidgets(existingWidgets.map(w => ({ ...w })));
    }
  }, [open, existingWidgets]);

  useEffect(() => {
    const tbDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
    const token = localStorage.getItem('tb_token');
    Promise.all(
      tbDevices.map(dev =>
        fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${dev.id.id}/keys/timeseries`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(keys => ({
            id: dev.id.id,
            name: dev.name,
            keys: Array.isArray(keys) ? keys : [],
          }))
      )
    )
      .then(setDevices)
      .catch(console.error);
  }, []);

  const addWidget = () => {
    setWidgets(w => [...w, {
      id: uuidv4(),
      name: '',
      type: 'bargraph',
      parameters: []
    }]);
  };

  const removeWidget = i => {
    setWidgets(w => w.filter((_, idx) => idx !== i));
  };

  const update = (i, field, val) => {
    setWidgets(w => w.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  };

  const addParam = widgetIdx => {
    const newParam = { deviceId: '', key: '', label: '', unit: '' };
    setWidgets(w => w.map((x, idx) => idx === widgetIdx
      ? { ...x, parameters: [...(x.parameters || []), newParam] }
      : x
    ));
  };

  const updateParam = (wIdx, pIdx, field, val) => {
    setWidgets(w => w.map((x, idx) => {
      if (idx !== wIdx) return x;
      const params = x.parameters.map((p, pi) => pi === pIdx ? { ...p, [field]: val } : p);
      return { ...x, parameters: params };
    }));
  };

  const removeParam = (wIdx, pIdx) => {
    setWidgets(w => w.map((x, idx) => {
      if (idx !== wIdx) return x;
      const params = x.parameters.filter((_, pi) => pi !== pIdx);
      return { ...x, parameters: params };
    }));
  };

  const handleNext = () => {
    onNext(widgets);
  };

  const formValid = widgets.every(w =>
    w.name.trim() !== '' &&
    w.parameters.length > 0 &&
    w.parameters.every(p =>
      p.deviceId && p.key && p.label.trim() !== '' && p.unit.trim() !== ''
    )
  );


  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center pt-20 z-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] p-6 rounded shadow overflow-auto">
        <h2 className="text-xl font-bold mb-4">Configure Widgets</h2>
        {widgets.map((w, i) => (
          <div key={w.id} className="border p-3 rounded mb-4 bg-gray-200">
            <div className="grid grid-cols-2 gap-2 md:flex justify-between items-center">
              <input
                type="text"
                placeholder="Widget Name"
                value={w.name}
                onChange={e => update(i, 'name', e.target.value)}
                className="border p-1 rounded flex-1 md:w-2/3"
              />
              <select
                value={w.type}
                onChange={e => update(i, 'type', e.target.value)}
                className="border p-1 ml-2 rounded"
              >
                <option value="bar">Bar Graph</option>
                <option value="line">Line Chart</option>
                <option value="donut">Donut</option>
                <option value="pie">Pie Chart</option>
                {/* other types */}
              </select>

            </div>
            <div className='mt-4'>
              <h4 className="font-medium mb-1">Parameters:</h4>
              {w.parameters.map((p, pi) => (
                <div key={pi} className="grid grid-cols-5 gap-2 mb-3">
                  <select
                    value={p.deviceId}
                    onChange={e => updateParam(i, pi, 'deviceId', e.target.value)}
                    className="border p-1 rounded"
                  >
                    <option value="">Device</option>
                    {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select
                    value={p.key}
                    onChange={e => updateParam(i, pi, 'key', e.target.value)}
                    className="border p-1 rounded"
                    disabled={!p.deviceId}
                  >
                    <option value="">Key</option>
                    {devices.find(d => d.id === p.deviceId)?.keys.map(k => (
                      <option key={k} value={k}>{k}</option>
                    )) || []}
                  </select>
                  <input
                    type="text"
                    placeholder="Label"
                    value={p.label}
                    onChange={e => updateParam(i, pi, 'label', e.target.value)}
                    className="border p-1 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={p.unit}
                    onChange={e => updateParam(i, pi, 'unit', e.target.value)}
                    className="border p-1 rounded"
                  />
                  <button onClick={() => removeParam(i, pi)} className="text-red-500">
                    <FiTrash2 size={20} />
                  </button>
                </div>
              ))}
              <div className='flex justify-between items-center mt-4'>
                <button onClick={() => addParam(i)} className="text-blue-600 mt-1 flex items-center">
                  <FiPlus className='mr-1' size={20} /> Add Parameter
                </button>
                <button onClick={() => removeWidget(i)} className="text-red-600 ml-2 flex items-center">
                  <FiTrash2 className='mr-1' size={20} /> Remove Widget
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-4">
          <button onClick={addWidget} className="text-blue-600 flex items-center">
            <FiPlus className='mr-1' size={20} /> Add Widget
          </button>
          <div>
            <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded mr-2">Cancel</button>
            <button onClick={handleNext} className={clsx("px-3 py-1 rounded", {
                "bg-blue-600 text-white": formValid,
                "bg-gray-400 text-gray-700 cursor-not-allowed": !formValid
              })}
              disabled={!formValid}
            >
              Next
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

