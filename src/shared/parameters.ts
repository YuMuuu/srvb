export type ParamId = 'size' | 'decay' | 'mod' | 'mix';

export type PluginState = {
  size: number;
  decay: number;
  mod: number;
  mix: number;
};

export type ParameterDefinition = {
  paramId: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export const parameterDefinitions = [
  {paramId: 'size', name: 'Size', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'decay', name: 'Decay', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'mod', name: 'Mod', min: 0.0, max: 1.0, defaultValue: 0.5},
  {paramId: 'mix', name: 'Mix', min: 0.0, max: 1.0, defaultValue: 0.5},
] as const satisfies readonly ParameterDefinition[];

export const defaultPluginState = {
  size: 0.5,
  decay: 0.5,
  mod: 0.5,
  mix: 0.5,
} satisfies PluginState;
