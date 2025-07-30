'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiPlus, FiTrash2, FiX, FiUploadCloud } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import DeletePopup from './deletepopup';
import { toast } from 'react-toastify';

export default function CreateDashboardModal({ open, onClose, onNext, existingWidgets = [], userAuthority }) { // Added userAuthority prop
  const [devices, setDevices] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState(null);
  const [isParamDelete, setIsParamDelete] = useState(false);
  const [paramToDelete, setParamToDelete] = useState(null);

  const [availableImages, setAvailableImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const Tb_Url="https://demo.thingsboard.io"

  useEffect(() => {
    if (open) {
      setWidgets(existingWidgets.map(w => ({
        ...w,
        parameters: w.parameters ? w.parameters.map(p => ({ ...p })) : []
      })));
    }
    
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

    if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
    }

    Promise.all(
      tbDevices.map(dev =>
        fetch(`https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/${dev.id.id}/keys/timeseries`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        })
          .then(res => {
              if (!res.ok) {
                  console.warn(`Failed to fetch keys for device ${dev.name} (${dev.id.id}): ${res.status} ${res.statusText}`);
                  return [];
              }
              return res.json();
          })
          .then(keys => ({
            id: dev.id.id,
            name: dev.name,
            keys: Array.isArray(keys) ? keys : [],
          }))
          .catch(err => {
            console.error(`Error fetching keys for device ${dev.name} (${dev.id.id}):`, err);
            return { id: dev.id.id, name: dev.name, keys: [] };
          })
      )
    )
      .then(setDevices)
      .catch(err => {
          console.error("Overall error fetching devices keys:", err);
          toast.error("Failed to load device telemetry keys.");
      });
  }, []);

  const fetchAvailableImages = async () => {
    const token = localStorage.getItem('tb_token');
    if (!token) return;

    try {
      const res = await fetch('/api/thingsboard/getimage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pageSize: 100, page: 0 }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch available images.');
      }
      const images = await res.json();
      setAvailableImages(images.map(img => ({
          id: img.id.id,
          title: img.title,
          publicLink: img.publicLink
      })));
    } catch (err) {
      console.error('Error fetching images:', err);
      toast.error('Failed to load available images.');
    }
  };

  useEffect(() => {
    if (open && userAuthority === 'TENANT_ADMIN') { // Only fetch images if user is Tenant Admin
      fetchAvailableImages();
    }
  }, [open, userAuthority]); // Depend on userAuthority as well


  const addWidget = () => {
    setWidgets(w => [...w, {
      id: uuidv4(),
      name: '',
      type: 'bar', // Default to bar graph
      parameters: []
    }]);
  };

  const removeWidget = (indexToRemove) => {
    setWidgets(w => w.filter((_, idx) => idx !== indexToRemove));
  };

  const update = (indexToUpdate, field, val) => setWidgets(w => w.map((x, idx) => idx === indexToUpdate ? { ...x, [field]: val } : x));
  
  const updateImageParam = (widgetIdx, field, val) => {
    setWidgets(w => w.map((x, idx) => {
      if (idx !== widgetIdx) return x;
      const newParams = [{ ...(x.parameters?.[0] || {}) }];
      
      if (field === 'imageId') {
          const selectedImage = availableImages.find(img => img.id === val);
          newParams[0].imageId = val;
          newParams[0].publicLink = selectedImage ? selectedImage.publicLink : '';
          newParams[0].title = selectedImage ? selectedImage.title : '';
      } else {
          newParams[0][field] = val;
      }
      return { ...x, parameters: newParams };
    }));
  };

  const handleImageUpload = async (widgetId) => {
    if (!newImageFile || !newImageTitle.trim()) {
      toast.warn('Please select an image file and provide a title.');
      return;
    }
    setUploadingImage(true);
    const token = localStorage.getItem('tb_token');
    if (!token) {
      toast.error('Authentication token missing.');
      setUploadingImage(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', newImageFile);
    formData.append('title', newImageTitle.trim());

    try {
      const res = await fetch('/api/thingsboard/uploadimage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed.');
      }

      const uploadedImageInfo = await res.json();
      toast.success('Image uploaded successfully!');
      
      setWidgets(prevWidgets => prevWidgets.map(w => {
        if (w.id === widgetId) {
          return {
            ...w,
            parameters: [{
              imageId: uploadedImageInfo.id.id,
              publicLink: uploadedImageInfo.publicLink,
              title: uploadedImageInfo.title,
            }],
          };
        }
        return w;
      }));

      setNewImageFile(null);
      setNewImageTitle('');
      if (document.getElementById(`new-image-file-${widgetId}`)) {
        document.getElementById(`new-image-file-${widgetId}`).value = '';
      }
      fetchAvailableImages();

    } catch (err) {
      console.error('Error during image upload:', err);
      toast.error(err.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };


  const addParam = (widgetIdx) => {
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

  const formValid = widgets.length > 0 && widgets.every(w => {
    if (w.name.trim() === '') return false;

    if (w.type === 'image') {
      return w.parameters.length > 0 && w.parameters[0].imageId;
    } else {
      return w.parameters.length > 0 &&
             w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '' && p.unit.trim() !== '');
    }
  });

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
            {!widgets.length && (
              <p className="text-center text-gray-500">Click "Add Widget" to start configuring your dashboard.</p>
            )}
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
                    <option value="card">Value Card</option>
                    <option value="chemicaldosage">Chemical Dosage</option>
                    {/* Conditionally render Image option */}
                    {userAuthority === 'TENANT_ADMIN' && <option value="image">Image</option>}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setWidgetToDelete(i); setIsDeletePopupOpen(true); }}
                    title="Remove Widget"
                    className="ml-auto opacity-30 group-hover:opacity-100 transition hover:text-red-700 outline-none"
                  >
                    <FiTrash2 size={24} />
                  </button>
                </div>
                
                {/* Parameters Section - Conditional Rendering */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {w.type === 'image' ? (
                    // Image Widget Parameters
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Image Source</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Existing Image:</label>
                            <select
                                value={w.parameters[0]?.imageId || ''} 
                                onChange={e => updateImageParam(i, 'imageId', e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-blue-400"
                            >
                                <option value="">-- Select Image --</option>
                                {availableImages.map(img => (
                                    <option key={img.id} value={img.id}>
                                        {img.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Or Upload New Image:</h4>
                            <div>
                                <label htmlFor={`new-image-file-${w.id}`} className="block text-sm font-medium text-gray-700">Image File:</label>
                                <input
                                    type="file"
                                    id={`new-image-file-${w.id}`}
                                    accept="image/*"
                                    onChange={e => setNewImageFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <div className="mt-2">
                                <label htmlFor={`new-image-title-${w.id}`} className="block text-sm font-medium text-gray-700">Image Title:</label>
                                <input
                                    type="text"
                                    id={`new-image-title-${w.id}`}
                                    placeholder="Enter image title"
                                    value={newImageTitle}
                                    onChange={e => setNewImageTitle(e.target.value)}
                                    className="w-full border rounded-lg p-2 focus:ring-blue-400"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleImageUpload(w.id)}
                                disabled={uploadingImage || !newImageFile || !newImageTitle.trim()}
                                className={clsx(
                                    "mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                                    (uploadingImage || !newImageFile || !newImageTitle.trim()) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploadingImage ? 'Uploading...' : <><FiUploadCloud className="mr-2" /> Upload Image</>}
                            </button>
                        </div>
                        {w.parameters[0]?.imageId && (
                            <p className="text-sm text-gray-600 mt-4">
                                Currently selected: <span className="font-semibold">{availableImages.find(img => img.id === w.parameters[0]?.imageId)?.title ||w.parameters[0].title}</span>
                            </p>
                        )}
                         {w.parameters[0]?.publicLink && (
                            <p className="text-sm text-gray-600 mt-2 break-words">
                                Link: <a href={`${Tb_Url}${w.parameters[0].publicLink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Image Preview</a>
                            </p>
                        )}
                    </div>
                  ) : (
                    // Graph Widget Parameters (existing logic)
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-700">Parameters</h4>
                        <button
                          type="button"
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
                              type="button"
                              onClick={() => { setWidgetToDelete(i); setParamToDelete(pi); setIsParamDelete(true);}}
                              className="text-red-500 hover:text-red-700 outline-none ml-auto"
                              title="Remove Parameter"
                            >
                              <FiTrash2 size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}
            <button
              type="button"
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
        {isParamDelete &&(
          <DeletePopup
            onConfirm={() => { removeParam(widgetToDelete, paramToDelete); setIsParamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
            onCancel={() => { setIsParamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t bg-white">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 bg-gray-100 py-2 px-5 rounded-lg hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!formValid}
            className={clsx(
              "py-2 px-7 rounded-lg text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition",
              formValid
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}