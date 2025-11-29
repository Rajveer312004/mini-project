import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#4CAF50", "#F44336", "#FFC107"];

const FundUtilizationChart = ({ data }) => {
  const chartData = [
    { name: "Used Funds", value: data.totalUsed },
    { name: "Remaining Funds", value: data.totalAllocated - data.totalUsed },
  ];

  return (
    <div className="bg-white shadow-md p-6 rounded-xl">
      <h2 className="text-lg font-bold mb-4 text-blue-700">Fund Utilization Overview</h2>
      <PieChart width={400} height={300}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default FundUtilizationChart;
