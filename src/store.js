import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
  container: { length: 6, width: 2.5, height: 3, material: 'metal' },
  elements: [],
  selectedElement: null,
  materials: ['wood', 'metal', 'plastic', 'glass', 'concrete', 'fabric'],
  colors: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'],
  snapToGrid: true,
  gridSize: 0.1,
  snapToRotation: false,
  rotationSnapAngle: Math.PI / 2, // 90 degrees
  past: [],
  future: [],

setContainerDimensions: (dimensions) =>
        set((state) => ({
          container: { ...state.container, ...dimensions },
          past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
          future: []
        })),

  setContainerMaterial: (material) => set((state) => ({
    container: { ...state.container, material },
    past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
    future: []
  })),

  autoArrangeElement: (element) => {
    const state = get();
    const container = state.container;
    const elements = state.elements;
    const halfLength = container.length / 2;
    const halfWidth = container.width / 2;
    const halfHeight = container.height / 2;

    // Define zones based on element type
    const zones = {
      entrance: ['door', 'door_with_frame', 'doors'],
      sleeping: ['bed', 'double_bed', 'twobed'],
      dining: ['table', 'chair', 'table_chairs'],
      bathroom: ['toilet', 'toilet_alt', 'sink', 'shower'],
      kitchen: ['cupboards', 'kitchen_assets', 'cupboard', 'fridge'],
      living: ['sofa_large', 'retro_tv', 'lamp'],
      utilities: ['fan', 'ac', 'tube_light', 'switches', 'outlet', 'partition', 'wall_panel', 'cabin_wall', 'dirty_window', 'window'],
      appliances: ['washing_machine', 'table_fan']
    };

    let preferredPosition = [0, 0, 0];
    let category = '';

    // Determine category and preferred position
    for (const [cat, types] of Object.entries(zones)) {
      if (types.includes(element.type)) {
        category = cat;
        break;
      }
    }

    switch (category) {
      case 'entrance':
        preferredPosition = [halfLength - element.size[0]/2 - 0.05, element.size[1]/2, 0];
        break;
      case 'sleeping':
        preferredPosition = [-halfLength + element.size[0]/2 + 0.05, element.size[1]/2, -halfWidth + element.size[2]/2 + 0.05];
        break;
      case 'dining':
        preferredPosition = [0, element.size[1]/2, 0];
        break;
      case 'bathroom':
        preferredPosition = [-halfLength + element.size[0]/2 + 0.05, element.size[1]/2, halfWidth - element.size[2]/2 - 0.05];
        break;
      case 'kitchen':
        preferredPosition = [halfLength - element.size[0]/2 - 0.05, element.size[1]/2, -halfWidth + element.size[2]/2 + 0.05];
        break;
      case 'living':
        preferredPosition = [0, element.size[1]/2, halfWidth - element.size[2]/2 - 0.05];
        break;
      case 'utilities':
        if (element.type === 'fan' || element.type === 'tube_light') {
          preferredPosition = [0, container.height - element.size[1]/2 - 0.05, 0];
        } else if (element.type === 'ac') {
          preferredPosition = [0, container.height - element.size[1]/2 - 0.05, halfWidth - element.size[2]/2 - 0.05];
        } else if (element.type === 'partition') {
          preferredPosition = [0, halfHeight, 0];
        } else if (element.type === 'wall_panel' || element.type === 'cabin_wall') {
          preferredPosition = [0, halfHeight, -halfWidth + element.size[2]/2];
        } else if (element.type === 'window' || element.type === 'dirty_window') {
          preferredPosition = [0, halfHeight, halfWidth - element.size[2]/2 - 0.05];
        } else {
          preferredPosition = [halfLength - element.size[0]/2 - 0.05, halfHeight, 0];
        }
        break;
      case 'appliances':
        preferredPosition = [-halfLength + element.size[0]/2 + 0.05, element.size[1]/2, 0];
        break;
      default:
        preferredPosition = [0, element.size[1]/2, 0];
    }

    // Try to find a valid position, starting with preferred, then trying offsets
    let position = [...preferredPosition];
    const maxAttempts = 10;
    let attempt = 0;
    let valid = false;

    while (!valid && attempt < maxAttempts) {
      if (state.validatePosition(null, position, element)) {
        valid = true;
      } else {
        // Try small random offsets
        const offsetX = (Math.random() - 0.5) * 0.5;
        const offsetZ = (Math.random() - 0.5) * 0.5;
        position[0] = Math.max(-halfLength + element.size[0]/2 + 0.05, Math.min(halfLength - element.size[0]/2 - 0.05, preferredPosition[0] + offsetX));
        position[2] = Math.max(-halfWidth + element.size[2]/2 + 0.05, Math.min(halfWidth - element.size[2]/2 - 0.05, preferredPosition[2] + offsetZ));
        attempt++;
      }
    }

    return position;
  },

  addElement: (element) => set((state) => {
    const position = state.autoArrangeElement(element);
    return {
      elements: [...state.elements, { ...element, position, id: Date.now(), rotation: [0, 0, 0], isOpen: false, scale: 1 }],
      past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
      future: []
    };
  }),

  removeElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id),
    past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
    future: []
  })),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
    future: []
  })),

  selectElement: (id) => set({ selectedElement: id }),

  moveElement: (id, position) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id
        ? { ...el, position: [...position] }
        : el
    ),
    past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
    future: []
  })),

  exportDesign: () => {
    const state = get();
    return JSON.stringify({ container: state.container, elements: state.elements }, null, 2);
  },

  saveProgress: () => {
    const state = get();
    const progress = {
      container: state.container,
      elements: state.elements,
      selectedElement: state.selectedElement,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
      snapToRotation: state.snapToRotation,
      rotationSnapAngle: state.rotationSnapAngle
    };
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'container-design-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  loadProgress: (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const progress = JSON.parse(e.target.result);
          set({
            container: progress.container,
            elements: progress.elements,
            selectedElement: progress.selectedElement,
            snapToGrid: progress.snapToGrid,
            gridSize: progress.gridSize,
            snapToRotation: progress.snapToRotation,
            rotationSnapAngle: progress.rotationSnapAngle,
            past: [],
            future: []
          });
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      };
      reader.readAsText(file);
    }
  },

  validatePosition: (id, newPosition, elementOverride = null) => {
    const state = get();
    const elements = state.elements;
    const element = elementOverride || elements.find(el => el.id === id);
    if (!element) return false;

    const container = state.container;
    const halfLength = container.length / 2;
    const halfWidth = container.width / 2;
    const halfHeight = container.height / 2;

    // Check bounds: element should not go outside container (accounting for scaled element size)
    const margin = 0.05; // Small margin for walls
    const scaledSize = element.size.map(s => s * (element.scale || 1));
    if (
      newPosition[0] - scaledSize[0]/2 < -halfLength + margin ||
      newPosition[0] + scaledSize[0]/2 > halfLength - margin ||
      newPosition[1] - scaledSize[1]/2 < 0 + margin ||
      newPosition[1] + scaledSize[1]/2 > halfHeight - margin ||
      newPosition[2] - scaledSize[2]/2 < -halfWidth + margin ||
      newPosition[2] + scaledSize[2]/2 > halfWidth - margin
    ) {
      return false;
    }

    // Check for collisions with other elements
    const elementsToCheck = elementOverride ? elements : elements.filter(el => el.id !== id);
    for (const other of elementsToCheck) {
      const otherScaledSize = other.size.map(s => s * (other.scale || 1));
      if (
        Math.abs(newPosition[0] - other.position[0]) < (scaledSize[0] + otherScaledSize[0]) / 2 &&
        Math.abs(newPosition[1] - other.position[1]) < (scaledSize[1] + otherScaledSize[1]) / 2 &&
        Math.abs(newPosition[2] - other.position[2]) < (scaledSize[2] + otherScaledSize[2]) / 2
      ) {
        return false;
      }
    }

    return true;
  },

  validateRotation: (id, newRotation) => {
    const state = get();
    const elements = state.elements;
    const element = elements.find(el => el.id === id);
    if (!element) return false;

    // Basic bounds check for all rotations: keep within -2π to 2π
    for (let i = 0; i < 3; i++) {
      if (newRotation[i] < -2 * Math.PI || newRotation[i] > 2 * Math.PI) return false;
    }

    // Special validation for doors: only allow Y-axis rotation for opening/closing
    if (element.type === 'door') {
      // For doors, X and Z should be 0, Y between 0 and π/2
      if (newRotation[0] !== 0 || newRotation[2] !== 0) return false;
      if (newRotation[1] < 0 || newRotation[1] > Math.PI / 2) return false;

      // Check if rotated door intersects with walls
      const container = state.container;
      const doorWidth = element.size[0];

      // When rotated 90 degrees, check if it fits
      if (Math.abs(newRotation[1] - Math.PI / 2) < 0.1) {
        const protrusion = doorWidth / 2;
        if (element.position[0] + protrusion > container.length / 2 - 0.05 ||
            element.position[0] - protrusion < -container.length / 2 + 0.05) {
          return false;
        }
      }
    }

    // For other elements, basic validation passed
    return true;
  },

  snapPosition: (position) => {
    const state = get();
    if (!state.snapToGrid) return position;

    return [
      Math.round(position[0] / state.gridSize) * state.gridSize,
      Math.round(position[1] / state.gridSize) * state.gridSize,
      Math.round(position[2] / state.gridSize) * state.gridSize
    ];
  },

  getAlignmentGuides: (id, position) => {
    const state = get();
    const elements = state.elements;
    const element = elements.find(el => el.id === id);
    if (!element) return [];

    const guides = [];
    const container = state.container;

    // Wall alignment guides
    const wallThreshold = 0.1;
    if (Math.abs(position[0] - (container.length / 2 - element.size[0]/2)) < wallThreshold) {
      guides.push({ axis: 'x', value: container.length / 2 - element.size[0]/2, type: 'wall' });
    }
    if (Math.abs(position[0] - (-container.length / 2 + element.size[0]/2)) < wallThreshold) {
      guides.push({ axis: 'x', value: -container.length / 2 + element.size[0]/2, type: 'wall' });
    }
    if (Math.abs(position[2] - (container.width / 2 - element.size[2]/2)) < wallThreshold) {
      guides.push({ axis: 'z', value: container.width / 2 - element.size[2]/2, type: 'wall' });
    }
    if (Math.abs(position[2] - (-container.width / 2 + element.size[2]/2)) < wallThreshold) {
      guides.push({ axis: 'z', value: -container.width / 2 + element.size[2]/2, type: 'wall' });
    }
    if (Math.abs(position[1] - element.size[1]/2) < wallThreshold) {
      guides.push({ axis: 'y', value: element.size[1]/2, type: 'floor' });
    }

    // Element alignment guides
    for (const other of elements) {
      if (other.id === id) continue;

      // Horizontal alignment
      if (Math.abs(position[0] - other.position[0]) < wallThreshold) {
        guides.push({ axis: 'x', value: other.position[0], type: 'element' });
      }
      // Vertical alignment
      if (Math.abs(position[1] - other.position[1]) < wallThreshold) {
        guides.push({ axis: 'y', value: other.position[1], type: 'element' });
      }
      // Depth alignment
      if (Math.abs(position[2] - other.position[2]) < wallThreshold) {
        guides.push({ axis: 'z', value: other.position[2], type: 'element' });
      }
    }

    return guides;
  },

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setGridSize: (size) => set({ gridSize: size }),

  snapRotation: (rotation) => {
    const state = get();
    if (!state.snapToRotation) return rotation;

    return [
      Math.round(rotation[0] / state.rotationSnapAngle) * state.rotationSnapAngle,
      Math.round(rotation[1] / state.rotationSnapAngle) * state.rotationSnapAngle,
      Math.round(rotation[2] / state.rotationSnapAngle) * state.rotationSnapAngle
    ];
  },

  toggleSnapToRotation: () => set((state) => ({ snapToRotation: !state.snapToRotation })),

  setRotationSnapAngle: (angle) => set({ rotationSnapAngle: angle }),

  saveState: () => set((state) => ({
    past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
    future: []
  })),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      elements: previous.elements,
      container: previous.container,
      selectedElement: previous.selectedElement,
      past: state.past.slice(0, -1),
      future: [{ elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }, ...state.future]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      elements: next.elements,
      container: next.container,
      selectedElement: next.selectedElement,
      past: [...state.past, { elements: [...state.elements], container: { ...state.container }, selectedElement: state.selectedElement }],
      future: state.future.slice(1)
    };
  }),

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0
    }),
    {
      name: 'container-design-store', // unique name for localStorage key
      partialize: (state) => ({
        container: state.container,
        elements: state.elements,
        selectedElement: state.selectedElement,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        snapToRotation: state.snapToRotation,
        rotationSnapAngle: state.rotationSnapAngle
      })
    }
  )
);

export default useStore;
