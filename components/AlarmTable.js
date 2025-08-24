'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import clsx from 'clsx';

export default function AlarmTable({ title,token }) {
  const router = useRouter();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlarms = async () => {
      setLoading(true);
      setError(null);
      const customerId = localStorage.getItem('tb_customerId');
      if (!token || !customerId) {
        setError('Authentication or customer data missing.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/thingsboard/getAlarms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, customerId }),
        });

        if (res.status === 401) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          router.push('/');
          return;
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch alarms.');
        }
        const data = await res.json();
        console.log(data)
        setAlarms(data.data || []);

      } catch (err) {
        console.error('Error fetching alarms:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlarms();
  }, [token, router]);

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'major':
        return 'bg-amber-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white p-4 h-full w-full border border-gray-200 rounded-md shadow-sm flex flex-col">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">Loading alarms...</p>
        </div>
      )}
      {!loading && error && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      )}
      {!loading && !error && alarms.length === 0 && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">No Active Alarms.</p>
        </div>
      )}
      {!loading && !error && alarms.length > 0 && (
        <div className="overflow-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CREATED AT
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEVICE NAME
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ALARM TYPE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alarms.map((alarm) => (
                <tr key={alarm.id.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {formatTimestamp(alarm.createdTime)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {alarm.originatorName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span
                      className={clsx(
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white',
                        getSeverityClass(alarm.severity)
                      )}
                    >
                      {alarm.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}