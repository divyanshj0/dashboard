import "./globals.css";
export const metadata = {
  title: "Water Monitoring Dashboard",
  description: "Dashboard by The Elite Pro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
