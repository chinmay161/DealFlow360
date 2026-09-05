"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartCard } from "../../components/ChartCard";
import type { StatusDistributionData } from "../../types/manager.types";

interface QuotationsStatusChartProps {
  data?: StatusDistributionData[];
}

export const QuotationsStatusChart: React.FC<QuotationsStatusChartProps> = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard
      title="Quotations by Status"
      subtitle="Current status breakdown across active quotations portfolio"
    >
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Overlay */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="text-xl font-bold text-on-surface block tnum">{total}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">Total</span>
        </div>
      </div>
    </ChartCard>
  );
};
