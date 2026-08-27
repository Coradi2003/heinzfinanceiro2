"use client";

import React, { useEffect, useState } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { ChartDataPoint } from "@/types/dashboard";

interface RevenueChartProps {
  data: ChartDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if there are any revenues to display
  const hasRevenue = data.some(d => d.receita > 0);

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-[28px] shadow-sm flex flex-col h-full">
      <div className="mb-6">
        <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest">
          Evolução do Faturamento
        </h4>
        <p className="text-xs text-gray-400 font-medium">Histórico diário de receitas</p>
      </div>

      <div className="flex-1 w-full h-52 min-h-[200px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                stroke="#9ca3af" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                dy={10}
                tickFormatter={(tick) => tick.split("/")[0]} // Show just day number on axis
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                dx={-5}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderRadius: "12px",
                  border: "1px solid #374151",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
                formatter={(value: any) => [
                  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                  "Faturamento",
                ]}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="#4F46E5" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
