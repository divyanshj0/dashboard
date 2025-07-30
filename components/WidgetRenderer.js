'use client';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WaterProperty from './waterproperty';
import Efficiency from './efficiencydonut';
import EnergyEfficiency from './energyefficiency';
import TreatedWaterChart from './treatedwatergraph';
import FlowRaterChart from './flowratechart';
import ChemicalChart from './chemicalchart';
import ChemicalDosage from './chemicalDosage';
import ImageComponent from './Imagecomponent';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function WidgetRenderer({ config, layout, saveLayout, onLayoutSave, token }) {
  if (!config || !config.widgets || !Array.isArray(config.widgets)) return null;

  return (
    <ResponsiveGridLayout
      className="layout overflow-visible"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      rowHeight={100}
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
                  return <Efficiency parameters={w.parameters} label={w.name} token={token} />;
                case 'pie':
                  return <EnergyEfficiency parameters={w.parameters} label={w.name} token={token} />;
                case 'line':
                  return <TreatedWaterChart title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} />;
                case 'table':
                  return <FlowRaterChart title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} />;
                case 'bar':
                  return <ChemicalChart title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} />;
                case 'chemicaldosage':
                  return <ChemicalDosage title={w.name} parameters={w.parameters} token={token} saveLayout={saveLayout} />;
                case 'card':
                  return <WaterProperty title={w.name} parameters={w.parameters} token={token} />;
                case 'image':
                  return <ImageComponent title={w.parameters[0].title} imgsrc={w.parameters[0].publicLink}/>
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