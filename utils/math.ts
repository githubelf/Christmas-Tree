import { Vector3, MathUtils } from 'three';
import { CONSTANTS } from '../types';

export const generateTreePosition = (index: number, total: number): Vector3 => {
  const y = (index / total) * CONSTANTS.TREE_HEIGHT;
  const radius = (CONSTANTS.TREE_HEIGHT - y) * (CONSTANTS.TREE_RADIUS / CONSTANTS.TREE_HEIGHT);
  const angle = index * 0.5; // Spiral factor
  
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  // Center the tree vertically
  return new Vector3(x, y - CONSTANTS.TREE_HEIGHT / 2, z);
};

export const generateScatterPosition = (): Vector3 => {
  // Random point inside a sphere
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * CONSTANTS.SCATTER_RADIUS;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new Vector3(x, y, z);
};

export const lerpVector3 = (v1: Vector3, v2: Vector3, alpha: number): Vector3 => {
  return new Vector3().copy(v1).lerp(v2, alpha);
};