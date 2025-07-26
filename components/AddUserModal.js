import { useEffect } from "react";
export default function AddUserModal({ user, onChange, onSubmit, save, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const isValid = user.firstName.trim() !== '' && user.email.trim()!=='';
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Add User</h2>

        <form className="space-y-4">
          {['firstName', 'lastName', 'email'].map(field => (
            <input
              key={field}
              type={field === 'email' ? 'email' : 'text'}
              placeholder={field!== 'lastName'?`${field} *`:`${field}`}
              value={user[field]}
              onChange={(e) => onChange(field, e.target.value)}
              required ={field!== 'lastName'}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-400"
            />
          ))}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" onClick={onSubmit} className={`px-4 py-2 bg-blue-600 text-white rounded ${save ||!isValid ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={save|| !isValid}>
              {save ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
