import { useEffect } from "react";
export default function AddDeviceModal({ device, onChange, onSubmit,save, onClose }) {
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Add Device</h2>

        <form className="space-y-4">
          {['name', 'label'].map(field => (
            <input
              key={field}
              type={field === 'email' ? 'email' : 'text'}
              placeholder={field.replace(/([A-Z])/g, ' $1')}
              value={device[field]}
              onChange={(e) => onChange(field, e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          ))}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="button" onClick={onSubmit} className={`px-4 py-2 bg-blue-600 text-white rounded ${save ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={save}>
              {save ? 'Saving...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
