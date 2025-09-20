/**
 * 🎨 预置生成式UI组件
 * 
 * Pure component definitions without registration system
 * Reference: Generative User Interfaces documentation
 * 实现原理：直接导入使用，不再使用动态注册系统
 */

import React from 'react';

// ================================
// Weather component example
// ================================

interface WeatherProps {
  temperature?: number;
  weather?: string;
  location?: string;
  humidity?: number;
  windSpeed?: number;
}

const WeatherComponent: React.FC<WeatherProps> = ({ 
  temperature = 0, 
  weather = '', 
  location = '',
  humidity,
  windSpeed
}) => (
   <div style={{ 
     background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
     color: 'white',
     padding: '1.5rem',
     borderRadius: '0.75rem',
     margin: '0.5rem 0',
     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
   }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🌤️</span>
      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{location}</h3>
    </div>
    <p style={{ margin: '0.25rem 0', fontSize: '1rem' }}>{weather}</p>
    <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{temperature}°C</p>
    {humidity && <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>湿度: {humidity}%</p>}
     {windSpeed && <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>风速: {windSpeed} km/h</p>}
   </div>

);


// ================================
// 地理位置组件 - 匹配 getLocation 工具
// ================================

interface LocationProps {
  city?: string;
  country?: string;
  province?: string;
  coordinates?: { lat: number; lng: number };
  timezone?: string;
  population?: number;
  area?: number;
}

const LocationComponent: React.FC<LocationProps> = ({
  city = '',
  country = '',
  province = '',
  coordinates,
  timezone = '',
  population,
  area
}) => (
  <div style={{
    background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    margin: '0.5rem 0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📍</span>
      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{city}</h3>
    </div>
    {province && <p style={{ margin: '0.25rem 0', fontSize: '1rem' }}>{province}, {country}</p>}
    {coordinates && (
      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
        坐标: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
      </p>
    )}
    {timezone && <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>时区: {timezone}</p>}
    {population && <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>人口: {population.toLocaleString()}万人</p>}
    {area && <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>面积: {area.toLocaleString()} km²</p>}
  </div>
);

// ================================
// 代码执行组件
// ================================

interface CodeExecutionProps {
  code?: string;
  language?: string;
  output?: string;
  status?: 'success' | 'error' | 'running';
}

const CodeExecutionComponent: React.FC<CodeExecutionProps> = ({
  code = '',
  language = 'javascript',
  output = '',
  status = 'success'
}) => (
  <div style={{
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    margin: '0.5rem 0',
    overflow: 'hidden'
  }}>
    <div style={{
      background: '#334155',
      color: 'white',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center'
    }}>
      <span style={{ marginRight: '0.5rem' }}>💻</span>
      <span>代码执行 ({language})</span>
      <span style={{ 
        marginLeft: 'auto',
        fontSize: '0.75rem',
        color: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#f59e0b'
      }}>
        {status === 'success' ? '✅ 成功' : status === 'error' ? '❌ 错误' : '⏳ 运行中'}
      </span>
    </div>
    {code && (
      <div style={{ padding: '1rem' }}>
        <pre style={{
          background: '#1e293b',
          color: '#e2e8f0',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          overflow: 'auto',
          margin: '0 0 1rem 0'
        }}>
          {code}
        </pre>
      </div>
    )}
    {output && (
      <div style={{ padding: '0 1rem 1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>输出:</h4>
        <pre style={{
          background: status === 'error' ? '#fef2f2' : '#f0f9ff',
          color: status === 'error' ? '#dc2626' : '#0f172a',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          overflow: 'auto',
          margin: 0,
          border: `1px solid ${status === 'error' ? '#fecaca' : '#e0f2fe'}`
        }}>
          {output}
        </pre>
      </div>
    )}
  </div>
);

// ================================
// Pure component exports without registration system
// ================================

// 实体数据组件已移除，统一使用DynamicUI中的动态组件

// 直接导出基础组件供MessageBubble等使用
export {
  WeatherComponent,
  LocationComponent,
  CodeExecutionComponent
};

// 默认导出基础组件
export default {
  WeatherComponent,
  LocationComponent,
  CodeExecutionComponent
};