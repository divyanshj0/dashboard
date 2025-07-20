import { useEffect } from "react";
export default function AddCustomerModal({ form, onChange, onClose, save, onSubmit }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl">&times;</button>
        <h3 className="text-2xl font-bold mb-6 text-blue-700">Add Customer Details</h3>

        <form className="space-y-4">
          {['name', 'city', 'state', 'country'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 text-gray-600 capitalize">{field}</label>
              <input
                type='text'
                value={form[field]}
                onChange={(e) => onChange(field, e.target.value)}
                className="w-full p-2 border rounded focus:outline-blue-500"
                required
              />
            </div>
          ))}

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" onClick={onSubmit} className={`px-4 py-2 bg-blue-600 text-white rounded ${save ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={save}>
              {save ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
