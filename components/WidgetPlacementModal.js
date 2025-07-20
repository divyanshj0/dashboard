'use client';
import { useState,useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function WidgetPlacementModal({ widgets, onSave, onClose }) {
  const [layout, setLayout] = useState(
    widgets.map((w, i) => ({
      i: w.id || `${i}`,
      x: (i * 2) % 12,
      y: Infinity,
      w: 3,
      h: 2,
      ...w.layout, // preserve layout if already defined
    }))
  );

  const handleSave = () => {
    const updatedWidgets = widgets.map((widget, i) => ({
      ...widget,
      layout: layout.find(l => l.i === (widget.id || `${i}`))
    }));
    onSave(updatedWidgets);
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white w-full sm:w-3/4 lg:w-2/3 max-h-[90vh] rounded-md p-4 shadow-lg overflow-auto relative">
        <h2 className="text-xl font-semibold mb-4">Arrange Dashboard Widgets</h2>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          onLayoutChange={setLayout}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={100}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          isDraggable
          isResizable
        >
          {widgets.map((widget, i) => (
            <div key={widget.id || `${i}`} className="bg-blue-100 rounded-md shadow flex items-center justify-center">
              <p className="text-center text-sm p-2">{widget.name || widget.key}</p>
            </div>
          ))}
        </ResponsiveGridLayout>

        <div className="flex justify-end mt-4 gap-2">
          <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Save Layout</button>
        </div>
      </div>
    </div>
  );
}
