import { Vector3 } from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface ParticleData {
  id: number;
  treePos: Vector3;
  scatterPos: Vector3;
  color: string;
  size: number;
  speed: number;
}

// Aesthetics Constants
export const COLORS = {
  EMERALD_DEEP: '#002a1a',
  EMERALD_LIGHT: '#10b981',
  
  // Metallic / PBR Colors
  GOLD_RICH: '#FFD700',      // Standard Gold
  GOLD_DEEP: '#B8860B',      // Dark Goldenrod
  BRONZE: '#8B4513',         // SaddleBrown/Bronze
  GREEN_METALLIC: '#004d00', // Deep metallic green
  GREEN_DARK: '#002200',
  
  WHITE_GLOW: '#FFFFE0',

  // Added missing colors
  GOLD_BRIGHT: '#FFD700',
  GOLD_METALLIC: '#D4AF37',
};

export const CONSTANTS = {
  // Geometric Tree Counts (InstancedMesh)
  SPHERE_COUNT: 1200,
  CUBE_COUNT: 800,
  
  TREE_HEIGHT: 14,
  TREE_RADIUS: 5.5,
  SCATTER_RADIUS: 18,

  // Particle System
  PARTICLE_COUNT: 2000,
};