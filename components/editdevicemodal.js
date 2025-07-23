// components/editdevicemodal.js
import { useEffect, useState } from "react";

export default function EditDeviceModal({ device, onSubmit, save, onClose }) { // Removed onChange prop
  const [activeStep, setActiveStep] = useState(true);
  const [localCreds, setLocalCreds] = useState({
    name: '',
    label: '',
    clientId: '',
    username: '',
    password: '',
    credentials: null,
  });

  // Sync props → local form state
  useEffect(() => {
    if (!device) return;
    const newCreds = {
      name: device.name || '',
      label: device.label || '',
      clientId: '',
      username: '',
      password: '',
      credentials: device.credentials || null,
    };

    if (
      device?.credentials?.credentialsType === "MQTT_BASIC" &&
      device.credentials.credentialsValue
    ) {
      try {
        const parsed = JSON.parse(device.credentials.credentialsValue);
        newCreds.clientId = parsed.clientId || '';
        newCreds.username = parsed.userName || '';
        newCreds.password = parsed.password || '';
      } catch (err) {
        console.error("Failed to parse credentials", err);
      }
    }

    setLocalCreds(newCreds);
  }, [device]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    if (!localCreds.name || !localCreds.label) {
      alert("Please fill in required fields: Name & Label.");
      return;
    }
    // Pass the entire localCreds object to the parent's onSubmit
    onSubmit(localCreds);
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xl font-bold text-gray-600 hover:text-red-500"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Edit Device</h2>

        {/* Stepper */}
        <div className="my-5 flex gap-10 py-4 border-y border-[#ddd]">
          {["Device Details", "Credentials"].map((stepName, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 ${activeStep === (i === 0) ? "text-[#305680]" : "text-[#999999]"}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${(i === 0 && activeStep) || (i === 1 && !activeStep) ? "bg-[#305680]" : "bg-[#e0e0e0]"
                  } text-white`}
              >
                {i + 1}
              </span>
              <span className="font-medium">{stepName}</span>
            </div>
          ))}
        </div>

        <form className="space-y-4">
          {activeStep ? (
            // Step 1 – Device Details
            <>
              {["name", "label"].map((field) => (
                <div key={field}>
                  <label className="block mb-1 font-medium text-gray-700">{field.toUpperCase()} *</label>
                  <input
                    type="text"
                    required
                    value={localCreds[field] || ""}
                    onChange={(e) => setLocalCreds((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder={`Enter device ${field}`}
                  />
                </div>
              ))}
            </>
          ) : (
            // Step 2 – Credentials
            <>
              {["clientId", "username", "password"].map((field) => (
                <div key={field}>
                  <label className="block mb-1 font-medium text-gray-700 capitalize">{field}</label>
                  <input
                    type="text"
                    value={localCreds[field] || ""}
                    onChange={(e) => setLocalCreds((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder={`Enter ${field}`}
                    autoComplete={field === 'password' ? 'new-password' : 'off'}
                  />
                </div>
              ))}
            </>
          )}

          {/* Footer buttons */}
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
              className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
            >
              {activeStep ? "Next" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={save}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${save ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {save ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}