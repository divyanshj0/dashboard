'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import DeletePopup from './deletepopup';

export default function CreateDashboardModal({ open, onClose, onNext, existingWidgets = [] }) {
  const [devices, setDevices] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState(null);
  const [isparamDelete, setIsparamDelete] = useState(false);
  const [paramToDelete, setParamToDelete] = useState(null);
  useEffect(() => {
    if (open) setWidgets(existingWidgets.map(w => ({ ...w })));
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, existingWidgets, onClose]);

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
      id: uuidv4(), name: '', type: 'bar', parameters: []
    }]);
  };

  const removeWidget = i => setWidgets(w => w.filter((_, idx) => idx !== i));
  const update = (i, field, val) => setWidgets(w => w.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  const addParam = widgetIdx => {
    const newParam = { deviceId: '', key: '', label: '', unit: '' };
    setWidgets(w => w.map((x, idx) => idx === widgetIdx
      ? { ...x, parameters: [...(x.parameters || []), newParam] }
      : x
    ));
  };
  const updateParam = (wIdx, pIdx, field, val) => setWidgets(w => w.map((x, idx) => {
      if (idx !== wIdx) return x;
      const params = x.parameters.map((p, pi) => pi === pIdx ? { ...p, [field]: val } : p);
      return { ...x, parameters: params };
    })
  );
  const removeParam = (wIdx, pIdx) => setWidgets(w => w.map((x, idx) => {
      if (idx !== wIdx) return x;
      const params = x.parameters.filter((_, pi) => pi !== pIdx);
      return { ...x, parameters: params };
    })
  );
  const handleNext = () => onNext(widgets);

  const formValid = widgets.every(w =>
    w.name.trim() !== ''
    && w.parameters.length > 0
    && w.parameters.every(p =>
      p.deviceId && p.key && p.label.trim() !== '' && p.unit.trim() !== ''));

  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-3xl w-full mx-4 rounded-2xl shadow-2xl bg-white overflow-y-auto max-h-[90vh] p-0 ring-1 ring-gray-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-800">Configure Widgets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 duration-150">
            <FiX size={28} />
          </button>
        </div>

        <div className="px-8 py-8 bg-gray-50">
          {/* Widgets */}
          <div className="space-y-6">
            {widgets.map((w, i) => (
              <section
                key={w.id}
                className="group transition border relative py-5 px-6 rounded-xl bg-white hover:shadow-lg hover:border-blue-400 duration-100"
              >
                {/* Widget Header */}
                <div className="flex flex-wrap gap-3 mb-4 items-baseline">
                  <input
                    type="text"
                    className={clsx(
                      "text-xl font-semibold bg-transparent outline-none border-b focus:border-blue-500 duration-200 transition flex-1 mr-2 py-1",
                      !w.name.trim() && "border-red-400"
                    )}
                    placeholder="Widget Name"
                    value={w.name}
                    onChange={e => update(i, "name", e.target.value)}
                  />
                  <select
                    value={w.type}
                    onChange={e => update(i, "type", e.target.value)}
                    className="border bg-white py-1 px-3 text-sm rounded-lg font-medium focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="bar">Bar Graph</option>
                    <option value="line">Line Chart</option>
                    <option value="donut">Donut</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                  <button
                    onClick={() => { setWidgetToDelete(i); setIsDeletePopupOpen(true); }}
                    title="Remove Widget"
                    className="ml-auto opacity-30 group-hover:opacity-100 transition hover:text-red-700 outline-none"
                  >
                    <FiTrash2 size={24} />
                  </button>
                </div>
                
                {/* Parameters Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-700">Parameters</h4>
                    <button
                      onClick={() => addParam(i)}
                      className="inline-flex items-center text-blue-700 px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 font-medium text-sm"
                    >
                      <FiPlus size={18} className="mr-1" /> Add
                    </button>
                  </div>
                  {w.parameters.length === 0 && (
                    <div className="text-xs text-gray-500 mb-4">Add at least one parameter.</div>
                  )}
                  <div className="space-y-4">
                    {w.parameters.map((p, pi) => (
                      <div
                        key={pi}
                        className={clsx("grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-white rounded-lg px-3 py-2 shadow-sm border", 
                          (!p.deviceId || !p.key || !p.label.trim() || !p.unit.trim()) && "border-red-300 ring-2 ring-red-100"
                        )}
                      >
                        <select value={p.deviceId} onChange={e => updateParam(i, pi, 'deviceId', e.target.value)} className="border rounded-lg p-2 focus:ring-blue-400">
                          <option value="">Device</option>
                          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={p.key} onChange={e => updateParam(i, pi, 'key', e.target.value)} className="border rounded-lg p-2 focus:ring-blue-400" disabled={!p.deviceId} >
                          <option value="">Key</option>
                          {devices.find(d => d.id === p.deviceId)?.keys.map(k =>
                            <option key={k} value={k}>{k}</option>
                          ) || []}
                        </select>
                        <input
                          type="text"
                          placeholder="Label"
                          value={p.label}
                          onChange={e => updateParam(i, pi, 'label', e.target.value)}
                          className="border rounded-lg p-2 focus:ring-blue-400"/>
                        <input
                          type="text"
                          placeholder="Unit"
                          value={p.unit}
                          onChange={e => updateParam(i, pi, 'unit', e.target.value)}
                          className="border rounded-lg p-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => { setWidgetToDelete(i); setParamToDelete(pi); setIsparamDelete(true);}}
                          className="text-red-500 hover:text-red-700 outline-none ml-auto"
                          title="Remove Parameter"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
            <button
              onClick={addWidget}
              className="w-full flex items-center justify-center text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-dashed border-blue-300 py-3 font-bold mt-3"
            >
              <FiPlus className="mr-2" size={22} /> Add Widget
            </button>
          </div>
        </div>
        {isDeletePopupOpen && (
        <DeletePopup
          onConfirm={() => {removeWidget(widgetToDelete); setIsDeletePopupOpen(false); setWidgetToDelete(null);}}
          onCancel={() => { setIsDeletePopupOpen(false); setWidgetToDelete(null); }}
        />
        )}
        {isparamDelete &&(
          <DeletePopup
            onConfirm={() => { removeParam(widgetToDelete, paramToDelete); setIsparamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
            onCancel={() => { setIsparamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t bg-white">
          <button
            onClick={onClose}
            className="text-gray-600 bg-gray-100 py-2 px-5 rounded-lg hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={!formValid}
            className={clsx(
              "py-2 px-7 rounded-lg text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition",
              formValid
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
