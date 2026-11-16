import test from 'node:test';
import assert from 'node:assert/strict';
import { routeCount,routeDepths,routePoints,teeCount } from '../src/topology.js';

test('four independent upper/lower pairs preserve their lane through the full route',()=>{
  assert.equal(routeCount,4);
  assert.equal(new Set(routeDepths).size,4);
  for(let i=0;i<routeCount;i++){
    const points=routePoints(i);
    assert.ok(points.every(p=>p[2]===routeDepths[i]),'A route must not feed another lane');
    assert.ok(points.slice(0,4).every(p=>p[1]>1.5),'First leg traverses the upper level');
    assert.ok(points.slice(4).every(p=>p[1]<1),'Second leg traverses the lower level');
    assert.ok(points[1][0]<points[2][0],'Upper channel flows left to right');
    assert.ok(points[5][0]>points[6][0],'Lower channel flows back toward return');
    for(let j=1;j<points.length;j++)assert.ok(points[j][1]<=points[j-1][1],'Gravity-fed route must not run uphill');
  }
});
test('binary tee branching adds one outlet per fitting',()=>{
  assert.equal(teeCount(1),0);assert.equal(teeCount(4),3);assert.equal(teeCount(4)*2,6);
  assert.throws(()=>teeCount(0),RangeError);assert.throws(()=>teeCount(2.5),RangeError);
  assert.throws(()=>routePoints(4),RangeError);
});
