import { FiRefreshCw } from 'react-icons/fi';
import { useEffect } from 'react';
export default function DeviceListModal({ devices, loading, onClose, onRefresh }) {
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-3xl hover:text-red-600 hover:scale-105 cursor-pointer">&times;</button>
                <div className='flex gap-5 items-center mb-4'>
                    <h2 className="text-xl font-semibold text-indigo-700">Devices for Customer</h2>
                    <button onClick={onRefresh} className="p-2 hover:bg-gray-300 cursor-pointer hover:scale-105 text-black rounded"><FiRefreshCw  size={20}/></button>
                </div>
                {loading && <p className="text-gray-500">Loading devices...</p>}
                {!loading && devices.length === 0 && (
                    <p className="text-gray-500">No devices found.</p>
                )}
                {!loading && devices.length > 0 && (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {devices.map((device) => (
                            <li key={device.id.id} className="border p-3 rounded">
                                <p className="font-medium">{device.name}</p>
                                <p className="text-sm text-gray-600">Type: {device.type}</p>
                                <span className="text-sm text-gray-400">
                                    {new Date(device.createdTime).toLocaleDateString('en-GB')}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
