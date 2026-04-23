import type { MCPScenario } from '../types';

export const weatherScenario: MCPScenario = {
  id: 'weather',
  name: 'Weather Tool',
  description:
    'Simulates a weather service MCP server - current conditions and 5-day forecasts.',
  serverInfo: { name: 'weather-server', version: '1.0.0' },
  capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a city.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name, e.g. "London"' },
        },
        required: ['city'],
      },
    },
    {
      name: 'get_forecast',
      description: 'Get a 5-day forecast for a city.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          days: { type: 'number', description: 'Number of forecast days (1-5)' },
        },
        required: ['city'],
      },
    },
  ],
  resources: [],
  prompts: [
    {
      name: 'weather_report',
      description: 'Generate a prompt for a natural language weather summary',
      arguments: [
        { name: 'city', description: 'City to report on', required: true },
        { name: 'style', description: 'casual or formal', required: false },
      ],
    },
  ],
  toolHandlers: {
    get_weather: (params) => {
      const city = (params.city as string) || 'Unknown';
      const data = {
        city,
        temperature: 18,
        unit: 'celsius',
        condition: 'Partly cloudy',
        humidity: 62,
        windSpeed: 14,
        windUnit: 'km/h',
      };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    },
    get_forecast: (params) => {
      const city = (params.city as string) || 'Unknown';
      const days = Math.min(Number(params.days ?? 3), 5);
      const conditions = ['Sunny', 'Partly cloudy', 'Overcast', 'Light rain', 'Clear'];
      const forecast = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        condition: conditions[i % conditions.length],
        high: 20 - i,
        low: 12 - i,
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ city, forecast }, null, 2) }] };
    },
  },
  resourceHandlers: {},
  promptHandlers: {
    weather_report: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Write a ${args.style ?? 'casual'} weather summary for ${args.city}. Use the get_weather tool first to fetch current conditions.`,
        },
      },
    ],
  },
};
