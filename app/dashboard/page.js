'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WidgetEditorModal from '@/components/WidgetEditorModal';
import WidgetRenderer from '@/components/WidgetRenderer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DynamicDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [showEditor, setShowEditor] = useState(false);
  const token = localStorage.getItem('tb_token');
  const devices = JSON.parse(localStorage.getItem('tb_devices') || '[]');

  useEffect(() => {
    if (!token) return router.push('/');
    (async () => {
      // Fetch attributes and telemetry
      const res = await fetch('/api/thingsboard/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, devices }),
      });
      const data = await res.json();
      setWidgets(data.layout || []);      // layout + props embedded
      setTelemetry(data.telemetry || {});
      setLoading(false);
    })();
  }, []);

  const onSave = async (newWidgets) => {
    setWidgets(newWidgets);
    await fetch('/api/thingsboard/saveDashboardConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, layout: newWidgets }),
    });
  };

  if (loading) return <div>Loading dashboard…</div>;

  const layout = widgets.map(w => ({
    i: w.i, x: w.x, y: w.y, w: w.w, h: w.h,
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-end mb-4 gap-2">
        <button onClick={() => setShowEditor(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded">Customize Layout</button>
      </div>

      <ResponsiveGridLayout
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={100}
        isDraggable
        isResizable
        onLayoutChange={(l) => {
          // Sync positions
          const L = widgets.map(w => {
            const lo = l.find(i=>i.i === w.i);
            return lo ? {...w, x: lo.x, y: lo.y, w: lo.w, h: lo.h} : w;
          });
          setWidgets(L);
        }}
      >
        {widgets.map(w => (
          <div key={w.i} className="bg-white rounded shadow p-2">
            <WidgetRenderer widget={w} telemetry={telemetry} />
          </div>
        ))}
      </ResponsiveGridLayout>

      {showEditor && (
        <WidgetEditorModal
          widgets={widgets}
          setWidgets={onSave}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
