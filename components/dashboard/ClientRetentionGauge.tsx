"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClientClassification } from "@/types/dashboard";

interface ClientRetentionGaugeProps {
  data: ClientClassification;
}

export function ClientRetentionGauge({ data }: ClientRetentionGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map client classification into pie sectors for the semi-circle gauge
  const chartData = [
    { name: "Regulares", value: data.regular, color: "#3B82F6" }, // Blue-500
    { name: "Novo(a)", value: data.novo, color: "#06B6D4" }, // Cyan-500
    { name: "Inativo", value: data.inativo, color: "#4B5563" }, // Gray-600
    { name: "Lista negra", value: data.listaNegra, color: "#EF4444" }, // Red-500
  ];

  // Filter out zero values so the segments render cleanly
  const activeSectors = chartData.filter(s => s.value > 0);
  const displaySectors = activeSectors.length > 0 
    ? activeSectors 
    : [{ name: "Sem dados", value: 1, color: "#374151" }];

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-[28px] shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest">
          Base de Clientes
        </h4>
        <p className="text-xs text-gray-400 font-medium">Classificação e fidelização</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between min-h-[200px]">
        {/* Semi-circle Gauge */}
        <div className="relative w-full h-32 flex items-end justify-center overflow-hidden">
          {mounted ? (
            <div className="absolute top-2 w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displaySectors}
                    cx="50%"
                    cy="65%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {displaySectors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-24 h-12 rounded-t-full border-4 border-gray-200 animate-pulse"></div>
          )}

          {/* Gauge Center Text */}
          <div className="absolute bottom-1 flex flex-col items-center select-none">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {data.total}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              total
            </span>
          </div>
        </div>

        {/* Legend / Metrics Grid */}
        <div className="w-full grid grid-cols-2 gap-x-6 gap-y-3.5 mt-4 border-t border-gray-100 pt-4">
          {/* Novo(a) */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-[#06B6D4] shrink-0" />
              <span className="font-bold text-gray-500 truncate">Novo(a)</span>
            </div>
            <span className="font-black text-gray-900 ml-2">{data.novo}</span>
          </div>

          {/* Inativo */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-[#4B5563] shrink-0" />
              <span className="font-bold text-gray-500 truncate">Inativo</span>
            </div>
            <span className="font-black text-gray-900 ml-2">{data.inativo}</span>
          </div>

          {/* Regulares */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-[#3B82F6] shrink-0" />
              <span className="font-bold text-gray-500 truncate">Regulares</span>
            </div>
            <span className="font-black text-gray-900 ml-2">{data.regular}</span>
          </div>

          {/* Lista Negra */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-[#EF4444] shrink-0" />
              <span className="font-bold text-gray-500 truncate">Lista negra</span>
            </div>
            <span className="font-black text-gray-900 ml-2">{data.listaNegra}</span>
          </div>

          {/* Retenção (Centered Row Span) */}
          <div className="col-span-2 flex items-center justify-between bg-purple-500/10 border border-purple-500/25 px-4 py-2 rounded-2xl text-xs mt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#A855F7]" />
              <span className="font-bold text-purple-600">Taxa de Retenção</span>
            </div>
            <span className="font-black text-purple-700 text-sm">
              {data.retencaoRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
