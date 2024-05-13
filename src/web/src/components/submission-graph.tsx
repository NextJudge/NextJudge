"use client";
import { cn } from "@/lib/utils";
import HeatMap, { HeatMapValue } from "@uiw/react-heat-map";
import { useState } from "react";

const generateRandomData = (count: number) => {
  const data: HeatMapValue[] = [];
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 30);
    data.push({
      date: new Date(2016, month, day).toDateString(),
      content: `Count: ${Math.floor(Math.random() * 30)}`,
      count: Math.floor(Math.random() * 30),
    });
  }
  return data;
};

export default function SubmissionGraph() {
  const [value] = useState(generateRandomData(130));
  return (
    <>
      <HeatMap
        value={value}
        monthLabels={[
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ]}
        width={700}
        className={cn("mx-auto my-8 scale-125")}
        startDate={new Date("2016/01/01")}
        endDate={new Date("2016/12/31")}
        panelColors={{
          0: "#f4decd",
          2: "#e4b293",
          4: "#d48462",
          10: "#c2533a",
          20: "#ad001d",
          30: "#000",
        }}
      />
    </>
  );
}
