import { Responsive, WidthProvider } from 'react-grid-layout';
import WaterProperty from './waterproperty';
import Efficiency from './efficiencydonut';
import EnergyEfficiency from './energyefficiency';
import TreatedWaterChart from './treatedwatergraph';
import ChemicalChart from './chemicalchart';
import ImageComponent from './Imagecomponent';
import MapWidget from './MapWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function WidgetRenderer({ config, layout, saveLayout, onLayoutSave, token, onGeofenceChange, onLatestTimestampChange }) {
  if (!config || !config.widgets || !Array.isArray(config.widgets)) return null;

  return (
    <ResponsiveGridLayout
      className="layout overflow-visible"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 24, md: 16, sm: 12, xs: 8 }}
      rowHeight={70}
      isDraggable={saveLayout}
      isResizable={saveLayout}
      onLayoutChange={(newLayout) => {
        if (!saveLayout) return;
        if (onLayoutSave) onLayoutSave(newLayout);
      }}
    >
      {config.widgets.map((w, i) => {
        const key = w.id || w.name || `widget-${i}`;
        
        return (
          <div key={key} className={`${saveLayout ? 'bg-white p-2' : ''} z-[1] rounded`}>
            {(() => {
              switch (w.type) {
                case 'donut':
                  return <Efficiency parameters={w.parameters} label={w.name} token={token} onLatestTimestampChange={onLatestTimestampChange} />;
                case 'pie':
                  return <EnergyEfficiency parameters={w.parameters} label={w.name} token={token} onLatestTimestampChange={onLatestTimestampChange} />;
                case 'line':
                  return <TreatedWaterChart title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} onLatestTimestampChange={onLatestTimestampChange} />;
                case 'bar':
                  return <ChemicalChart title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} onLatestTimestampChange={onLatestTimestampChange} />;
                case 'card':
                  return <WaterProperty title={w.name} parameters={w.parameters} token={token} onLatestTimestampChange={onLatestTimestampChange} />;
                case 'image':
                  return <ImageComponent title={w.parameters[0].title} imgsrc={w.parameters[0].publicLink}/>;
                case 'map':
                  return <MapWidget title={w.name} parameters={w.parameters} token={token} geoFence={w.geofence} onGeofenceChange={(geofence)=>{onGeofenceChange(geofence,w.id)} }/>;
                default:
                  return (
                    <div className="text-center">
                      <p className="text-sm font-semibold">{w.name}</p>
                    </div>
                  );
              }
            })()}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}