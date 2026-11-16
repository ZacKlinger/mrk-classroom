import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceGrowth, GROWTH_SECONDS } from '../src/growth.js';

test('growth requires both water and lights, and pauses without losing progress', () => {
  for (const [water, lights] of [[false,false],[true,false],[false,true]]) {
    assert.equal(advanceGrowth(.4, 8, {water, lights}), .4);
  }
  const half = advanceGrowth(0, GROWTH_SECONDS / 2, {water:true, lights:true});
  assert.equal(half, .5);
  assert.equal(advanceGrowth(half, 4, {water:false, lights:true}), half);
  assert.equal(advanceGrowth(half, GROWTH_SECONDS, {water:true, lights:true}), 1);
});

test('reduced motion shows the grown plants only when both conditions are met', () => {
  assert.equal(advanceGrowth(0, 0, {water:true, lights:true, reducedMotion:true}), 1);
  assert.equal(advanceGrowth(0, 30, {water:true, lights:false, reducedMotion:true}), 0);
  assert.equal(advanceGrowth(.5, -10, {water:true, lights:true}), .5);
});
