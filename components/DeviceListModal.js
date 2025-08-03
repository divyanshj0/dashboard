import { FiRefreshCw, FiEye, FiEyeOff, FiSearch, FiTrash } from 'react-icons/fi';
import { FaRegEdit } from "react-icons/fa";
import { useEffect, useState } from 'react';

export default function DeviceListModal({ devices, loading, onClose, onRefresh, onEdit, onDelete }) {
    const [passwordVisibility, setPasswordVisibility] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const togglePasswordVisibility = (deviceId) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [deviceId]: !prev[deviceId]
        }));
    };
    
    const filteredDevices = devices.filter(device => 
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6      md:max-w-[80vw] w-full h-[80vh] relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-3xl hover:text-red-600 hover:scale-105 cursor-pointer"
                >
                    &times;
                </button>

                <div className="flex gap-5 items-center mb-4">
                    <h2 className="text-xl font-semibold text-indigo-700">Devices for Customer</h2>
                    <button
                        onClick={onRefresh}
                        className="p-2 hover:bg-gray-300 cursor-pointer hover:scale-105 text-black rounded"
                    >
                        <FiRefreshCw size={20} />
                    </button>
                </div>
                <div className="relative mb-4">
                    <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search devices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading && <p className="text-gray-500">Loading devices...</p>}
                {!loading && filteredDevices.length === 0 && (
                    <p className="text-gray-500">{searchTerm ? `No devices found matching "${searchTerm}".` : "No devices found."}</p>
                )}

                {!loading && filteredDevices.length > 0 && (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[80%] overflow-y-auto custom-scrollbar pr-2">
                        {filteredDevices.map((device) => {
                            const creds = device.credentials || {};
                            const type = creds.credentialsType;

                            let parsedCreds = null;
                            try {
                                if (type === 'MQTT_BASIC' && creds.credentialsValue) {
                                    parsedCreds = JSON.parse(creds.credentialsValue);
                                }
                            } catch {
                                parsedCreds = null;
                            }

                            const showPass = passwordVisibility[device.id.id];

                            return (
                                <li key={device.id.id} className="border p-3 rounded">
                                    <div className='flex justify-between'>
                                        <p className="font-medium text-lg">{device.name}</p>
                                        <div className='flex gap-2 items-center'>
                                            <button onClick={() => onEdit(device)}
                                                className="p-2 cursor-pointer hover:scale-105 text-gray-600">
                                                <FaRegEdit size={20} />
                                            </button>
                                            <button onClick={() => onDelete(device.id.id)}
                                                className="p-2 cursor-pointer hover:scale-105 text-red-400">
                                                <FiTrash size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">Type: {device.type}</p>
                                    <p className="text-sm text-gray-600">
                                        Created on:{" "}
                                        <span className="text-gray-500">
                                            {new Date(device.createdTime).toLocaleDateString("en-GB")}
                                        </span>
                                    </p>

                                    {creds.credentialsType === 'MQTT_BASIC' && parsedCreds ? (
                                        <div className="mt-2 text-sm border-t pt-2 text-gray-700">
                                            <p className="font-semibold">Credentials Type: MQTT_BASIC</p>
                                            <ul className="mt-1 space-y-1 list-inside text-gray-600">
                                                <li><strong>Client ID:</strong> {parsedCreds.clientId}</li>
                                                <li><strong>Username:</strong> {parsedCreds.userName}</li>
                                                <li className="flex items-center gap-2">
                                                    <strong>Password:</strong>
                                                    <span>{showPass ? parsedCreds.password : '********'}</span>
                                                    <button type="button" onClick={() => togglePasswordVisibility(device.id.id)}>
                                                        {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-md border-t pt-2 text-gray-600 italic">
                                            Credential not set
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}