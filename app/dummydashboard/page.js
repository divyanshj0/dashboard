'use client';
import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import WidgetEditorModal from '@/components/WidgetEditorModal';
import WaterProperty from '@/components/waterproperty';
import Efficiency from '@/components/efficiencydonut';
import EnergyEfficiency from '@/components/energyefficiency';
import ChemicalDosage from '@/components/chemicalDosage';
import TreatedWaterChart from '@/components/treatedwatergraph';
import FlowRaterChart from '@/components/flowratechart';
import ChemicalChart from '@/components/chemicalchart';

const ResponsiveGridLayout = WidthProvider(Responsive);

// 📦 Initial static layout config (will become editable)
const initialWidgets = [
    { i: 'water', type: 'WaterProperty', x: 0, y: 0, w: 6, h: 4 },
    { i: 'efficiency', type: 'Efficiency', x: 6, y: 0, w: 3, h: 2, value: 85 },
    { i: 'energy', type: 'EnergyEfficiency', x: 9, y: 0, w: 3, h: 2, value: 78 },
    { i: 'chemicalBox', type: 'ChemicalDosage', x: 6, y: 2, w: 6, h: 2, view: 'daily' },
    { i: 'treated', type: 'TreatedWaterChart', x: 0, y: 4, w: 4, h: 3, view: 'daily' },
    { i: 'flowrate', type: 'FlowRaterChart', x: 4, y: 4, w: 4, h: 3, view: 'daily' },
    { i: 'chemchart', type: 'ChemicalChart', x: 8, y: 4, w: 4, h: 3, view: 'daily' },
];

export default function DashboardGrid() {
    const [widgets, setWidgets] = useState(initialWidgets);
    const [showEditor, setShowEditor] = useState(false);

    const renderWidget = (widget) => {
        switch (widget.type) {
            case 'WaterProperty':
                return (
                    <WaterProperty
                        inletflow={120}
                        inlettds={500}
                        outletflow={100}
                        outlettds={30}
                        rejectflow={20}
                        rejecttds={1500}
                        pumprate={40}
                        pump={1}
                    />
                );
            case 'Efficiency':
                return <Efficiency value={widget.value || 0} />;
            case 'EnergyEfficiency':
                return <EnergyEfficiency value={widget.value || 0} />;
            case 'ChemicalDosage':
                return <ChemicalDosage view={widget.view} />;
            case 'TreatedWaterChart':
                return <TreatedWaterChart view={widget.view} />;
            case 'FlowRaterChart':
                return <FlowRaterChart view={widget.view} />;
            case 'ChemicalChart':
                return <ChemicalChart view={widget.view} />;
            default:
                return <div className="p-4 text-gray-500">Unknown Widget</div>;
        }
    };

    return (
        <div className="p-4 pt-0 bg-gray-100 min-h-screen">
            {/* Header */}
            <div className="bg-blue-100 shadow-md flex flex-col md:flex-row mx-4 p-4 justify-between items-start md:items-center rounded-md gap-2">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <img src="/company_logo[1].png" alt="logo" className="w-48" />
                    <p className="text-2xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
                    <div className="flex gap-2 items-center">
                        <p className="text-lg font-medium">Last Updated</p>
                        <span>4 July 17:05:07</span>
                    </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700" onClick={() => setShowEditor(true)}>
                    Customize Layout
                </button>
            </div>

            {/* Dynamic Grid */}
            <ResponsiveGridLayout
                className="layout mt-4"
                layouts={{ lg: widgets.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })) }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
                rowHeight={100}
                isDraggable={true}
                isResizable={true}
            >
                {widgets.map((widget) => (
                    <div key={widget.i} className="bg-white p-2 rounded shadow">
                        {renderWidget(widget)}
                    </div>
                ))}
            </ResponsiveGridLayout>
            {showEditor && (
                <WidgetEditorModal
                    widgets={widgets}
                    setWidgets={setWidgets}
                    onClose={() => setShowEditor(false)}
                />
            )}
        </div>
    );
}
