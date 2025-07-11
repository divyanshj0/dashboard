'use client';
import WaterProperty from '@/components/waterproperty';
import Efficiency from '@/components/efficiencydonut';
import EnergyEfficiency from '@/components/energyefficiency';
import ChemicalDosage from '@/components/chemicalDosage';
import TreatedWaterChart from '@/components/treatedwatergraph';
import FlowRaterChart from '@/components/flowratechart';
import ChemicalChart from '@/components/chemicalchart';

const map = {
  WaterProperty, Efficiency, EnergyEfficiency,
  ChemicalDosage, TreatedWaterChart, FlowRaterChart, ChemicalChart
};

export default function WidgetRenderer({ widget, telemetry }) {
  const Component = map[widget.type];
  const props = { ...widget.props };

  // If dynamic key, fetch from telemetry
  if (widget.type !== 'WaterProperty' && widget.props.key) {
    const v = telemetry[widget.props.key]?.[0]?.value;
    props.value = v;
  }

  return Component ? <Component {...props} /> : <div>Unknown widget</div>;
}
