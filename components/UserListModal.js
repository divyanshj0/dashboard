import { FiTrash, FiRefreshCw } from 'react-icons/fi';
import { MdDashboardCustomize } from "react-icons/md";
import { FaUserSlash ,FaUser} from "react-icons/fa";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
export default function UserListModal({ users, loading, onClose, onRefresh, onDelete,onCreateDashboard }) {
  const router = useRouter();
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCreateDashboard = async (userId, userName) => {
    onCreateDashboard();
    if (userName) {
      router.push(`/${userName}/dashboard/${userId}`);
    }
  };
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('tb_token');
      if (!token) {
        toast.error('Authentication token not found.');
        return;
      }

      const res = await fetch('/api/thingsboard/toggleUserStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId, enabled: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${!currentStatus ? 'activate' : 'deactivate'} user.`);
      }

      onRefresh();
      toast.success(data.message);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.message || 'Failed to change user status.'); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-3xl cursor-pointer hover:text-red-600 hover:scale-105">&times;</button>
        <div className='flex gap-5 items-center mb-4'>
          <h2 className="text-xl font-semibold  text-blue-700">Users for Customer</h2>
          <button onClick={onRefresh} className="p-1 hover:bg-gray-300 cursor-pointer hover:scale-105 text-black rounded"><FiRefreshCw size={20} /></button>
        </div>
        {loading && <p className="text-gray-500">Loading users...</p>}
        {!loading && users.length === 0 && (
          <p className="text-gray-500">No users found.</p>
        )}
        {!loading && users.length > 0 && (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {users.map(user => (
              <li key={user.id.id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName?user.lastName:''}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">Status: {user.enabled ? 'Active' : 'Inactive'}</p>
                </div>
                <div className='flex items-center gap-5'>
                  <button
                    onClick={() => handleToggleUserStatus(user.id.id, user.enabled)}
                    className={` ${user.enabled ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                    title={user.enabled ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.enabled ? <FaUserSlash size={24}/> : <FaUser size={24}/>}
                  </button>
                  <button onClick={() => handleCreateDashboard(user.id.id, user.firstName + user.lastName)} className="text-gray-400 hover:text-gray-800" title='create Dashboard'><MdDashboardCustomize size={20} /></button>
                  <button onClick={() => onDelete(user.id.id)} className="text-red-400 hover:text-red-700"><FiTrash size={20} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}