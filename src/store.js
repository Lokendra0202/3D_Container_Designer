import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
  container: { length: 6, width: 2.5, height: 3, material: 'metal' },
  elements: [],
  selectedElement: null,
  loadingElements: {}, // Track loading state of elements by ID
  elementErrors: {}, // Track loading errors by ID
  // Camera recording / playback state
  cameraKeyframes: [], // { t, position: [x,y,z], quaternion: [x,y,z,w] }
  cameraRecording: false,
  cameraPlayback: false,
  lastRecordingUrl: null,
  materials: ['wood', 'metal', 'plastic', 'glass', 'concrete', 'fabric'],
  colors: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'],
  snapToGrid: true,
  gridSize: 0.1,
  snapToRotation: false,
  rotationSnapAngle: Math.PI / 2, // 90 degrees
  boundaryMargin: 0.05, // Margin to keep elements from clipping into walls

  setContainerDimensions: (dimensions) =>
        set((state) => ({
          container: { ...state.container, ...dimensions }
        })),

  setContainerMaterial: (material) => set((state) => ({
    container: { ...state.container, material }
  })),

  autoArrangeElement: (element) => {
    const state = get();
    const container = state.container;
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

  // addElement intentionally defined later (with loading state) — previous simple implementation removed

  removeElement: (id) => set((state) => {
    // Find the element to be removed
    const elementToRemove = state.elements.find(el => el.id === id);
    
    // If it's a custom element with cleanup function, call it
    if (elementToRemove && elementToRemove.cleanup) {
      elementToRemove.cleanup();
    }
    
    return {
      elements: state.elements.filter(el => el.id !== id)
    };
  }),

  updateElement: (id, updates) => set((state) => ({
    // Only apply update if values actually change to avoid infinite update loops
    elements: (function(){
      let changed = false;
      const newElements = state.elements.map(el => {
        if (el.id !== id) return el;
        const merged = { ...el, ...updates };
        // shallow compare relevant keys
        const keys = Object.keys(updates);
        for (const k of keys) {
          const a = el[k];
          const b = merged[k];
          if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length || a.some((v,i)=>v !== b[i])) { changed = true; break; }
          } else if (a !== b) { changed = true; break; }
        }
        return merged;
      });
      if (!changed) return state.elements; // no change
      return newElements;
    })()
  })),

  selectElement: (id) => set({ selectedElement: id }),

  moveElement: (id, position) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id
        ? { ...el, position: [...position] }
        : el
    )
  })),

  exportDesign: () => {
    const state = get();
    return JSON.stringify({ container: state.container, elements: state.elements.filter(el => el.type !== 'custom') }, null, 2);
  },

  saveProgress: () => {
    const state = get();
    const progress = {
      container: state.container,
      elements: state.elements.filter(el => el.type !== 'custom'), // Exclude custom elements from save
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
            rotationSnapAngle: progress.rotationSnapAngle
          });
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      };
      reader.readAsText(file);
    }
  },

  clampPosition: (id, newPosition, elementOverride = null) => {
    const state = get();
    const elements = state.elements;
    const element = elementOverride || elements.find(el => el.id === id);
    if (!element) return newPosition;

    const container = state.container;
    const halfLength = container.length / 2;
    const halfWidth = container.width / 2;
    const halfHeight = container.height / 2;

    const margin = state.boundaryMargin;
    const scaledSize = element.size.map(s => s * (element.scale || 1));

    // Clamp position to stay within bounds
    const clamped = [...newPosition];
    clamped[0] = Math.max(-halfLength + scaledSize[0]/2 + margin, Math.min(halfLength - scaledSize[0]/2 - margin, clamped[0]));
    clamped[1] = Math.max(0 + scaledSize[1]/2 + margin, Math.min(halfHeight - scaledSize[1]/2 - margin, clamped[1]));
    clamped[2] = Math.max(-halfWidth + scaledSize[2]/2 + margin, Math.min(halfWidth - scaledSize[2]/2 - margin, clamped[2]));

    return clamped;
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
    const margin = state.boundaryMargin;
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

  // Helper function to create deep copy of element
  _copyElement: (el) => ({
    ...el,
    position: el.position ? [...el.position] : [0, 0, 0],
    rotation: el.rotation ? [...el.rotation] : [0, 0, 0],
    size: el.size ? [...el.size] : [1, 1, 1],
    scale: el.scale || 1,
    autoFit: el.autoFit || false,
    modelUrl: el.modelUrl || null,
    type: el.type,
    material: el.material,
    color: el.color,
    isOpen: el.isOpen || false
  }),

  // Helper function to create state snapshot
  _createSnapshot: (state) => ({
    elements: state.elements.map(el => state._copyElement(el)),
    container: { ...state.container },
    selectedElement: state.selectedElement,
    loadingElements: { ...state.loadingElements },
    elementErrors: { ...state.elementErrors }
  }),

  // History state management is currently disabled
  saveState: () => {},
  canUndo: () => false,
  canRedo: () => false,

  // Loading state management
  setElementLoading: (id, isLoading) => {
    const state = get();
    const current = state.loadingElements[id];
    if (current === isLoading) return; // avoid unnecessary updates
    set((s) => ({
      loadingElements: {
        ...s.loadingElements,
        [id]: isLoading
      }
    }));
  },

  setElementError: (id, hasError) => {
    const state = get();
    const current = state.elementErrors[id];
    if (current === hasError) return;
    set((s) => ({
      elementErrors: {
        ...s.elementErrors,
        [id]: hasError
      }
    }));
  },

  // Modified addElement to include initial loading state
  addElement: (element) => set((state) => {
    const id = Date.now();
    const position = state.autoArrangeElement(element);
    
    return {
      ...state,
      elements: [...state.elements, { 
        ...element, 
        position, 
        id, 
        rotation: [0, 0, 0], 
        isOpen: false, 
        scale: 1,
        autoFit: true // mark newly added elements to be auto-fitted when their model loads
      }],
      loadingElements: {
        ...state.loadingElements,
        [id]: true
      }
    };
  }),

  // Camera recording actions
  addCameraKeyframe: (keyframe) => set((state) => ({ cameraKeyframes: [...state.cameraKeyframes, keyframe] })),
  clearCameraKeyframes: () => set({ cameraKeyframes: [] }),
  setCameraRecording: (isRecording) => set({ cameraRecording: isRecording }),
  setCameraPlayback: (isPlaying) => set({ cameraPlayback: isPlaying }),
  setLastRecordingUrl: (url) => set({ lastRecordingUrl: url }),

  // Refresh functionality
  refreshAllElements: () => set((state) => {
    // Call cleanup functions for custom elements before clearing
    state.elements.forEach(el => {
      if (el.cleanup) {
        el.cleanup();
      }
    });

    // Clear all elements, loading states, errors, and selected element
    return {
      elements: [],
      loadingElements: {},
      elementErrors: {},
      selectedElement: null
    };
  })
    }),
    {
      name: 'container-design-store', // unique name for localStorage key
      version: 1, // Increment version to invalidate old data with custom elements
      partialize: (state) => ({
        container: state.container,
        elements: state.elements.filter(el => el.type !== 'custom'), // Exclude custom elements from persistence
        selectedElement: state.selectedElement,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        snapToRotation: state.snapToRotation,
        rotationSnapAngle: state.rotationSnapAngle
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          // Filter out any custom elements that might have been persisted
          state.elements = state.elements.filter(el => el.type !== 'custom');
        }
        if (error) {
          console.warn('Error rehydrating store:', error);
        }
      }
    }
  )
);

export default useStore;