'use client';
import { useState, useEffect } from 'react';
import { FiUser, FiTrash2 } from 'react-icons/fi';

export default function AdminDashboard() {
    const [customers, setCustomers] = useState([]);
    const [usersByCustomer, setUsers] = useState({});

    useEffect(() => {
        const fetchcustomer = async () => {
            const token = localStorage.getItem('tb_token');
            if (!token) {
                router.push('/');
                return;
            }

            try {
                fetch('/api/thingsboard/getcustomer', {
                    method: 'POST',
                    body: JSON.stringify({ token }),
                })
                    .then(r => r.json())
                    .then(cs => {
                        setCustomers(cs);
                        cs.forEach(c => loadUsers(c.id.id));
                    });
            }
            catch (error) {
                console.error('Error fetching customers:', error);
            }
        }
        fetchcustomer();
    }, []);

    const loadUsers = (cid) => {
        const token = localStorage.getItem('tb_token');
        if (!token) return;
        fetch('/api/thingsboard/getcustomeruser', {
            method: 'POST',
            body: JSON.stringify({ token, customerId: cid }),
        })
            .then(r => r.json())
            .then(users => setUsers(prev => ({ ...prev, [cid]: users })));
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            {customers.map(c => (
                <div key={c.id.id} className="mb-6 bg-white p-4 rounded shadow">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold">{c.title}</h2>
                    </div>
                    <ul>
                        {(usersByCustomer[c.id.id] || []).map(u => (
                            <li key={u.id.id} className="flex justify-between items-center py-1">
                                <span><FiUser className="inline mr-2" /> {u.firstName} {u.lastName} ({u.email})</span>
                                <button className="text-red-600 hover:text-red-800 flex items-center">
                                    <FiTrash2 className="mr-1" /> Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
