import {Renderer, el, type ElemNode} from '@elemaudio/core';
import {RefMap} from './RefMap';
import srvb from './srvb';
import {parseDspState, parseJsonObject, type HydratedNode, type DspState, type JsonValue} from './types';
import {parameterIds, type ParamId} from '../src/shared/parameters';

// This project demonstrates writing a small FDN reverb effect in Elementary.
//
// First, we initialize a custom Renderer instance that marshals our instruction
// batches through the __postNativeMessage__ function to direct the underlying native
// engine.
type RenderBatch = JsonValue[];

const core = new Renderer((batch: RenderBatch) => {
  globalThis.__postNativeMessage__?.(JSON.stringify(batch));
});

// Next, a RefMap for coordinating our refs
const refs = new RefMap(core);

// Holding onto the previous state allows us a quick way to differentiate
// when we need to fully re-render versus when we can just update refs
let prevState: DspState | null = null;

function shouldRender(prevState: DspState | null, nextState: DspState) {
  return (prevState === null) || (prevState.sampleRate !== nextState.sampleRate);
}

function createParamRefs(state: DspState): Record<ParamId, ElemNode> {
  return Object.fromEntries(
    parameterIds.map((paramId) => [
      paramId,
      refs.getOrCreate(paramId, 'const', {value: state[paramId]}, []),
    ]),
  ) as Record<ParamId, ElemNode>;
}

function updateParamRefs(state: DspState) {
  for (const paramId of parameterIds) {
    refs.update(paramId, {value: state[paramId]});
  }
}

function getRendererNodeMap(renderer: Renderer): Map<number, HydratedNode> {
  const delegate = Object.getOwnPropertyDescriptor(renderer, '_delegate')?.value;

  if (typeof delegate !== 'object' || delegate === null) {
    throw new Error('Cannot hydrate DSP graph: renderer delegate is unavailable');
  }

  const nodeMap = Object.getOwnPropertyDescriptor(delegate, 'nodeMap')?.value;

  if (!(nodeMap instanceof Map)) {
    throw new Error('Cannot hydrate DSP graph: renderer node map is unavailable');
  }

  return nodeMap;
}

// The important piece: here we register a state change callback with the native
// side. This callback will be hit with the current processor state any time that
// state changes.
//
// Given the new state, we simply update our refs or perform a full render depending
// on the result of our `shouldRender` check.
globalThis.__receiveStateChange__ = (serializedState: string) => {
  const state = parseDspState(serializedState);

  if (shouldRender(prevState, state)) {
    const stats = core.render(...srvb({
      key: 'srvb',
      sampleRate: state.sampleRate,
      ...createParamRefs(state),
    }, el.in({channel: 0}), el.in({channel: 1})));

    console.log(stats);
  } else {
    console.log('Updating refs');
    updateParamRefs(state);
  }

  prevState = state;
};

// NOTE: This is highly experimental and should not yet be relied on
// as a consistent feature.
//
// This hook allows the native side to inject serialized graph state from
// the running elem::Runtime instance so that we can throw away and reinitialize
// the JavaScript engine and then inject necessary state for coordinating with
// the underlying engine.
globalThis.__receiveHydrationData__ = (data: string) => {
  const payload = parseJsonObject(data, 'hydration data');
  const nodeMap = getRendererNodeMap(core);

  for (const [k, v] of Object.entries(payload)) {
    nodeMap.set(parseInt(k, 16), {
      symbol: '__ELEM_NODE__',
      kind: '__HYDRATED__',
      hash: parseInt(k, 16),
      props: v,
      generation: {
        current: 0,
      },
    });
  }
};

// Finally, an error callback which just logs back to native
globalThis.__receiveError__ = (err: PluginError) => {
  console.log(`[Error: ${err.name}] ${err.message}`);
};
