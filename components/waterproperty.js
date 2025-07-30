import React, { useState, useEffect } from 'react';

const WaterProperty = ({ title = "", parameters = [], token }) => {
  const [fetchedValues, setFetchedValues] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchLatestValues = async () => {
      if (!token || parameters.length === 0) {
        setFetchedValues({});
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      const newFetchedValues = {};
      const fetchPromises = parameters.map(async (param) => {
        try {
          const res = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              deviceId: param.deviceId,
              key: param.key,
              limit: 1,
            }),
          });

          if (!res.ok) {
            console.error(`Failed to fetch data for key '${param.key}': ${res.statusText}`);
            newFetchedValues[param.key] = { value: null, unit: param.unit };
            return;
          }

          const data = await res.json();
          const latestEntry = Array.isArray(data[param.key]) && data[param.key].length > 0
            ? data[param.key][0]
            : null;

          newFetchedValues[param.key] = {
            value: latestEntry ? parseFloat(latestEntry.value) : null,
            unit: param.unit || '' 
          };

        } catch (error) {
          console.error(`Error fetching data for key '${param.key}':`, error);
          newFetchedValues[param.key] = { value: null, unit: param.unit };
        }
      });

      await Promise.all(fetchPromises);
      setFetchedValues(newFetchedValues);
      setLoadingData(false);
    };

    fetchLatestValues();
  }, [parameters, token]);
  const getDisplayValue = (key) => {
    const dataEntry = fetchedValues[key];

    if (loadingData) return '...';
    if (!dataEntry || dataEntry.value === null || dataEntry.value === undefined) return 'N/A';

    if (key.toLowerCase().includes('pumpstatus') || key.toLowerCase() === 'pump') { 
      return dataEntry.value ? 'Running' : 'Stopped';
    }

    return `${dataEntry.value} ${dataEntry.unit}`.trim();
  };

  return (
    <div className="flex flex-wrap justify-between gap-2 bg-white w-full h-full">
      {parameters.length > 0 && (
        <div className="flex-1 min-w-[200px] p-2 rounded-md shadow-md">
          <p className="text-lg font-medium">{title}</p>
          {loadingData ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            parameters.map((param) => (
              <div key={param.key} className="flex py-1 justify-between items-center">
                <p className="text-sm font-medium">{param.label || param.key}</p>
                <span className={param.key.toLowerCase().includes('pump') && fetchedValues[param.key]?.value ? 'text-green-600' : ''}>
                  {getDisplayValue(param.key)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      {parameters.length === 0 && !loadingData && (
         <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
           <p className="text-lg font-medium">{title}</p>
           <p className="text-sm text-gray-500">No properties configured for this widget.</p>
         </div>
      )}
    </div>
  );
};

export default WaterProperty;