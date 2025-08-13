// app/admindashboard/page.js
'use client';
import AddUserModal from '@/components/AddUserModal';
import AddCustomerModal from '@/components/AddCustomerModal';
import UserListModal from '@/components/UserListModal';
import DeviceListModal from '@/components/DeviceListModal';
import AddDeviceModal from '@/components/AddDeviceModal';
import DeletePopup from '@/components/deletepopup';
import ChangePasswordModal from '@/components/changePasswordModal';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { FiTrash, FiUser, FiUserPlus, FiMonitor, FiPlus, FiLogOut, FiSearch } from 'react-icons/fi';
import { TbDeviceDesktopPlus } from "react-icons/tb";
import { FaKey } from 'react-icons/fa6';
import EditDeviceModal from '@/components/editdevicemodal';
import { toast } from 'react-toastify';
export default function AdminDashboard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [token, setToken] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerUsers, setCustomerUsers] = useState([]);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [device, setDevice] = useState({}); // This will store the full device object for editing
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', password: '', confirmPassword: '' });
  const [newDevice, setNewDevice] = useState({ name: '', label: '', clientId: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false)
  const [addCustomerForm, setAddCustomerForm] = useState({ name: '', city: '', state: '', country: '' });
  const [isDeleteCustomer, setIsDeleteCustomer] = useState(false);
  const [isDeleteUser, setIsDeleteUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteDevice, setIsDeleteDevice] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      customer.title?.toLowerCase().includes(lowerSearchTerm) ||
      customer.city?.toLowerCase().includes(lowerSearchTerm) ||
      customer.country?.toLowerCase().includes(lowerSearchTerm)
    );
  });
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const t = localStorage.getItem('tb_token');
    const username = localStorage.getItem('userName');
    setToken(t);
    setName(username);
    if (!t) {
      router.push('/');
      return;
    }
    fetchCustomers(t);
  }, []);

  const fetchCustomers = async (t) => {
    const res = await fetch('/api/thingsboard/getcustomer', {
      method: 'POST',
      body: JSON.stringify({ token: t }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  };

  const handleDeleteCustomer = async (customerId) => {
    const res = await fetch('/api/thingsboard/deleteCustomer', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    fetchCustomers(token);
    setIsDeleteCustomer(false);
  };

  const handleAddCustomerForm = async () => {
    const res = await fetch('/api/thingsboard/createCustomer', {
      method: 'POST',
      body: JSON.stringify({
        token,
        title: addCustomerForm.name,
        city: addCustomerForm.city,
        state: addCustomerForm.state,
        country: addCustomerForm.country
      })
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    setAddCustomerForm({ name: '', city: '', state: '', country: '' });
    fetchCustomers(token);
    setSave(false);
    toast.success('Customer added successfully');
    setShowAddModal(false);
  };
  const handleAddUser = async () => {
    const res = await fetch('/api/thingsboard/addUser', {
      method: 'POST',
      body: JSON.stringify({
        token,
        customerId: selectedCustomerId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        password: newUser.password,
      }),
    });

    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    const data = await res.json();  // parse JSON body

    if (!res.ok) {
      toast.error(data.error || 'Something went wrong');
      setSave(false);
      return;
    }

    setNewUser({ email: '', firstName: '', lastName: '', password: '', confirmPassword: '' });
    setSave(false);
    toast.success('User added successfully');
    setShowAddUserModal(false);
  };


  const handleAddDevice = async () => {
    const res = await fetch('/api/thingsboard/createdevice', {
      method: 'POST',
      body: JSON.stringify({
        token,
        customerId: selectedCustomerId,
        name: newDevice.name,
        label: newDevice.label,
        clientId: newDevice.clientId,
        username: newDevice.username,
        password: newDevice.password
      }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    setNewDevice({ name: '', label: '', clientId: '', username: '', password: '' });
    setSave(false);
    toast.success('Device added successfully');
    setShowAddDeviceModal(false);
  };

  const handleEditDevice = async (updatedFields) => {
    setSave(true);
    try {
      const res = await fetch('/api/thingsboard/updatedevice', {
        method: 'POST', // Use PUT for updating
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          customerId: selectedCustomerId,
          deviceId: device.id.id,
          name: updatedFields.name,
          label: updatedFields.label,
          clientId: updatedFields.clientId,
          username: updatedFields.username,
          password: updatedFields.password,
        }),
      });

      if (res.status === 401) {
        // Token is unauthorized or expired.
        // Clear localStorage and redirect to login.
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        router.push('/');
        return; // Stop further execution
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update device');
      }

      toast.success('Device updated successfully!');
      setShowEditModal(false);
      await fetchDevices(token, selectedCustomerId);
    } catch (err) {
      toast.error('Failed to update device: ' + err.message);
    } finally {
      setSave(false);
    }
  };

  const fetchUser = async (token, customerId) => {
    setShowUserModal(true);
    const res = await fetch('/api/thingsboard/getcustomeruser', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    const data = await res.json();
    setCustomerUsers(data);
    setLoadingModal(false);
  };

  const fetchDevices = async (token, customerId) => {
    const res = await fetch('/api/thingsboard/getdevices', {
      method: 'POST',
      body: JSON.stringify({ token, customerId }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    const data = await res.json();
    setCustomerDevices(data.devices || []);
    setLoadingModal(false);
  };
  const fetchDev = async (token, customerId) => {
    const res = await fetch('/api/thingsboard/devices', {
      method: 'POST',
      body: JSON.stringify({ customerId: customerId, token: token }),
    })
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    const devdata = await res.json()
    if (!res.ok) throw new Error(devdata.error)
    localStorage.setItem('tb_devices', JSON.stringify(devdata.devices));

  }

  const handleDeleteUser = async (userId) => {
    setDeleting(true);
    const res = await fetch('/api/thingsboard/deleteUser', {
      method: 'POST',
      body: JSON.stringify({ token, userId }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    fetchUser(token, selectedCustomerId);
    setDeleting(false);
    setIsDeleteUser(false);
    toast.success('User Deleted Successfully');
  };

  const handleDeleteDevice = async (deviceId) => {
    setDeleting(true);
    const res = await fetch('/api/thingsboard/deleteDevice', {
      method: 'POST',
      body: JSON.stringify({ token, deviceId }),
    });
    if (res.status === 401) {
      // Token is unauthorized or expired.
      // Clear localStorage and redirect to login.
      localStorage.clear();
      toast.error('Session expired. Please log in again.');
      router.push('/');
      return; // Stop further execution
    }
    fetchDevices(token, selectedCustomerId);
    setDeleting(false);
    setIsDeleteDevice(false);
    toast.success('Device Deleted Successfully');
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
            <div className="relative inline-block text-left" ref={menuRef}>
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
                      className="flex items-center px-4 py-2 text-lg text-blue-600 hover:bg-gray-100 w-max"
                      onClick={() => { setShowChangePassword(true); setShowMenu(false); }}
                    >
                      <FaKey size={20} className="mr-2" /> Change Password
                    </button>
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
        <div className='min-h-[74vh]'>
          <h1 className="text-3xl font-bold my-6 text-gray-800">Admin Dashboard</h1>
          <div className="relative mb-4">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, city or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id.id}
                className="bg-white shadow-md p-5 rounded-xl border border-gray-200 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-700">{customer.title}</h2>

                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Country:</strong> {customer.country || 'Not set'}</p>
                  <p><strong>City:</strong> {customer.city || 'Not set'}</p>
                  <p><strong>Created On: </strong>
                    <span className="ml-2">
                      {new Date(customer.createdTime).toLocaleDateString('en-GB')}
                    </span>
                  </p>
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
                  <button onClick={() => { setSelectedCustomerId(customer.id.id); setIsDeleteCustomer(true); }}>
                    <FiTrash className="text-red-500 hover:text-red-700 text-xl cursor-pointer" title="Delete Customer" />
                  </button>
                </div>
              </div>
            ))}

            {/* Create Customer Card */}
            <button
              onClick={() => setShowAddModal(true)}
              type="button"
              className="flex flex-col items-center justify-center min-h-[180px] bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl hover:bg-blue-100 transition"
            >
              <FiPlus className="text-4xl text-blue-600 mb-2" />
              <span className="font-medium text-blue-600">Add Customer</span>
            </button>
          </div>
        </div>
        {isDeleteCustomer && (
          <DeletePopup
            onConfirm={() => { setDeleting(true); handleDeleteCustomer(selectedCustomerId) }}
            onCancel={() => setIsDeleteCustomer(false)}
            deleting={deleting}
          />
        )}
        {isDeleteUser && (
          <DeletePopup
            onConfirm={() => handleDeleteUser(userToDelete)}
            onCancel={() => { setIsDeleteUser(false); setUserToDelete(null); }}
            deleting={deleting}
          />
        )}
        {isDeleteDevice && (
          <DeletePopup
            onConfirm={() => handleDeleteDevice(deviceToDelete)}
            onCancel={() => { setIsDeleteDevice(false); setDeviceToDelete(null); }}
            deleting={deleting}
          />
        )}

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
            onDelete={(userId) => { setIsDeleteUser(true); setUserToDelete(userId); }}
            onCreateDashboard={() => { fetchDev(token, selectedCustomerId) }}
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
            onEdit={(deviceToEdit) => {
              setShowDeviceModal(false);
              setShowEditModal(true)
              setDevice(deviceToEdit);
            }}
            onDelete={(deviceId) => { setIsDeleteDevice(true); setDeviceToDelete(deviceId); }}
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
        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
          />
        )}
        {
          showEditModal && (
            <EditDeviceModal
              device={device} // Pass the full device object to the modal
              loading={loadingModal}
              onSubmit={(updatedFields) => { handleEditDevice(updatedFields); }} // Pass the updated fields from modal to handler
              save={save}
              onClose={() => setShowEditModal(false)}
            />
          )
        }

        <div className="bg-blue-100 text-center mt-4 py-4 rounded-md">
          <p className="text-lg text-black">© 2025 All rights reserved. Developed and managed by TheElitePro</p>
        </div>
      </div>
    </>
  );
}