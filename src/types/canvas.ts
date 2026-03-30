export type ElementType = "stroke" | "text" | "code";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  
  // Specific to strokes
  color?: string;
  width?: number;
  points?: Point[];
  isEraser?: boolean;
  
  // Specific to DOM elements (Text / Code)
  content?: string;
  position?: Point;
  
  // Specific to Code
  language?: string;
}

export interface CanvasState {
  background: string;
  elements: CanvasElement[];
}
