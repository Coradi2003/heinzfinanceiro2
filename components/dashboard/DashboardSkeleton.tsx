"use client";

import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Filters skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161b26] border border-gray-800/50 p-4 rounded-3xl">
        <div className="h-6 w-48 bg-gray-800 rounded-lg"></div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 w-28 bg-gray-800 rounded-xl flex-1 md:flex-none"></div>
          <div className="h-10 w-28 bg-gray-800 rounded-xl flex-1 md:flex-none"></div>
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#161b26] border border-gray-800/50 p-5 rounded-[24px] h-32 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="h-3 w-24 bg-gray-800 rounded"></div>
              <div className="w-8 h-8 rounded-xl bg-gray-800"></div>
            </div>
            <div className="h-6 w-16 bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main charts grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161b26] border border-gray-800/50 p-6 rounded-[28px] h-80 flex flex-col justify-between">
          <div className="h-4 w-32 bg-gray-800 rounded"></div>
          <div className="w-full h-48 bg-gray-800/50 rounded-2xl flex items-center justify-center"></div>
        </div>
        <div className="bg-[#161b26] border border-gray-800/50 p-6 rounded-[28px] h-80 flex flex-col justify-between">
          <div className="h-4 w-32 bg-gray-800 rounded"></div>
          <div className="w-full h-48 bg-gray-800/50 rounded-2xl flex items-center justify-center"></div>
        </div>
      </div>
    </div>
  );
}
