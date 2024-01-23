import request from "@/service/request";
import { GetQueryString } from "@/service/utils";
import * as echarts from "echarts";
import React, { useEffect, useRef, useState } from "react";
import "./sleep.less";

// 1是准备入睡，2是睡眠中，3是清醒

const sleepTypes = ["睡眠潜伏期", "睡眠中", "清醒", "入睡时间", "醒来时间"];

const colors = ["#9d9889", "#1485d0", "#11d45b"];

function calculateHoursFromBaseTime(inputTime = "19:44") {
  // 将时间转换为24小时制
  const [hours, minutes] = inputTime.split(":").map(Number);

  // 计算相对于晚上20点的小时数
  const hoursFromBaseTime =
    (hours >= 20 ? hours - 20 : hours + 24 - 20) + minutes / 60;

  return hoursFromBaseTime;
}
function mapValueToTime(value) {
  const baseHour = 20; // 晚上20点作为基准
  const hours = (baseHour + value) % 24; // 将值映射到24小时制
  const formattedTime = `${hours.toString().padStart(2, "0")}:00`; // 格式化为 HH:mm

  return formattedTime;
}
const StackedBarChart = () => {
  const chartRef = useRef(null);
  const [list, setList] = useState([]);
  const xAxis = useRef([]);
  const seriesList = useRef([]);

  useEffect(() => {
    sessionStorage.token =
      GetQueryString("token") ??
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJyb2xlTmFtZSI6Im9wX0kxNUFtVjRxeXAyTF9udmFtbzYxQi1uZDAiLCJ1c2VySWQiOiI0MDUiLCJwbGF0Zm9ybUNvZGUiOjJ9.G4iLwIXnKHVIFtOq-m_yxwXQdmw60YaDc5fFBqdE56yDUdYYVIAT0lbK5TU3A3gvdTJ8I90hCTRJb_IDya0Wog";
    getData();
  }, []);

  const getData = async () => {
    const res = await request({
      url: "/sleep/record/curve",
      data: {
        childrenId: 259,
      },
    });
    setList(res.data);
    buildOps(res.data);
  };

  const buildOps = (data) => {
    xAxis.current = data.map((v) => v.day);
    let maxLen = 0;
    let refData: any = {};
    data.forEach((v) => {
      if (maxLen < v.data.length) {
        maxLen = v.data.length;
        refData = v;
      }
      v.data.forEach((c, i) => {
        c.startVal = calculateHoursFromBaseTime(c.start);
        c.endVal =
          i === v.data.length - 1 ? 24 : calculateHoursFromBaseTime(c.end);
        c.value = c.endVal - c.startVal;
      });
    });
    const sleepSeries = {
      name: "入睡时间",
      type: "line",
      data: [],
      color: "#dc1f48",
    };
    const wakeupSeries = {
      name: "醒来时间",
      type: "line",
      data: [],
      color: "#ffd340",
    };
    const series = refData.data.map((v) => ({
      name: sleepTypes[v.type - 1],
      type: "bar",
      stack: "sleep",
      data: new Array(xAxis.current.length),
      color: colors[v.type - 1],
    }));
    data.forEach((v, i1) => {
      v.data.forEach((c, i2) => {
        series[i2].data[i1] = c;
        if (c.type === 1) {
          sleepSeries.data.push({
            ...c,
            value: c.startVal,
            valueText: c.start,
          });
        }
        if (i2 === 2) {
          wakeupSeries.data.push({ ...c, value: c.endVal, valueText: c.end });
        }
      });
    });
    seriesList.current = [...series, sleepSeries, wakeupSeries];
    renderChart();
    console.log("🚀 ~ buildOps ~ refData:", data, series, refData);
  };

  const renderChart = () => {
    const chart = echarts.init(chartRef.current);

    var option = {
      title: {
        text: "",
      },
      tooltip: {
        trigger: "item",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params, i) {
          console.log("🚀 ~ renderChart ~ option.tooltip.params:", params, i);
          if (params.seriesType === "line") {
            return `${params.seriesName}：${params.data.valueText}`;
          }
          if (params.seriesType === "bar") {
            return `${params.seriesName}：${params.data.start} - ${params.data.end}`;
          }
          //   let tar;
          //   if (params[1] && params[1].value !== "-") {
          //     tar = params[1];
          //   } else {
          //     tar = params[2];
          //   }
          return "";
        },
      },
      legend: {
        data: sleepTypes,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xAxis.current,
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 24,
        interval: 2,
        axisLabel: {
          formatter: function (value, index) {
            // 根据实际情况设置别名
            return mapValueToTime(value);
          },
        },
      },
      series: seriesList.current,
    };

    chart.setOption(option);
  };

  return (
    <div className="index">
      <div className="title">睡眠图</div>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
};

export default StackedBarChart;
