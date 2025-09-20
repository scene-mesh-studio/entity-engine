/**
 * Location Tool - Get city geographic information
 */

import { z } from 'zod';
import { tool } from 'ai';

/**
 * Location tool - get geographic location information for cities
 */
export const locationTool = tool({
  description: 'Display geographic information for a city including coordinates, timezone, and population',
  inputSchema: z.object({
    city: z.string().describe('城市名称，如：北京、上海、广州'),
    includeWeather: z.boolean().default(false).describe('是否同时包含天气信息')
  }),
  execute: async ({ city, includeWeather }) => {
    // Simulate location API call - return component data directly
    const locationData = {
      city,
      country: '中国',
      province: getProvinceByCity(city),
      coordinates: getCityCoordinates(city),
      timezone: 'Asia/Shanghai',
      population: getCityPopulation(city),
      area: getCityArea(city)
    };

    // 如果需要天气信息，直接扩展数据结构
    if (includeWeather) {
      return {
        ...locationData,
        weather: {
          temperature: 22,
          condition: '晴天',
          humidity: 65
        }
      };
    }

    // 直接返回位置数据，不包装在success/data/message中
    return locationData;
  }
});

// 辅助函数 - 获取城市省份
function getProvinceByCity(city: string): string {
  const cityProvinceMap: Record<string, string> = {
    '北京': '北京市',
    '上海': '上海市',
    '深圳': '广东省',
    '广州': '广东省',
    '杭州': '浙江省',
    '成都': '四川省',
    '西安': '陕西省',
    '南京': '江苏省'
  };
  return cityProvinceMap[city] || '未知省份';
}

// 辅助函数 - 获取城市坐标
function getCityCoordinates(city: string): { lat: number; lng: number } {
  const coordinatesMap: Record<string, { lat: number; lng: number }> = {
    '北京': { lat: 39.9042, lng: 116.4074 },
    '上海': { lat: 31.2304, lng: 121.4737 },
    '深圳': { lat: 22.3193, lng: 114.1694 },
    '广州': { lat: 23.1291, lng: 113.2644 },
    '杭州': { lat: 30.2741, lng: 120.1551 },
    '成都': { lat: 30.5728, lng: 104.0668 },
    '西安': { lat: 34.3416, lng: 108.9398 },
    '南京': { lat: 32.0603, lng: 118.7969 }
  };
  return coordinatesMap[city] || { lat: 39.9042, lng: 116.4074 };
}

// 辅助函数 - 获取城市人口
function getCityPopulation(city: string): number {
  const populationMap: Record<string, number> = {
    '北京': 2154,
    '上海': 2424,
    '深圳': 1756,
    '广州': 1868,
    '杭州': 1220,
    '成都': 2094,
    '西安': 1295,
    '南京': 931
  };
  return populationMap[city] || 1000;
}

// 辅助函数 - 获取城市面积
function getCityArea(city: string): number {
  const areaMap: Record<string, number> = {
    '北京': 16410,
    '上海': 6340,
    '深圳': 1997,
    '广州': 7434,
    '杭州': 16853,
    '成都': 14335,
    '西安': 10108,
    '南京': 6587
  };
  return areaMap[city] || 5000;
}