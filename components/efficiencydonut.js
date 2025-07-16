'use client';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';

const Efficiency = ({ series = [], label = "" }) => {
  // Get the latest value from the first series in the array
  const latestValue = series?.[0]?.data?.[0]?.value ?? 0;

  const chartData = [
    {
      name: 'Efficiency',
      value: parseFloat(latestValue), // Ensure numeric
      fill: '#83a6ed',
    }
  ];

  return (
    <div className="h-full w-full bg-white flex flex-col justify-center items-center rounded-md shadow-md">
      <div className="text-lg font-medium mt-2 px-2 text-center">% {label}</div>
      <div className="w-[120px] h-[120px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            barSize={15}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              angleAxisId={0}
              cornerRadius={5}
              background
              clockWise
              dataKey="value"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold">{`${chartData[0].value}%`}</span>
        </div>
      </div>
    </div>
  );
};

export default Efficiency;
