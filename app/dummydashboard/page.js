'use client';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WaterProperty from '@/components/waterproperty';
import Efficiency from '@/components/efficiencydonut';
import EnergyEfficiency from '@/components/energyefficiency';
import ChemicalDosage from '@/components/chemicalDosage';
import TreatedWaterChart from '@/components/treatedwatergraph';
import FlowRaterChart from '@/components/flowratechart';
import ChemicalChart from '@/components/chemicalchart';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardGrid() {
    const layout = [
        { i: 'water', x: 0, y: 0, w: 6, h: 4 },
        { i: 'efficiency', x: 6, y: 0, w: 3, h: 2 },
        { i: 'energy', x: 9, y: 0, w: 3, h: 2 },
        { i: 'chemicalBox', x: 6, y: 2, w: 6, h: 2 },
        { i: 'treated', x: 0, y: 4, w: 4, h: 3 },
        { i: 'flowrate', x: 4, y: 4, w: 4, h: 3 },
        { i: 'chemchart', x: 8, y: 4, w: 4, h: 3 },
    ];

    return (
            <div className="p-4 pt-0 bg-gray-100  min-h-screen">
                <div className=" bg-blue-100 shadow-md flex flex-col md:flex-row mx-4  p-4 justify-between items-start md:items-center rounded-md gap-2">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <img src="/company_logo[1].png" alt="logo" className="w-48" />
                        <p className="text-2xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
                        <div className="flex gap-2 items-center">
                            <p className="text-lg font-medium">Last Updated</p>
                            <span>4 July 17:05:07</span>
                        </div>
                    </div>
                </div>
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
                    rowHeight={100}
                    isDraggable={true}
                    isResizable={true}
                >
                    <div key="water" className="bg-white p-2 rounded shadow">
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
                    </div>
                    <div key="efficiency" className="bg-white p-2 rounded shadow">
                        <Efficiency value={85} />
                    </div>
                    <div key="energy" className="bg-white p-2 rounded shadow">
                        <EnergyEfficiency value={78} />
                    </div>
                    <div key="chemicalBox" className="bg-white p-2 rounded shadow">
                        <ChemicalDosage view="daily" />
                    </div>
                    <div key="treated" className="bg-white p-2 rounded shadow">
                        <TreatedWaterChart view="daily" />
                    </div>
                    <div key="flowrate" className="bg-white p-2 rounded shadow">
                        <FlowRaterChart view="daily" />
                    </div>
                    <div key="chemchart" className="bg-white p-2 rounded shadow">
                        <ChemicalChart view="daily" />
                    </div>
                </ResponsiveGridLayout>
            </div>
    );
}
