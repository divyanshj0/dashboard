import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import clsx from 'clsx';

export default function TableComponent({ title = "", parameters = [], token, onLatestTimestampChange }) {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestData = async () => {
      setLoading(true);
      const fetchedData = {};
      let latestTimestamp = 0;
      const allKeysWithUnits = new Map();
      const fetchPromises = [];

      if (!token || parameters.length === 0) {
        setLoading(false);
        return;
      }

      parameters.forEach(param => {
        fetchedData[param.deviceId] = {
          name: param.name,
          values: {}
        };
        param.keys.forEach(keyObj => {
          allKeysWithUnits.set(keyObj.key, keyObj.unit);
          const fetchPromise = fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              deviceId: param.deviceId,
              key: keyObj.key,
              limit: 1, // Fetch only the latest value
            }),
          })
            .then(res => {
              if (res.status === 401) {
                localStorage.clear();
                toast.error('Session expired. Please log in again.');
                router.push('/');
                return Promise.reject('Unauthorized');
              }
              if (!res.ok) {
                console.error(`Failed to fetch data for device ${param.deviceId} and key ${keyObj.key}: ${res.statusText}`);
                return {};
              }
              return res.json();
            })
            .then(resData => {
              const latestEntry = resData[keyObj.key]?.[0];
              const value = latestEntry ? parseFloat(latestEntry.value) : 'N/A';
              const ts = latestEntry ? Number(latestEntry.ts) : 0;
              if (ts > latestTimestamp) {
                latestTimestamp = ts;
              }
              fetchedData[param.deviceId].values[keyObj.key] = value;
            })
            .catch(error => {
              if (error !== 'Unauthorized') {
                console.error('Error fetching data:', error);
                fetchedData[param.deviceId].values[keyObj.key] = 'N/A';
              }
            });
          fetchPromises.push(fetchPromise);
        });
      });

      try {
        await Promise.all(fetchPromises);
        const tableRows = parameters.map(param => ({
          name: param.name,
          ...fetchedData[param.deviceId]?.values
        }));
        setData(tableRows);
        if (latestTimestamp > 0 && typeof onLatestTimestampChange === 'function') {
          onLatestTimestampChange(latestTimestamp);
        }
      } catch (error) {
        if (error !== 'Unauthorized') {
          toast.error('Failed to load table data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestData();
  }, [parameters, token, router, onLatestTimestampChange]);

  const allKeys = parameters.length > 0 ? Array.from(new Set(parameters.flatMap(p => p.keys.map(k => k.key)))) : [];
  const getUnit = (key) => {
    const keyObj = parameters.flatMap(p => p.keys).find(k => k.key === key);
    return keyObj ? keyObj.unit : '';
  };
  

  return (
    <div className="bg-white h-full w-full border border-gray-200 rounded-md shadow-sm p-4 overflow-auto custom-scrollbar">
      <p className="text-xl font-semibold mb-4">{title}</p>
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No data to display. Please configure devices and keys.</p>
        </div>
      ) : (
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  Device
                </th>
                {allKeys.map(key => (
                  <th key={key} scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                    {key} {getUnit(key) ? `(${getUnit(key)})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {row.name}
                  </td>
                  {allKeys.map(key => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {row[key] !== 'N/A' ? `${row[key]}` : 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}