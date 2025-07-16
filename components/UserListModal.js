import { FiTrash } from 'react-icons/fi';

export default function UserListModal({ users, loading, onClose, onRefresh, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Users for Customer</h2>
        <button onClick={onRefresh} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">Refresh Users</button>
        {loading && <p className="text-gray-500">Loading users...</p>}
        {!loading && users.length === 0 && (
          <p className="text-gray-500">No users found.</p>
        )}
        {!loading && users.length > 0 && (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {users.map(user => (
              <li key={user.id.id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <button onClick={() => onDelete(user.id.id)} className="text-red-500"><FiTrash /></button>
              </li>
            ))}
          </ul>
        )}
    
      </div>
    </div>
  );
}
