export type ParameterDefinition = {
  paramId: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export const pluginWindow = {
  width: 753,
  height: 373,
} as const;

export const parameterDefinitions = [
  {paramId: 'size', name: 'Size', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'decay', name: 'Decay', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'mod', name: 'Mod', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'mix', name: 'Mix', min: 0.0, max: 1.0, defaultValue: 0.5},
] as const satisfies readonly ParameterDefinition[];

export type ParamId = (typeof parameterDefinitions)[number]['paramId'];
export type PluginState = Record<ParamId, number>;

export const parameterIds = parameterDefinitions.map(({paramId}) => paramId) as ParamId[];

export const defaultPluginState = Object.fromEntries(
  parameterDefinitions.map(({paramId, defaultValue}) => [paramId, defaultValue]),
) as PluginState;

export const pluginManifest = {
  window: pluginWindow,
  parameters: parameterDefinitions,
} as const;
