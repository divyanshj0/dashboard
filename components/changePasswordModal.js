'use client';
import { useState ,useEffect} from 'react';

export default function ChangePasswordModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('tb_token');

        if (!token) return alert('Not authenticated');
        if (newPassword !== confirmPassword) return alert('Passwords do not match!');
        if (!currentPassword || !newPassword) return alert('All fields are required');

        setLoading(true);

        try {
            const response = await fetch('/api/thingsboard/changePassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to update password');

            alert('✅ Password changed successfully!');
            onClose();
        } catch (err) {
            console.error(err);
            alert('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-2">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700"
                >
                    &times;
                </button>
                <h2 className="text-xl font-semibold mb-4 text-blue-700">Change Password</h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm">Current Password:</label>
                        <input
                            type="password"
                            className="w-full border p-2 rounded"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm">New Password:</label>
                        <input
                            type="password"
                            className="w-full border p-2 rounded"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm">Confirm New Password:</label>
                        <input
                            type="password"
                            className="w-full border p-2 rounded"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}