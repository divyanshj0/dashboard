'use client';
import AddUserModal from '@/components/AddUserModal';
import AddCustomerModal from '@/components/AddCustomerModal';
import UserListModal from '@/components/UserListModal';
import DeviceListModal from '@/components/DeviceListModal';
import AddDeviceModal from '@/components/AddDeviceModal';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiTrash, FiUser, FiUserPlus, FiMonitor, FiPlus ,FiLogOut} from 'react-icons/fi';
import { TbDeviceDesktopPlus } from "react-icons/tb";
export default function AdminDashboard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [token, setToken] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerUsers, setCustomerUsers] = useState([]);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '' });
  const [newDevice, setNewDevice] = useState({ name: '', label: '' });
  const [loading, setLoading] = useState(true);
  const [save,setSave]= useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({ name: '', city: '', state: '', country: '', email: '' });
  useEffect(() => {
    const t = localStorage.getItem('tb_token');
    const username= localStorage.getItem('userName');
    setName(username);
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
    setAddCustomerForm({ name: '', city: '', state: '', country: '', email: '' });
    fetchCustomers(token);
    setSave(false);
    alert('Customer added successfully');
    setShowAddModal(false);
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
    setSave(false);
    alert('User added successfully');
    setShowAddUserModal(false);
  };

  const handleAddDevice = async () => {
    await fetch('/api/thingsboard/createdevice', {
      method: 'POST',
      body: JSON.stringify({
        token,
        customerId: selectedCustomerId,
        name: newDevice.name,
        label: newDevice.label
      }),
    });
    setNewDevice({ name: '', label: '' });
    setSave(false);
    alert('Device added successfully');
    setShowAddDeviceModal(false);
  };
  const fetchUser = async (token, customerId) => {
    setShowUserModal(true);
    const res = await fetch('/api/thingsboard/getcustomeruser', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    const data = await res.json();
    setCustomerUsers(data);
    setLoadingModal(false);
  };

  const fetchDevices = async (token, customerId) => {
    const res = await fetch('/api/thingsboard/getdevices', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    const data = await res.json();
    setCustomerDevices(data.devices || []);
    setLoadingModal(false);
  };

  const handleDeleteUser = async (userId) => {
    await fetch('/api/thingsboard/deleteUser', {
      method: 'POST',
      body: JSON.stringify({ token, userId }),
    });
    fetchCustomers(token);
  };
  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };
  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-blue-700 font-medium">Loading Admin panel...</p>
        </div>
      )}
      <div className="px-6 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center p-2 bg-blue-100 rounded-md shadow-md">
          <div className="flex flex-col items-start md:items-center md:flex-row md:gap-2">
            <img src="/company_logo[1].png" alt="logo" className=" w-48" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative inline-block text-left">
              <div
                className="text-md bg-white shadow-md p-2 flex items-center text-black rounded-md cursor-pointer"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <FiUser size={24} className="mr-2" /> {name || 'Admin'}
              </div>
              {showMenu && (
                <div className="absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      className="flex items-center px-4 py-2 text-lg text-red-600 hover:bg-gray-100 w-full"
                      onClick={handleLogout}
                    >
                      <FiLogOut size={20} className="mr-2" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
          <h1 className="text-3xl font-bold my-6 text-gray-800">Admin Dashboard</h1>
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
                    <button onClick={() => { setSelectedCustomerId(customer.id.id); fetchUser(token, customer.id.id); setLoadingModal(true); }}>
                      <FiUser className="hover:text-blue-500 cursor-pointer" title="Users" />
                    </button>
                    <button onClick={() => { setShowAddUserModal(true); setSelectedCustomerId(customer.id.id); }}>
                      <FiUserPlus className="hover:text-blue-500 cursor-pointer" title=" Add user" />
                    </button>
                    <button onClick={() => { setSelectedCustomerId(customer.id.id); fetchDevices(token, customer.id.id); setLoadingModal(true); setShowDeviceModal(true); }}>
                      <FiMonitor className="hover:text-indigo-500 cursor-pointer" title="Devices" />
                    </button>
                    <button onClick={() => { setSelectedCustomerId(customer.id.id); setShowAddDeviceModal(true); }}>
                      <TbDeviceDesktopPlus className="hover:text-indigo-500 cursor-pointer" title="Add Device" />
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


          {/* Modal for Add Customer */}
          {showAddModal && (
            <AddCustomerModal
              form={addCustomerForm}
              onChange={(field, value) => setAddCustomerForm((f) => ({ ...f, [field]: value }))}
              onClose={() => setShowAddModal(false)}
              save={save}
              onSubmit={() => { handleAddCustomerForm(); setSave(true); }}
            />
          )}

          {showUserModal && (
            <UserListModal
              users={customerUsers}
              loading={loadingModal}
              onClose={() => setShowUserModal(false)}
              onRefresh={async () => {
                await fetchUser(token, selectedCustomerId);
              }}
              onDelete={handleDeleteUser}
            />
          )}
          {showAddUserModal && (
            <AddUserModal
              user={newUser}
              onChange={(field, value) => setNewUser((u) => ({ ...u, [field]: value }))}
              onSubmit={() => { handleAddUser(); setSave(true); }}
              save={save}
              onClose={() => setShowAddUserModal(false)}
            />
          )}
          {showDeviceModal && (
            <DeviceListModal
              devices={customerDevices}
              loading={loadingModal}
              onClose={() => setShowDeviceModal(false)}
              onRefresh={async () => {
                await fetchDevices(token, selectedCustomerId);
              }}
            />
          )}
          {showAddDeviceModal && (
            <AddDeviceModal
              device={newDevice}
              onChange={(field, value) => setNewDevice((d) => ({ ...d, [field]: value }))}
              onSubmit={() => { handleAddDevice(); setSave(true); }}
              save={save}
              onClose={() => setShowAddDeviceModal(false)}
            />
          )}
          <div className="bg-blue-100 text-center mt-4 py-4 rounded-md">
            <p className="text-lg text-black">© 2025 All rights reserved. Developed and managed by TheElitePro</p>
          </div>
        </div>
      </>
      );
}
