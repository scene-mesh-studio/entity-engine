/**
 * Weather Tool - Get city weather information
 */

import { z } from 'zod';
import { tool } from 'ai';

/**
 * Weather tool - get weather information for specified city
 */
export const weatherTool = tool({
  description: 'Display weather information for a city including temperature, conditions, and humidity',
  inputSchema: z.object({
    location: z.string().describe('城市名称，如：北京、上海、深圳'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius').describe('温度单位：摄氏度或华氏度')
  }),
  execute: async ({ location, unit }) => 
    // Simulate weather API call - return component data directly
     ({
      location,
      temperature: unit === 'celsius' ? 22 : 72,
      weather: '晴天',
      humidity: 65,
      windSpeed: 12,
      unit,
      lastUpdated: new Date().toISOString()
    })
  
});