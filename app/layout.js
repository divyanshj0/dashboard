import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; // Add this line for the drawing controls

export const metadata = {
  title: "Water Monitoring Dashboard",
  description: "Dashboard by The Elite Pro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="!bg-white !text-gray-800 !rounded-lg !shadow-lg border border-gray-200"
          bodyClassName="flex items-center"
          progressClassName="bg-green-500"
        />
      </body>
    </html>
  );
}