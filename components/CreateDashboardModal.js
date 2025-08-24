import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiPlus, FiTrash2, FiX, FiUploadCloud } from 'react-icons/fi';
import { FaRegImage } from "react-icons/fa6";
import { v4 as uuidv4 } from 'uuid';
import DeletePopup from './deletepopup';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import ShowPreviewModal from './ImagePreviewModal';
export default function CreateDashboardModal({ open, onClose, onNext, existingWidgets = [], existingThresholds = {}, userAuthority }) {
  const router = useRouter()
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewImageLink, setPreviewImageLink] = useState('');
  const [previewImageTitle, setPreviewImageTitle] = useState('');
  const Tb_Url = process.env.NEXT_PUBLIC_TB_URL;

  useEffect(() => {
    if (open) {
      // Deep copy widgets to avoid direct mutation
      const initialWidgets = existingWidgets.map(w => ({
        ...w,
        parameters: w.parameters ? w.parameters.map(p => ({ ...p })) : []
      }));

      // Merge existing thresholds into widget parameters
      const widgetsWithThresholds = initialWidgets.map(widget => {
        if (!widget.parameters) return widget;

        const updatedParameters = widget.parameters.map(param => {
          const thresholdsForDevice = existingThresholds[param.deviceId];
          const thresholdForKey = thresholdsForDevice?.[param.key];

          if (thresholdForKey) {
            return {
              ...param,
              min: thresholdForKey.min !== null ? thresholdForKey.min : '',
              max: thresholdForKey.max !== null ? thresholdForKey.max : '',
            };
          }
          return param;
        });

        return { ...widget, parameters: updatedParameters };
      });

      setWidgets(widgetsWithThresholds);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, existingWidgets, onClose, existingThresholds]);

  useEffect(() => {
    const tbDevices = JSON.parse(localStorage.getItem('tb_devices') || '[]');
    const token = localStorage.getItem('tb_token');

    if (!token) {
      toast.error('Authentication token missing. Please log in again.');
      return;
    }

    Promise.all(
      tbDevices.map(dev =>
        fetch(`${Tb_Url}/api/plugins/telemetry/DEVICE/${dev.id.id}/keys/timeseries`, {
          headers: { 'X-Authorization': `Bearer ${token}` },
        })
          .then(res => {
            if (res.status === 401) {
              localStorage.clear();
              toast.error('Session expired. Please log in again.');
              router.push('/');
              return [];
            }
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
      if (res.status === 401) {
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        router.push('/');
        return;
      }
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
    if (open && userAuthority === 'TENANT_ADMIN') {
      fetchAvailableImages();
    }
  }, [open, userAuthority]);


  const addWidget = () => {
    setWidgets(w => [...w, {
      id: uuidv4(),
      name: '',
      unit: '',
      type: 'bar', // Default to bar graph
      parameters: []
    }]);
  };

  const removeWidget = (indexToRemove) => {
    setWidgets(w => w.filter((_, idx) => idx !== indexToRemove));
  };

  const update = (indexToUpdate, field, val) => {
    setWidgets(w => w.map((x, idx) => {
      if (idx === indexToUpdate) {
        const updatedWidget = { ...x, [field]: val };
        if (field === 'type' && x.type !== val) {
          updatedWidget.parameters = [];
        }
        return updatedWidget;
      }
      return x;
    }));
  };

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
    if (!newImageFile) {
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
      if (res.status === 401) {
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        router.push('/');
        return;
      }
      if (!res.ok) {
        toast.error('Image upload failed');
        setUploadingImage(false);
        return;
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
    const widgetType = widgets[widgetIdx].type;
    let newParam = {};

    if (widgetType === 'map') {
      newParam = { deviceId: '', name: '', latKey: '', lonKey: '' };
    } else if (widgetType === 'card') {
      newParam = { deviceId: '', key: '', label: '', min: '', max: '', unit: '' };
    } else if (widgetType === 'table') {
      newParam = { deviceId: '', name: '', keys: [] };
    } else {
      newParam = { deviceId: '', key: '', label: '', min: '', max: '' };
    }

    setWidgets(w => w.map((x, idx) => idx === widgetIdx
      ? { ...x, parameters: [...(x.parameters || []), newParam] }
      : x
    ));
  };

  const updateParam = (wIdx, pIdx, field, val) => {
    if (field === 'min' || field === 'max' || field === 'unit') {
      // Find the specific deviceId and key for the parameter being updated
      const currentParam = widgets[wIdx].parameters[pIdx];
      const { deviceId, key } = currentParam;

      // Update all parameters that match the same deviceId and key
      setWidgets(w => w.map(widget => ({
        ...widget,
        parameters: widget.parameters.map(param =>
          (param.deviceId === deviceId && param.key === key)
            ? { ...param, [field]: val }
            : param
        )
      })));
    } else {
      setWidgets(w => w.map((x, idx) => {
        if (idx !== wIdx) return x;
        const params = x.parameters.map((p, pi) => {
          if (pi === pIdx) {
            const updatedParam = { ...p, [field]: val };

            if (field === 'key' || field === 'deviceId') {
              const thresholdsForDevice = existingThresholds[updatedParam.deviceId];
              const thresholdForKey = thresholdsForDevice?.[updatedParam.key];
              if (thresholdForKey) {
                updatedParam.min = thresholdForKey.min !== null ? thresholdForKey.min : '';
                updatedParam.max = thresholdForKey.max !== null ? thresholdForKey.max : '';
              } else {
                updatedParam.min = '';
                updatedParam.max = '';
              }
            }
            return updatedParam;
          }
          return p;
        });
        return { ...x, parameters: params };
      }));
    }
  };

  const handleTableKeyChange = (widgetIndex, paramIndex, key, isChecked) => {
    const updatedWidgets = [...widgets];
    const widgetToUpdate = updatedWidgets[widgetIndex];
    const allDeviceParams = widgetToUpdate.parameters;

    const keyWithUnit = isChecked ? { key, unit: '' } : null;

    const newAllDeviceParams = allDeviceParams.map((p, i) => {
      let newKeys = p.keys ? [...p.keys] : [];
      const keyExists = newKeys.some(k => k.key === key);

      if (isChecked && !keyExists) {
        newKeys.push(keyWithUnit);
      } else if (!isChecked && keyExists) {
        newKeys = newKeys.filter(k => k.key !== key);
      }

      return { ...p, keys: newKeys };
    });

    updatedWidgets[widgetIndex] = { ...widgetToUpdate, parameters: newAllDeviceParams };
    setWidgets(updatedWidgets);
  };

  const handleTableUnitChange = (widgetIndex, paramIndex, key, unitValue) => {
    setWidgets(widgets => widgets.map((widget, wIdx) => {
      if (wIdx !== widgetIndex) return widget;
      const updatedParams = widget.parameters.map(param => {
        const newKeys = param.keys.map(k => {
          if (k.key === key) {
            return { ...k, unit: unitValue };
          }
          return k;
        });
        return { ...param, keys: newKeys };
      });
      return { ...widget, parameters: updatedParams };
    }));
  };

  const removeParam = (wIdx, pIdx) => setWidgets(w => w.map((x, idx) => {
    if (idx !== wIdx) return x;
    const params = x.parameters.filter((_, pi) => pi !== pIdx);
    return { ...x, parameters: params };
  }));

  const handleDeviceChange = (widgetIndex, paramIndex, deviceId) => {
    const selectedDevice = devices.find(d => d.id === deviceId);
    setWidgets(w => w.map((widget, wIdx) => {
      if (wIdx !== widgetIndex) return widget;
      const updatedParams = widget.parameters.map((param, pIdx) => {
        if (pIdx === paramIndex) {
          const updatedParam = {
            ...param,
            deviceId: deviceId,
            name: selectedDevice ? selectedDevice.name : '',
            keys: []
          };

          const thresholdsForDevice = existingThresholds[deviceId];
          if (thresholdsForDevice?.[updatedParam.key]) {
            const thresholdForKey = thresholdsForDevice[updatedParam.key];
            updatedParam.min = thresholdForKey.min !== null ? thresholdForKey.min : '';
            updatedParam.max = thresholdForKey.max !== null ? thresholdForKey.max : '';
          } else {
            updatedParam.min = '';
            updatedParam.max = '';
          }
          return updatedParam;
        }
        return param;
      });
      return { ...widget, parameters: updatedParams };
    }));
  };

  const handleNext = async () => {
    onNext(widgets);
    const token = localStorage.getItem('tb_token');
    if (!token) {
      console.error('Authentication token not found.');
      return;
    }
    const deviceThresholds = {};
    widgets.forEach(widget => {
      if (widget.type === 'image' || widget.type === 'map' || widget.type === 'table') {
        return;
      }
      widget.parameters.forEach(param => {
        if (param.min !== '' || param.max !== '') {
          if (!deviceThresholds[param.deviceId]) {
            deviceThresholds[param.deviceId] = {};
          }
          deviceThresholds[param.deviceId][param.key] = {
            min: param.min !== '' ? Number(param.min) : null,
            max: param.max !== '' ? Number(param.max) : null,
          };
        }
      });
    });

    for (const deviceId in deviceThresholds) {
      if (Object.keys(deviceThresholds[deviceId]).length > 0) {
        try {
          const res = await fetch('/api/thingsboard/saveThresholds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              deviceId: deviceId,
              thresholds: deviceThresholds[deviceId],
            }),
          });
          if (res.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            return;
          }
          if (!res.ok) {
            const errorData = await res.json();
            toast.error(`Failed to save thresholds for device ${deviceId}: ${errorData.error || res.statusText}`);
          }
        } catch (err) {
          console.error(`Error saving thresholds for device ${deviceId}:`, err);
          toast.error(`Error saving thresholds for device ${deviceId}.`);
        }
      }
    }
  };

  const formValid = widgets.length > 0 && widgets.every(w => {
    if (w.name.trim() === '') return false;
    if (w.type === 'image') {
      return w.parameters.length > 0 && w.parameters[0].imageId;
    } else if (w.type === 'map') {
      if (w.parameters.length === 0) return false;
      return w.parameters.every(p => p.deviceId && p.name && p.latKey && p.lonKey);
    } else if (w.type === 'card') {
      return w.parameters.length > 0 && w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '' && p.unit.trim() !== '');
    } else if (w.type === 'table') {
      if (w.parameters.length === 0) return false;
      const firstParamKeys = w.parameters[0].keys.map(k => k.key).sort();
      const firstParamUnits = w.parameters[0].keys.map(k => k.unit).filter(Boolean);
      if (firstParamKeys.length === 0 || firstParamUnits.length !== firstParamKeys.length) return false;

      return w.parameters.every(p => {
        const currentParamKeys = p.keys.map(k => k.key).sort();
        const currentParamUnits = p.keys.map(k => k.unit).filter(Boolean);
        return p.deviceId && p.name &&
          currentParamKeys.length === firstParamKeys.length &&
          currentParamUnits.length === currentParamKeys.length &&
          currentParamKeys.every((key, i) => key === firstParamKeys[i]);
      });
    } else if (w.type === 'donut') {
      // Donut chart must have exactly 1 parameter
      return w.parameters.length === 1 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    } else if (w.type === 'pie') {
      // Pie chart must have at least 2 parameters
      return w.parameters.length >= 2 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    } else if (w.type === 'alarms') {
      return true;
    } else {
      return w.parameters.length > 0 &&
        w.parameters.every(p => p.deviceId && p.key && p.label.trim() !== '') && w.unit !== '';
    }
  });

  if (!open) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-4xl w-full mx-4 rounded-2xl shadow-2xl bg-white overflow-y-auto max-h-[90vh] p-0 ring-1 ring-gray-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-800">Configure Widgets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 duration-150">
            <FiX size={28} />
          </button>
        </div>
        <div className="px-8 py-8 bg-gray-50">
          <div className="space-y-6">
            {!widgets.length && (
              <p className="text-center text-gray-500">Click "Add Widget" to start configuring your dashboard.</p>
            )}
            {widgets.map((w, i) => (
              <section
                key={w.id}
                className="group transition border relative py-5 px-6 rounded-xl bg-white hover:shadow-lg hover:border-blue-400 duration-100"
              >
                <div className="flex flex-wrap gap-3 mb-4 items-center">
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
                    className=" md:w-1/6 border bg-white py-1 px-3 text-sm rounded-lg font-medium focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="bar">Bar Graph</option>
                    <option value="line">Line Chart</option>
                    <option value="donut">Donut</option>
                    <option value="pie">Pie Chart</option>
                    <option value="card">Value Card</option>
                    {userAuthority === 'TENANT_ADMIN' && <option value="image">Image</option>}
                    <option value="map">Map</option>
                    <option value="table">Table</option>
                    <option value="alarms">Alarms</option>
                  </select>
                  {(w.type !== 'image' && w.type !== 'map' && w.type !== 'card' && w.type !== 'table' && w.type !== 'alarms') && (
                    <input
                      type="text"
                      placeholder="Unit"
                      value={w.unit || ''}
                      onChange={e => update(i, 'unit', e.target.value)}
                      className="md:w-1/8 text-md bg-transparent outline-none border rounded-md px-2 focus:border-blue-500 duration-200 transition mr-2 py-1"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => { setWidgetToDelete(i); setIsDeletePopupOpen(true); }}
                    title="Remove Widget"
                    className="ml-auto opacity-30 group-hover:opacity-100 transition hover:text-red-700 outline-none"
                  >
                    <FiTrash2 size={24} />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {w.type === 'image' ? (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Image Source</h4>
                      <label className="block text-sm font-medium text-gray-700">Select Image:</label>
                      <div className='flex flex-col gap-2 md:flex md:flex-row md:items-center'>
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
                        <input type="file" id={`new-image-file-${w.id}`} accept="image/*"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              setNewImageFile(file);
                              setNewImageTitle(file.name.replace(/\.[^/.]+$/, "")); // filename without extension
                            }
                          }}
                          className="w-full text-sm file:bg-blue-100 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-2  00"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageUpload(w.id)}
                          disabled={uploadingImage || !newImageFile}
                          className={clsx(
                            "inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            (uploadingImage || !newImageFile) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {uploadingImage ? 'Uploading...' : <><FiUploadCloud size={28} className="mr-2" /> Upload Image</>}
                        </button>
                      </div>
                      {w.parameters[0]?.publicLink && (
                        <div className="text-sm mt-2 break-words cursor-pointer text-blue-500 w-max flex items-center"
                          onClick={() => {
                            setPreviewImageLink(w.parameters[0].publicLink);
                            setPreviewImageTitle(w.parameters[0].title);
                            setShowPreview(true);
                          }}
                        ><FaRegImage size={20} className='mr-2' />
                          Image Preview
                        </div>
                      )}
                    </div>
                  ) : w.type === 'map' ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-700">Devices to Display</h4>
                        <button
                          type="button"
                          onClick={() => addParam(i)}
                          className="inline-flex items-center text-blue-700 px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 font-medium text-sm"
                        >
                          <FiPlus size={18} className="mr-1" /> Add Device
                        </button>
                      </div>
                      {w.parameters.length === 0 && (
                        <div className="text-xs text-gray-500 mb-4">Add at least one device to display on the map.</div>
                      )}
                      <div className="space-y-4">
                        {w.parameters.map((p, pi) => {
                          const selectedDeviceKeys = devices.find(d => d.id === p.deviceId)?.keys || [];
                          const isInvalid = !p.deviceId || !p.latKey || !p.lonKey;

                          return (
                            <div
                              key={pi}
                              className={clsx("grid grid-cols-1 md:flex md:gap-5 items-center bg-white rounded-lg px-3 py-2 shadow-sm border",
                                isInvalid && "border-red-300 ring-2 ring-red-100"
                              )}
                            >
                              <select
                                value={p.deviceId}
                                onChange={e => updateParam(i, pi, 'deviceId', e.target.value)}
                                className="border rounded-lg p-2 focus:ring-blue-400"
                              >
                                <option value="">Select Device</option>
                                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                              <select
                                value={p.latKey}
                                onChange={e => updateParam(i, pi, 'latKey', e.target.value)}
                                className="border rounded-lg p-2 focus:ring-blue-400"
                                disabled={!p.deviceId}
                              >
                                <option value="">Select Latitude Key</option>
                                {selectedDeviceKeys.map(key => <option key={key} value={key}>{key}</option>)}
                              </select>
                              <select
                                value={p.lonKey}
                                onChange={e => updateParam(i, pi, 'lonKey', e.target.value)}
                                className="border rounded-lg p-2 focus:ring-blue-400"
                                disabled={!p.deviceId}
                              >
                                <option value="">Select Longitude Key</option>
                                {selectedDeviceKeys.map(key => <option key={key} value={key}>{key}</option>)}
                              </select>
                              <button
                                type="button"
                                onClick={() => { setWidgetToDelete(i); setParamToDelete(pi); setIsParamDelete(true); }}
                                className="text-red-500 hover:text-red-700 outline-none ml-auto"
                                title="Remove Device"
                              >
                                <FiTrash2 size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : w.type === 'table' ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-700">Devices and Telemetry Keys</h4>
                        <button
                          type="button"
                          onClick={() => addParam(i)}
                          className="inline-flex items-center text-blue-700 px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 font-medium text-sm"
                        >
                          <FiPlus size={18} className="mr-1" /> Add Device
                        </button>
                      </div>
                      {w.parameters.length === 0 && (
                        <div className="text-xs text-gray-500 mb-4">Add at least one device to display on the table.</div>
                      )}
                      <div className="space-y-4">
                        {w.parameters.map((p, pi) => {
                          const selectedDeviceKeys = devices.find(d => d.id === p.deviceId)?.keys || [];
                          const firstParamKeys = w.parameters[0]?.keys.map(k => k.key).sort();
                          const currentParamKeys = p.keys.map(k => k.key).sort();
                          const isInvalid = firstParamKeys && firstParamKeys.length > 0 && JSON.stringify(firstParamKeys) !== JSON.stringify(currentParamKeys);

                          return (
                            <div key={pi} className={clsx("flex flex-col gap-2 p-3 border rounded-lg bg-white shadow-sm", {
                              'border-red-500 ring-2 ring-red-300': isInvalid
                            })}>
                              <div className="flex justify-between items-center">
                                <select
                                  value={p.deviceId}
                                  onChange={e => handleDeviceChange(i, pi, e.target.value)}
                                  className="flex-1 border rounded-lg p-2 focus:ring-blue-400"
                                >
                                  <option value="">Select Device</option>
                                  {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => { setWidgetToDelete(i); setParamToDelete(pi); setIsParamDelete(true); }}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={20} />
                                </button>
                              </div>
                              <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-100">
                                <h5 className="text-sm font-semibold text-gray-800">Telemetry Keys:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {selectedDeviceKeys.map(key => (
                                    <div key={key} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`key-${w.id}-${p.deviceId}-${key}`}
                                        checked={p.keys?.some(k => k.key === key) || false}
                                        onChange={e => handleTableKeyChange(i, pi, key, e.target.checked)}
                                        className="form-checkbox"
                                      />
                                      <label htmlFor={`key-${w.id}-${p.deviceId}-${key}`} className="text-sm cursor-pointer">
                                        {key}
                                      </label>
                                      {p.keys?.some(k => k.key === key) && (
                                        <input
                                          type="text"
                                          placeholder="Unit"
                                          value={p.keys.find(k => k.key === key)?.unit || ''}
                                          onChange={e => handleTableUnitChange(i, pi, key, e.target.value)}
                                          className="w-14 md:w-20 text-xs border rounded-md px-1"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : w.type === 'alarms' ? (
                    <div className="flex justify-center items-center text-gray-500 text-lg">
                      This widget has no configuration options.
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-700">Parameters</h4>
                        <button
                          type="button"
                          onClick={() => addParam(i)}
                          disabled={(w.type === 'donut' && w.parameters.length >= 1)}
                          className={clsx(
                            "inline-flex items-center text-blue-700 px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 font-medium text-sm",
                            (w.type === 'donut' && w.parameters.length >= 1) &&
                            "opacity-50 cursor-not-allowed"
                          )}
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
                            className={clsx("flex gap-10 items-center bg-white rounded-lg px-3 py-2 shadow-sm border",
                              (!p.deviceId || !p.key || !p.label.trim()) && "border-red-300 ring-2 ring-red-100"
                            )}
                          >
                            <div className="grid md:grid-cols-3 grid-cols-1 gap-2">
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
                                className="border rounded-lg p-2 focus:ring-blue-400" />
                              {(w.type === 'card') && (
                                <input
                                  type="text"
                                  placeholder="Unit"
                                  value={p.unit || ''}
                                  onChange={e => updateParam(i, pi, 'unit', e.target.value)}
                                  className="border rounded-lg p-2 focus:ring-blue-400"
                                />
                              )}
                              <input
                                type="number"
                                placeholder="Min Value"
                                value={p.min || ''}
                                onChange={e => updateParam(i, pi, 'min', e.target.value)}
                                className="border rounded-lg p-2 focus:ring-blue-400"
                              />
                              <input
                                type="number"
                                placeholder="Max Value"
                                value={p.max || ''}
                                onChange={e => updateParam(i, pi, 'max', e.target.value)}
                                className="border rounded-lg p-2 focus:ring-blue-400"
                              />
                            </div>
                            <div className="flex justify-center items-center">
                              <button
                                type="button"
                                onClick={() => { setWidgetToDelete(i); setParamToDelete(pi); setIsParamDelete(true); }}
                                className="text-red-500 hover:text-red-700 outline-none"
                                title="Remove Parameter"
                              >
                                <FiTrash2 size={28} />
                              </button>
                            </div>
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
            onConfirm={() => { removeWidget(widgetToDelete); setIsDeletePopupOpen(false); setWidgetToDelete(null); }}
            onCancel={() => { setIsDeletePopupOpen(false); setWidgetToDelete(null); }}
          />
        )}
        {isParamDelete && (
          <DeletePopup
            onConfirm={() => { removeParam(widgetToDelete, paramToDelete); setIsParamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
            onCancel={() => { setIsParamDelete(false); setWidgetToDelete(null); setParamToDelete(null); }}
          />
        )}
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
      {showPreview && (
        <ShowPreviewModal
          ImgUrl={previewImageLink}
          title={previewImageTitle}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}