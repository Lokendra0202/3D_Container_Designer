import { Box, Typography, TextField, Button, Card, CardContent, List, ListItem, ListItemText, 
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, CircularProgress, 
  ListItemIcon, Tooltip } from '@mui/material';
import { Add, Delete, GetApp, TableRestaurant, Chair, Bed, Wc, AcUnit, CloudUpload,
  Error as ErrorIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import useStore from './store';

const rotationPresets = [
  { label: '0°', value: 0 },
  { label: '90°', value: Math.PI / 2 },
  { label: '180°', value: Math.PI },
  { label: '270°', value: (3 * Math.PI) / 2 },
];

function ControlPanel() {
  const { 
    container, elements, setContainerDimensions, setContainerMaterial, 
    addElement, removeElement, updateElement, selectedElement, 
    selectElement, materials, colors, exportDesign, saveProgress, 
    loadProgress, snapToGrid, toggleSnapToGrid, gridSize, setGridSize, 
    snapToRotation, toggleSnapToRotation, rotationSnapAngle, setRotationSnapAngle,
    loadingElements, elementErrors 
  } = useStore();

  const handleAddElement = (type) => {
    let size, material, color;
    switch (type) {
      case 'door':
        size = [0.9, 2, 0.1];
        material = 'wood';
        color = '#8B4513';
        break;
      case 'window':
        size = [1, 1, 0.1];
        material = 'glass';
        color = '#87CEEB';
        break;
      case 'partition':
        size = [0.1, container.height, container.width];
        material = 'wood';
        color = '#D2B48C';
        break;
      case 'shelf':
        size = [container.length, 0.1, container.width];
        material = 'wood';
        color = '#A0522D';
        break;
      case 'table':
        size = [1.5, 0.8, 1];
        material = 'wood';
        color = '#8B4513';
        break;
      case 'chair':
        size = [0.5, 1, 0.5];
        material = 'wood';
        color = '#D2B48C';
        break;
      case 'bed':
        size = [1.8, 0.5, 1.5];
        material = 'fabric';
        color = '#FFFFFF';
        break;
      case 'toilet':
        size = [0.6, 0.8, 0.6];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'fan':
        size = [0.5, 0.1, 0.5];
        material = 'metal';
        color = '#C0C0C0';
        break;
      case 'ac':
        size = [1, 0.3, 0.3];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'sink':
        size = [0.8, 0.9, 0.5];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'double_bed':
        size = [1.8, 0.5, 1.8];
        material = 'fabric';
        color = '#FFFFFF';
        break;
      case 'dirty_window':
        size = [1.2, 1.2, 0.1];
        material = 'glass';
        color = '#87CEEB';
        break;
      case 'kitchen_assets':
        size = [1.5, 1, 0.5];
        material = 'metal';
        color = '#C0C0C0';
        break;
      case 'retro_tv':
        size = [1, 0.6, 0.3];
        material = 'plastic';
        color = '#000000';
        break;
      case 'shower':
        size = [1, 2, 1];
        material = 'glass';
        color = '#87CEEB';
        break;
      case 'sofa_large':
        size = [1.5, 0.8, 0.8];
        material = 'fabric';
        color = '#8B4513';
        break;
      case 'switches':
        size = [0.2, 0.1, 0.05];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'table_chairs':
        size = [1.8, 0.8, 1.5];
        material = 'wood';
        color = '#8B4513';
        break;
      case 'toilet_alt':
        size = [0.6, 0.8, 0.6];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'tube_light':
        size = [1.2, 0.1, 0.1];
        material = 'metal';
        color = '#C0C0C0';
        break;
      case 'washing_machine':
        size = [0.7, 1, 0.6];
        material = 'metal';
        color = '#FFFFFF';
        break;
      case 'science_research_table':
        size = [1.5, 0.8, 1];
        material = 'wood';
        color = '#8B4513';
        break;
      case 'office_desk':
        size = [1.2, 0.75, 0.6];
        material = 'wood';
        color = '#D2B48C';
        break;
      case 'square_recessed_led':
        size = [0.3, 0.1, 0.3];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'sideboard_kitchen':
        size = [1, 0.9, 0.4];
        material = 'wood';
        color = '#8B4513';
        break;
      case 'psx_wooden_chair':
        size = [0.5, 1, 0.5];
        material = 'wood';
        color = '#D2B48C';
        break;
      case 'plastic_table':
        size = [1, 0.75, 0.75];
        material = 'plastic';
        color = '#FFFFFF';
        break;
      case 'table_and_chair':
        size = [1.5, 0.8, 1];
        material = 'wood';
        color = '#8B4513';
        break;
      default:
        size = [1, 1, 1];
        material = materials[0];
        color = colors[0];
    }
    addElement({
      type,
      size,
      material,
      color
    });
  };

  const handleExport = () => {
    const design = exportDesign();
    const blob = new Blob([design], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'container-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{
      width: 320,
      p: 2,
      bgcolor: 'grey.100',
      height: '100vh',
      overflowY: 'auto',
      '@media (max-width: 768px)': {
        width: '100%',
        p: 1,
        height: 'auto',
        minHeight: '100vh',
        position: 'relative'
      }
    }}>
      <Typography variant="h5" gutterBottom sx={{
        '@media (max-width: 768px)': {
          fontSize: '1.25rem'
        }
      }}>Control Panel</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Container Dimensions</Typography>
          <TextField label="Length" type="number" value={container.length} onChange={(e) => setContainerDimensions({ ...container, length: parseFloat(e.target.value) })} fullWidth margin="normal" />
          <TextField label="Width" type="number" value={container.width} onChange={(e) => setContainerDimensions({ ...container, width: parseFloat(e.target.value) })} fullWidth margin="normal" />
          <TextField label="Height" type="number" value={container.height} onChange={(e) => setContainerDimensions({ ...container, height: parseFloat(e.target.value) })} fullWidth margin="normal" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Snapping & Alignment</Typography>
          <FormControlLabel
            control={<Switch checked={snapToGrid} onChange={toggleSnapToGrid} />}
            label="Snap to Grid"
          />
          <TextField
            label="Grid Size"
            type="number"
            value={gridSize}
            onChange={(e) => setGridSize(parseFloat(e.target.value))}
            fullWidth
            margin="normal"
            inputProps={{ min: 0.01, max: 1, step: 0.01 }}
          />
          <FormControlLabel
            control={<Switch checked={snapToRotation} onChange={toggleSnapToRotation} />}
            label="Snap to Rotation"
          />
          <TextField
            label="Rotation Snap Angle"
            type="number"
            value={rotationSnapAngle}
            onChange={(e) => setRotationSnapAngle(parseFloat(e.target.value))}
            fullWidth
            margin="normal"
            inputProps={{ min: 0.1, max: Math.PI, step: 0.1 }}
          />
          
        </CardContent>
      </Card>

      

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Add Elements</Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 1,
            '@media (max-width: 768px)': {
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 0.5,
              '& .MuiButton-root': {
                minWidth: 'auto',
                padding: '6px 4px',
                fontSize: '0.7rem',
                minHeight: '36px'
              }
            }
          }}>
            <Button variant="contained" startIcon={<CloudUpload />} component="label">
              Add Element
              <input
                type="file"
                accept=".glb,.gltf"
                hidden
                onClick={(e) => {
                  // Reset the input value so the same file can be selected again
                  e.target.value = '';
                }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Generate a unique name for this upload
                    const fileName = `custom_${Date.now()}_${file.name}`;
                    const url = URL.createObjectURL(file);
                    
                    // Add cleanup function to revoke URL when element is removed
                    const cleanup = () => URL.revokeObjectURL(url);
                    
                    addElement({
                      type: fileName,
                      modelUrl: url,
                      size: [1, 1, 1],
                      material: 'custom',
                      color: '#ffffff',
                      cleanup: cleanup // Store cleanup function with element
                    });
                  }
                }}
              />
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('door')}>Door</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('window')}>Window</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('table')}>Table</Button>
            <Button variant="contained" startIcon={<Chair />} onClick={() => handleAddElement('chair')}>Chair</Button>
            <Button variant="contained" startIcon={<Bed />} onClick={() => handleAddElement('bed')}>Bed</Button>
            <Button variant="contained" startIcon={<Wc />} onClick={() => handleAddElement('toilet')}>Toilet</Button>
            <Button variant="contained" startIcon={<AcUnit />} onClick={() => handleAddElement('fan')}>Fan</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('ac')}>AC</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('sink')}>Sink</Button>
            <Button variant="contained" startIcon={<Bed />} onClick={() => handleAddElement('double_bed')}>Double Bed</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('dirty_window')}>Dirty Window</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('kitchen_assets')}>Kitchen Assets</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('retro_tv')}>Retro TV</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('shower')}>Shower</Button>
            <Button variant="contained" startIcon={<Chair />} onClick={() => handleAddElement('sofa_large')}>Large Sofa</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('switches')}>Switches</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('table_chairs')}>Table & Chairs</Button>
            <Button variant="contained" startIcon={<Wc />} onClick={() => handleAddElement('toilet_alt')}>Toilet Alt</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('tube_light')}>Tube Light</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('washing_machine')}>Washing Machine</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('science_research_table')}>Science Research Table</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('office_desk')}>Office Desk</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('square_recessed_led')}>Square Recessed LED</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleAddElement('sideboard_kitchen')}>Sideboard Kitchen</Button>
            <Button variant="contained" startIcon={<Chair />} onClick={() => handleAddElement('psx_wooden_chair')}>PSX Wooden Chair</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('plastic_table')}>Plastic Table</Button>
            <Button variant="contained" startIcon={<TableRestaurant />} onClick={() => handleAddElement('table_and_chair')}>Table and Chair</Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Elements</Typography>
          <List>
            {elements.map(el => (
              <ListItem 
                key={el.id} 
                button 
                onClick={() => selectElement(el.id)} 
                selected={selectedElement === el.id}
                sx={{
                  opacity: loadingElements[el.id] ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <ListItemIcon>
                  {loadingElements[el.id] ? (
                    <CircularProgress size={20} />
                  ) : elementErrors[el.id] ? (
                    <Tooltip title="Failed to load model">
                      <ErrorIcon color="error" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Model loaded">
                      <CheckCircleIcon color="success" fontSize="small" />
                    </Tooltip>
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={`${el.type} - ${el.material}`}
                  secondary={loadingElements[el.id] ? 'Loading...' : ''}
                />
              </ListItem>
            ))}
          </List>
          {selectedElement && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<Delete />} 
                onClick={() => removeElement(selectedElement)}
                disabled={loadingElements[selectedElement]}
              >
                Remove Selected
              </Button>
              {useStore.getState().elementErrors[selectedElement] && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    // Trigger a reload by updating the element
                    const el = elements.find(e => e.id === selectedElement);
                    if (el) {
                      updateElement(selectedElement, { ...el });
                    }
                  }}
                >
                  Retry Load
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedElement && (() => {
        const el = elements.find(e => e.id === selectedElement);
        return el ? (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Edit Selected Element</Typography>
              <Box>
                <TextField label="Scale" type="number" value={el.scale || 1} onChange={(e) => updateElement(selectedElement, { scale: parseFloat(e.target.value) })} fullWidth margin="normal" inputProps={{ min: 0.1, max: 5, step: 0.1 }} />
                <TextField label="Size X" type="number" value={el.size[0]} onChange={(e) => updateElement(selectedElement, { size: [parseFloat(e.target.value), el.size[1], el.size[2]] })} fullWidth margin="normal" />
                <TextField label="Size Y" type="number" value={el.size[1]} onChange={(e) => updateElement(selectedElement, { size: [el.size[0], parseFloat(e.target.value), el.size[2]] })} fullWidth margin="normal" />
                <TextField label="Size Z" type="number" value={el.size[2]} onChange={(e) => updateElement(selectedElement, { size: [el.size[0], el.size[1], parseFloat(e.target.value)] })} fullWidth margin="normal" />
                <TextField label="Position X" type="number" value={el.position[0]} onChange={(e) => updateElement(selectedElement, { position: [parseFloat(e.target.value), el.position[1], el.position[2]] })} fullWidth margin="normal" />
                <TextField label="Position Y" type="number" value={el.position[1]} onChange={(e) => updateElement(selectedElement, { position: [el.position[0], parseFloat(e.target.value), el.position[2]] })} fullWidth margin="normal" />
                <TextField label="Position Z" type="number" value={el.position[2]} onChange={(e) => updateElement(selectedElement, { position: [el.position[0], el.position[1], parseFloat(e.target.value)] })} fullWidth margin="normal" />
                <TextField label="Rotation X" type="number" value={el.rotation[0]} onChange={(e) => updateElement(selectedElement, { rotation: [parseFloat(e.target.value), el.rotation[1], el.rotation[2]] })} fullWidth margin="normal" />
                <TextField label="Rotation Y" type="number" value={el.rotation[1]} onChange={(e) => updateElement(selectedElement, { rotation: [el.rotation[0], parseFloat(e.target.value), el.rotation[2]] })} fullWidth margin="normal" />
                <TextField label="Rotation Z" type="number" value={el.rotation[2]} onChange={(e) => updateElement(selectedElement, { rotation: [el.rotation[0], el.rotation[1], parseFloat(e.target.value)] })} fullWidth margin="normal" />
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Rotation Presets</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {rotationPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outlined"
                      size="small"
                      onClick={() => updateElement(selectedElement, { rotation: [0, preset.value, 0] })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </Box>
                <FormControlLabel
                  control={<Switch checked={snapToRotation} onChange={toggleSnapToRotation} />}
                  label="Snap to Rotation"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Material</InputLabel>
                  <Select value={el.material} onChange={(e) => updateElement(selectedElement, { material: e.target.value })}>
                    {materials.map(mat => <MenuItem key={mat} value={mat}>{mat}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Color</InputLabel>
                  <Select value={el.color} onChange={(e) => updateElement(selectedElement, { color: e.target.value })}>
                    {colors.map(col => <MenuItem key={col} value={col}>{col}</MenuItem>)}
                  </Select>
                </FormControl>
                {el.type === 'door' && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const newIsOpen = !el.isOpen;
                      const newRotation = newIsOpen ? [0, Math.PI / 2, 0] : [0, 0, 0];
                      updateElement(selectedElement, { isOpen: newIsOpen, rotation: newRotation });
                    }}
                  >
                    {el.isOpen ? 'Close Door' : 'Open Door'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : null;
      })()}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Container Material</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Material</InputLabel>
            <Select value={container.material} onChange={(e) => setContainerMaterial(e.target.value)}>
              {materials.map(mat => <MenuItem key={mat} value={mat}>{mat}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Color</InputLabel>
            <Select value={colors[0]}>
              {colors.map(col => <MenuItem key={col} value={col}>{col}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>

        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Save/Load Progress</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={saveProgress} fullWidth>Save Progress</Button>
            <Button variant="outlined" component="label" fullWidth>
              Load Progress
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    loadProgress(file);
                  }
                }}
              />
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Button variant="contained" startIcon={<GetApp />} onClick={handleExport} fullWidth>Export Design</Button>

      <Button variant="contained" startIcon={<GetApp />} onClick={() => window.takeScreenshot && window.takeScreenshot()} fullWidth>Take Screenshot</Button>
    </Box>
  );
}

export default ControlPanel;
