export default function DeviceListModal({ devices, loading, onClose, onRefresh }) {
    console.log('DeviceListModal devices:', devices);
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-xl">&times;</button>
                <h2 className="text-xl font-semibold mb-4 text-indigo-700">Devices for Customer</h2>

                <button onClick={onRefresh} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">Refresh Devices</button>
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
