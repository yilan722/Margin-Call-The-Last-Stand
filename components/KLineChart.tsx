
import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, ReferenceLine } from 'recharts';
import { PricePoint } from '../types';

interface Props {
  data: PricePoint[];
}

const KLineChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const minPrice = Math.min(...data.map(d => d.price)) * 0.99;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.01;
  const initialPrice = data[0].price;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis 
          domain={[minPrice, maxPrice]} 
          hide 
        />
        <ReferenceLine y={initialPrice} stroke="#475569" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke="#06b6d4" 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default KLineChart;
