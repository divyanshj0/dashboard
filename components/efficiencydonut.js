import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';

const data = [
  {
    name: 'Efficiency',
    value: 95,
    fill: '#83a6ed',
  },
];

const Efficiency = () => {
  return (
    <div className=" h-[190px] bg-white flex flex-col justify-center items-center rounded-md shadow-md">
      <div className="text-lg font-medium mt-2 px-2">% Output Efficiency</div>
      <ResponsiveContainer >
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          barSize={15}
          data={data}
          startAngle={90}
          endAngle={-270} // full 360° clockwise
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false}/>
          <RadialBar
            angleAxisId={0}
            cornerRadius={5}
            background
            clockWise
            dataKey='value'
          />
          <text
            x="51%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={24}
            fontWeight={600}
          >
            {`${data[0].value}%`}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Efficiency;
