'use client';
import { useEffect, useState } from 'react';
import { FiTrash, FiUser, FiUserPlus, FiMonitor, FiPlus } from 'react-icons/fi';
export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerUsers, setCustomerUsers] = useState([]);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({ name: '', city: '', state: '', country: '', email: '' });
  useEffect(() => {
    const t = localStorage.getItem('tb_token');
    setToken(t);
    fetchCustomers(t);
  }, []);

  const fetchCustomers = async (t) => {
    const res = await fetch('/api/thingsboard/getcustomer', {
      method: 'POST',
      body: JSON.stringify({ token: t }),
    });
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  };

  const handleDeleteCustomer = async (customerId) => {
    await fetch('/api/thingsboard/deleteCustomer', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    fetchCustomers(token);
  };

  const handleAddCustomerForm = async () => {
    await fetch('/api/thingsboard/createCustomer', {
      method: 'POST',
      body: JSON.stringify({
        token,
        title: addCustomerForm.name,
        city: addCustomerForm.city,
        state: addCustomerForm.state,
        country: addCustomerForm.country,
        email: addCustomerForm.email
      })
    });
    setShowAddModal(false);
    setAddCustomerForm({ name: '', city: '', state: '', country: '', email: '' });
    fetchCustomers(token);
  };
  const handleAddUser = async () => {
    await fetch('/api/thingsboard/addUser', {
      method: 'POST',
      body: JSON.stringify({
        token,
        customerId: selectedCustomerId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }),
    });
    setNewUser({ email: '', firstName: '', lastName: '' });
    fetchCustomers(token);
  };
  const fetchUser = async (token, customerId) => {
    const res = await fetch('/api/thingsboard/getcustomeruser', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    const data = await res.json();
    return data;
  };

  const handleDeleteUser = async (userId) => {
    await fetch('/api/thingsboard/deleteUser', {
      method: 'POST',
      body: JSON.stringify({ token, userId }),
    });
    fetchCustomers(token);
  };
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {loading ? (
        <div className="text-center text-gray-500">Loading customers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id.id}
              className="bg-white shadow-md p-5 rounded-xl border border-gray-200 hover:shadow-xl transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-700">{customer.title}</h2>
                <span className="text-sm text-gray-400">
                  {new Date(customer.createdTime).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Email:</strong> {customer.email || 'Not set'}</p>
                <p><strong>Country:</strong> {customer.country || 'Not set'}</p>
                <p><strong>City:</strong> {customer.city || 'Not set'}</p>
              </div>

              <div className="mt-4 flex justify-between items-center text-gray-600">
                <div className="flex space-x-4 text-xl">
                  <button onClick={() => { setShowUserModal(true); setSelectedCustomerId(customer.id.id); }}>
                    <FiUser className="hover:text-blue-500 cursor-pointer" title="Users" />
                  </button>
                  <button onClick={() => { setShowAddUserModal(true); setSelectedCustomerId(customer.id.id); }}>
                    <FiUserPlus className="hover:text-blue-500 cursor-pointer" title=" Add user" />
                  </button>
                  <button onClick={() => { setShowDeviceModal(true); setSelectedCustomerId(customer.id.id); }}>
                    <FiMonitor className="hover:text-indigo-500 cursor-pointer" title="Devices" />
                  </button>
                </div>
                <button onClick={() => handleDeleteCustomer(customer.id.id)}>
                  <FiTrash className="text-red-500 hover:text-red-700 text-xl" title="Delete Customer" />
                </button>
              </div>
            </div>
          ))}

          {/* Create Customer Card */}
          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            className="flex flex-col items-center justify-center min-h-[220px] bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl hover:bg-blue-100 transition"
          >
            <FiPlus className="text-4xl text-blue-600 mb-2" />
            <span className="font-medium text-blue-600">Add Customer</span>
          </button>
        </div>
      )}

      {/* Modal for Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-blue-700">Add Customer Details</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleAddCustomerForm();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:outline-blue-500"
                  required
                  value={addCustomerForm.name}
                  onChange={(e) => setAddCustomerForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">City</label>
                <input
                  className="w-full p-2 border rounded focus:outline-blue-500"
                  required
                  value={addCustomerForm.city}
                  onChange={(e) => setAddCustomerForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">State</label>
                <input
                  className="w-full p-2 border rounded focus:outline-blue-500"
                  value={addCustomerForm.state}
                  onChange={(e) => setAddCustomerForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Country</label>
                <input
                  className="w-full p-2 border rounded focus:outline-blue-500"
                  required
                  value={addCustomerForm.country}
                  onChange={(e) => setAddCustomerForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded focus:outline-blue-500"
                  value={addCustomerForm.email}
                  onChange={(e) => setAddCustomerForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={() => { setShowUserModal(false); setCustomerUsers([]); }}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Users for Customer</h2>

            <button
              onClick={async () => {
                const data = await fetchUser(token, selectedCustomerId);
                setCustomerUsers(data);
              }}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Users
            </button>

            {customerUsers.length === 0 ? (
              <p className="text-gray-500">No users found.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {customerUsers.map((user) => (
                  <li key={user.id.id} className="border p-3 rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.id.id)}
                      className="text-red-500 hover:text-red-700 text-lg"
                    >
                      <FiTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => { setShowAddUserModal(false); setNewUser({ email: '', firstName: '', lastName: '' }); }}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Add User</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleAddUser();
                setShowAddUserModal(false);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="First Name"
                value={newUser.firstName}
                required
                onChange={(e) => setNewUser((u) => ({ ...u, firstName: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newUser.lastName}
                required
                onChange={(e) => setNewUser((u) => ({ ...u, lastName: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                required
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                className="w-full p-2 border rounded"
              />

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={() => { setShowDeviceModal(false); setCustomerDevices([]); }}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Devices for Customer</h2>

            <button
              onClick={async () => {
                const res = await fetch('/api/thingsboard/getDevices', {
                  method: 'POST',
                  body: JSON.stringify({ token, customerId: selectedCustomerId }),
                });
                const data = await res.json();
                setCustomerDevices(data);
              }}
              className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Refresh Devices
            </button>

            {customerDevices.length === 0 ? (
              <p className="text-gray-500">No devices found.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {customerDevices.map((device) => (
                  <li key={device.id.id} className="border p-3 rounded">
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-600">Type: {device.type}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}



    </div>
  );
}
