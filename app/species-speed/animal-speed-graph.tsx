/* eslint-disable */
"use client";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { csv } from "d3-fetch";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

// feature 3 - restrict diet to one of the three valid categories
type Diet = "carnivore" | "herbivore" | "omnivore";

// feature 3 - type for each cleaned CSV row we will visualize
interface AnimalDatum {
  name: string;
  speed: number;
  diet: Diet;
}

export default function AnimalSpeedGraph() {
  const graphRef = useRef<HTMLDivElement>(null);

  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  // feature 3 - load/parse cleaned CSV from /public so it can be fetched at /sample_animals.csv
  useEffect(() => {
    const load = async () => {
      try {
        const data = await csv("/sample_animals.csv", (row) => {
          // normalize and validate each row
          const name = (row.name ?? "").trim();
          const dietRaw = (row.diet ?? "").trim().toLowerCase();
          const speedRaw = (row.speed ?? "").trim();

          const speed = Number(speedRaw);
          if (!name || !Number.isFinite(speed)) return null;

          if (dietRaw !== "carnivore" && dietRaw !== "herbivore" && dietRaw !== "omnivore") return null;

          return {
            name,
            speed,
            diet: dietRaw as Diet,
          } satisfies AnimalDatum;
        });

        setAnimalData(data.filter((d): d is AnimalDatum => d !== null));
      } catch (e) {
        console.error("Failed to load /sample_animals.csv", e);
        setAnimalData([]);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!graphRef.current) return;

    graphRef.current.innerHTML = "";

    if (animalData.length === 0) return;

    const containerWidth = graphRef.current.clientWidth || 900;
    const width = Math.max(containerWidth, 700);
    const height = 480;
    const margin = { top: 60, right: 40, bottom: 220, left: 80 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const tooltip = select(graphRef.current)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "8px 10px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("line-height", "1.2")
      .style("max-width", "220px");

    const svg = select(graphRef.current).append("svg").attr("width", width).attr("height", height);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = scaleBand<string>()
      .domain(animalData.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.2);

    const yMax = max(animalData, (d) => d.speed) ?? 0;
    const y = scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

    const color = scaleOrdinal<Diet, string>()
      .domain(["herbivore", "omnivore", "carnivore"])
      .range(["#22c55e", "#a855f7", "#ef4444"]);

    const bars = chart
      .selectAll("rect")
      .data(animalData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.name) ?? 0)
      .attr("y", (d) => y(d.speed))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.speed))
      .attr("fill", (d) => color(d.diet))
      .on("mouseenter", (event, d) => {
        tooltip
          .style("opacity", "1")
          .html(
            `<div style="font-weight:600; margin-bottom:4px;">${d.name}</div>` +
              `<div>Diet: ${d.diet}</div>` +
              `<div>Speed: ${d.speed} km/h</div>`,
          );
      })
      .on("mousemove", (event) => {
        const e = event as MouseEvent;
        tooltip.style("left", `${e.offsetX + 12}px`).style("top", `${e.offsetY + 12}px`);
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", "0");
      });

    const xAxisG = chart.append("g").attr("transform", `translate(0,${innerHeight})`).call(axisBottom(x));
    xAxisG
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-65)")
      .attr("dx", "-0.7em")
      .attr("dy", "-0.1em")
      .style("font-size", "10px");

    chart.append("g").call(axisLeft(y));

    chart
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 90)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .text("Animal");

    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .text("Speed (km/h)");

    const legend = svg.append("g").attr("transform", `translate(${width - margin.right - 140},${margin.top - 35})`);
    const legendItems: { diet: Diet; label: string }[] = [
      { diet: "herbivore", label: "Herbivore" },
      { diet: "omnivore", label: "Omnivore" },
      { diet: "carnivore", label: "Carnivore" },
    ];

    const item = legend
      .selectAll("g")
      .data(legendItems)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(0,${i * 18})`);

    item
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", (d) => color(d.diet));
    item
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "12px")
      .attr("fill", "currentColor")
      .text((d) => d.label);
  }, [animalData]);

  return <div ref={graphRef} className="relative min-h-[450px] w-full" />;
}
