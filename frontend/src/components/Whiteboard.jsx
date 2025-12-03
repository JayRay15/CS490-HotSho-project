import { useRef, useState, useEffect } from 'react';
import { 
  PencilIcon, 
  Square3Stack3DIcon, 
  ArrowRightIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentArrowDownIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import Button from './Button';

/**
 * Whiteboard Component
 * 
 * A full-featured drawing canvas for system design diagrams with support for:
 * - Free-hand drawing with pen tool
 * - Rectangle shapes for components (databases, servers, caches, etc.)
 * - Arrow connections between components
 * - Text labels for naming components
 * - Undo/Redo functionality
 * - Color and line width customization
 * - Export as PNG image
 * - Save drawing to parent component
 * 
 * @param {Function} onSave - Callback function to save drawing (receives data URL)
 * @param {String} initialDrawing - Base64 data URL of existing drawing to load
 */
const Whiteboard = ({ onSave, initialDrawing = null }) => {
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, rectangle, arrow, text, move
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [textObjects, setTextObjects] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Create temporary canvas for shape preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvasRef.current = tempCanvas;

    // Set default styles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load initial drawing if provided
    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = initialDrawing;
    } else {
      saveToHistory();
    }
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    
    // Save snapshot to temp canvas
    if (tempCanvasRef.current) {
      const tempCtx = tempCanvasRef.current.getContext('2d');
      tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
      tempCtx.drawImage(canvas, 0, 0);
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setTextObjects([]); // Clear text objects when undoing
      setSelectedTextIndex(null);
      loadFromHistory(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setTextObjects([]); // Clear text objects when redoing
      setSelectedTextIndex(null);
      loadFromHistory(newStep);
    }
  };

  const loadFromHistory = (step) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Update temp canvas with the restored state
      if (tempCanvasRef.current) {
        const tempCtx = tempCanvasRef.current.getContext('2d');
        tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
        tempCtx.drawImage(img, 0, 0);
      }
    };
    img.src = history[step];
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear temp canvas
    if (tempCanvasRef.current) {
      const tempCtx = tempCanvasRef.current.getContext('2d');
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
    }
    
    // Clear text objects
    setTextObjects([]);
    setSelectedTextIndex(null);
    
    saveToHistory();
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findTextAtPosition = (pos) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    for (let i = textObjects.length - 1; i >= 0; i--) {
      const text = textObjects[i];
      ctx.font = `${text.size}px Arial`;
      const metrics = ctx.measureText(text.content);
      const textWidth = metrics.width;
      const textHeight = text.size;
      
      if (pos.x >= text.x && pos.x <= text.x + textWidth &&
          pos.y >= text.y - textHeight && pos.y <= text.y) {
        return i;
      }
    }
    return -1;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Draw from temp canvas
    if (tempCanvasRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvasRef.current, 0, 0);
    }
    
    // Only redraw text objects if they exist
    if (textObjects.length > 0) {
      textObjects.forEach((text, index) => {
        ctx.fillStyle = text.color;
        ctx.font = `${text.size}px Arial`;
        ctx.fillText(text.content, text.x, text.y);
        
        // Highlight selected text
        if (index === selectedTextIndex) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          const metrics = ctx.measureText(text.content);
          ctx.strokeRect(text.x - 2, text.y - text.size - 2, metrics.width + 4, text.size + 4);
        }
      });
    }
  };

  const startDrawing = (e) => {
    const pos = getMousePos(e);
    
    // Check if clicking on text in move mode
    if (tool === 'move') {
      const textIndex = findTextAtPosition(pos);
      if (textIndex !== -1) {
        setSelectedTextIndex(textIndex);
        setIsDraggingText(true);
        setStartPos(pos);
        return;
      } else {
        setSelectedTextIndex(null);
        redrawCanvas();
      }
    }
    
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'text') {
      setTextPosition(pos);
    }
  };

  const draw = (e) => {
    if (tool === 'text') return;
    
    const pos = getMousePos(e);
    
    // Handle text dragging
    if (isDraggingText && selectedTextIndex !== null) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      
      const newTextObjects = [...textObjects];
      newTextObjects[selectedTextIndex] = {
        ...newTextObjects[selectedTextIndex],
        x: newTextObjects[selectedTextIndex].x + dx,
        y: newTextObjects[selectedTextIndex].y + dy
      };
      setTextObjects(newTextObjects);
      setStartPos(pos);
      redrawCanvas();
      return;
    }
    
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'rectangle' || tool === 'arrow') {
      // Restore from temp canvas instead of history
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (tempCanvasRef.current) {
        ctx.drawImage(tempCanvasRef.current, 0, 0);
      }
      
      // Only redraw text objects that are currently active
      if (textObjects.length > 0) {
        textObjects.forEach((text) => {
          ctx.fillStyle = text.color;
          ctx.font = `${text.size}px Arial`;
          ctx.fillText(text.content, text.x, text.y);
        });
      }
      
      // Draw preview shape
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      if (tool === 'rectangle') {
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
      }
    }
  };

  const stopDrawing = () => {
    if (isDraggingText) {
      setIsDraggingText(false);
      // Commit text objects to canvas permanently
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw from temp canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (tempCanvasRef.current) {
        ctx.drawImage(tempCanvasRef.current, 0, 0);
      }
      
      // Draw all text objects permanently
      textObjects.forEach((text) => {
        ctx.fillStyle = text.color;
        ctx.font = `${text.size}px Arial`;
        ctx.fillText(text.content, text.x, text.y);
      });
      
      // Clear text objects array since they're now on canvas
      setTextObjects([]);
      setSelectedTextIndex(null);
      saveToHistory();
      return;
    }
    
    if (isDrawing && tool !== 'text') {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const addText = () => {
    if (!textInput || !textPosition) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = lineWidth * 8;

    // Add to text objects array for repositioning
    const newTextObject = {
      content: textInput,
      x: textPosition.x,
      y: textPosition.y,
      color: color,
      size: fontSize
    };
    
    setTextObjects([...textObjects, newTextObject]);

    // Draw the text directly on canvas (not from redraw)
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    setTextInput('');
    setTextPosition(null);
    setIsDrawing(false);
    
    // Don't save to history yet - wait until user switches tools or finishes editing
  };

  const exportAsImage = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'system-design-whiteboard.png';
    link.href = dataUrl;
    link.click();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave?.(dataUrl);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Drawing Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'pen' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Pen Tool"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'rectangle' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Rectangle Tool"
            >
              <Square3Stack3DIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'arrow' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Arrow Tool"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'text' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Text Tool"
            >
              <span className="text-sm font-bold">T</span>
            </button>
            <button
              onClick={() => {
                setTool('move');
                setSelectedTextIndex(null);
                // Commit any uncommitted text to canvas before switching to move mode
                if (textObjects.length > 0) {
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext('2d');
                  saveToHistory(); // Save current state with text objects visible
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'move' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Move Text Tool"
            >
              <span className="text-sm font-bold">↔</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-12 rounded cursor-pointer"
            />
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Width:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{lineWidth}px</span>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* History Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <ArrowUturnRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Clear Canvas"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Export/Save */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportAsImage}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Export as Image"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>
            {onSave && (
              <Button onClick={handleSave} size="sm">
                Save Design
              </Button>
            )}
          </div>
        </div>

        {/* Text Input */}
        {textPosition && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addText()}
              placeholder="Enter text..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <Button onClick={addText} size="sm">Add Text</Button>
            <button
              onClick={() => {
                setTextPosition(null);
                setTextInput('');
                setIsDrawing(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
          style={{ height: '600px' }}
        />
      </div>

      {/* Tips */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Tips:</span> Use rectangles for components, arrows for connections, 
          and text to label your architecture. Use the Move tool (↔) to reposition text after placing it. 
          Draw load balancers, databases, caches, and other system components to illustrate your design thinking.
        </p>
      </div>
    </div>
  );
};

export default Whiteboard;
