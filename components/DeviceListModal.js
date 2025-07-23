import { FiRefreshCw } from 'react-icons/fi';
import { FaRegEdit } from "react-icons/fa";
import { useEffect, useState } from 'react';
export default function DeviceListModal({ devices, loading, onClose, onRefresh, onEdit }) {
    const [newdevice, setNewDevice] = useState({
        name: '',
        label: '',
        clientId: '',
        username: '',
        password: '',
    });
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleedit = (device) => {
        setNewDevice({
            name: device.name || '',
            label: device.label || '',
            clientId: '',
            username: '',
            password: '',
            credentials: device.credentials || null,
        });

        if (
            device.credentials?.credentialsType === "MQTT_BASIC" &&
            device.credentials.credentialsValue
        ) {
            try {
                const parsed = JSON.parse(device.credentials.credentialsValue);
                setNewDevice((prev) => ({
                    ...prev,
                    clientId: parsed.clientId || '',
                    username: parsed.userName || '',
                    password: parsed.password || '',
                }));
            } catch (err) {
                console.error("Invalid credentials", err);
            }
        }
        onEdit(device) // Changed to pass the original 'device' object
    }



return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full h-[80vh] relative">
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

            {loading && <p className="text-gray-500">Loading devices...</p>}
            {!loading && devices.length === 0 && (
                <p className="text-gray-500">No devices found.</p>
            )}

            {!loading && devices.length > 0 && (
                <ul className="space-y-2 max-h-[90%] overflow-y-auto custom-scrollbar pr-2">
                    {devices.map((device) => {
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

                        return (
                            <li key={device.id.id} className="border p-3 rounded">
                                <div className='flex justify-between'>
                                    <p className="font-medium text-lg">{device.name}</p>
                                    <button onClick={() => handleedit(device)}
                                        className="p-2  cursor-pointer hover:scale-105 text-gray-600 ">
                                        <FaRegEdit size={20} />
                                    </button>
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
                                            <li><strong>Password:</strong> {parsedCreds.password}</li>
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