import { useEffect, useState } from "react";

export default function AddDeviceModal({ device, onChange, onSubmit, save, onClose }) {
  const [activeStep, setActiveStep] = useState(true); // Step 1 = true, Step 2 = false

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const isStep1Valid = device.name.trim() !== '' && device.label.trim() !== '';
  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl font-bold text-gray-600">
          &times;
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Add Device</h2>

        {/* Stepper */}
        <div className="my-5 flex gap-10 py-4 border-y border-[#ddd]">
          <div className={`flex items-center gap-2 ${activeStep ? "text-[#305680]" : "text-[#999999]"}`}>
            <span className={`${activeStep ? "bg-[#305680]" : "bg-[#e0e0e0]"} text-white w-6 h-6 rounded-full flex items-center justify-center font-semibold`}>
              1
            </span>
            <span className="font-medium">Device Details</span>
          </div>
          <div className={`flex items-center gap-2 ${!activeStep ? "text-[#305680]" : "text-[#999999]"}`}>
            <span className={`${!activeStep ? "bg-[#305680]" : "bg-[#e0e0e0]"} text-white w-6 h-6 rounded-full flex items-center justify-center font-semibold`}>
              2
            </span>
            <span className="font-medium">Credentials</span>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4">
          {activeStep ? (
            <>
              {['name', 'label'].map(field => (
                <div key={field}>
                  <label className="block mb-1 font-medium text-gray-700">{field.toUpperCase()} {field!=='label'?'*':''}</label>
                  <input
                    type="text"
                    required={field!=='label'}
                    placeholder={`Enter device ${field}`}
                    value={device[field]}
                    onChange={(e) => onChange(field, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              {['clientId', 'username', 'password'].map(field => (
                <div key={field}>
                  <label className="block mb-1 font-medium text-gray-700 capitalize">{field}</label>
                  <input
                    type={field === 'password' ? 'password' : 'text'}
                    placeholder={`Enter ${field} (optional)`}
                    value={device[field] || ''}
                    onChange={(e) => onChange(field, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    autoComplete={field === 'password' ? 'new-password' : 'off'}
                  />
                </div>
              ))}
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(!activeStep)}
              disabled={save ||!isStep1Valid}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${save|| !isStep1Valid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {activeStep ? "Next" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={save ||!isStep1Valid}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${save|| !isStep1Valid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {save ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
