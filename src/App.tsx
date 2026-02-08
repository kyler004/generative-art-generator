import React, {useState, useRef, useEffect} from 'react'; 

// Type definitions

type PatternType = 'tree' | 'spirograph' | 'flow'; 

interface TreeParams {
  branchAngle: number; 
  depth: number; 
  branches: number; 
  lengthRatio: number; 
  thickness: number; 
}

interface SpirographParams {
  outerRadius: number; 
  innerRadius: number; 
  offset: number; 
  speed: number; 
  iterations: number; 
}

interface FlowParams {
  particles: number; 
  steps: number; 
  noiseScale: number; 
  flowStrength: number; 
  alpha: number; 
}

//Main Component

const App : React.FC = () => {

  //Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null); 

  //Animation frame Id - used to cancel anumations loops
  const animationRef = useRef<number | null>(null); 

  //Current pattern selection
  const [pattern, setPattern] = useState<PatternType>('tree'); 

  //Animation state
  const [isAnimating, setIsAnimating] = useState<boolean>(false); 
  const [animationProgress, setAnimationProgress] = useState<number>(0); 

  //Color controls
  const [useRainbow, setUseRainbow] = useState<boolean>(true); 
  const [baseHue, setBaseHue] = useState<number>(200); 

  // Tree parameters
  const [treeParams, setTreeParams] = useState<TreeParams>({
    branchAngle: 25, 
    depth: 9, 
    branches: 2, 
    lengthRatio: 0.67, 
    thickness: 10,
  }); 

  // Spirograph parameters
  const [spiroParams, setSpiroParams] = useState<SpirographParams>({
    outerRadius: 200, 
    innerRadius: 100, 
    offset: 50, 
    speed: 0.05, 
    iterations: 500, 
  })

  //Flow Field Parameters
  const [flowParams, setFlowPrams] = useState<FlowParams>({
    particles: 100, 
    steps: 100, 
    noiseScale: 0.01, 
    flowStrength: 2, 
    alpha: 0.3, 
  }); 

  // Noise utility

   const noise = (x: number, y: number): number => {
    // Use sine waves at different frequencies to create pseudo-random smooth values
    // The magic numbers create interesting variation
    return (
      Math.sin(x * 0.01) * Math.cos(y * 0.01) +
      Math.sin(x * 0.02 + 10) * Math.cos(y * 0.02 + 10) * 0.5 +
      Math.sin(x * 0.03 + 20) * Math.cos(y * 0.03 + 20) * 0.25
    );
  };

  // Drawing function 1: Recursive tree

  const drawTree = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    
    //Clear the canvas with a dark background
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, width, height); 

    // start position: bottom center of canvas
    const startX = width / 2; 
    const startY = height - 50; 

    // Initial trunk length: proportional to canvas height
    const initialLength = height / 4; 

    // Recursive function
    const drawBranch = (
      x: number, 
      y: number, 
      length: number, 
      angle: number, 
      depth: number, 
      thickness: number
    ) => {
      //Calculate endpoint using trigonometry
      const endX = x + length * Math.cos(angle); //Horizontal component
      const endY = y - length * Math.sin(angle); // Vertical component 

      // Calculating the color via hue
      if (useRainbow) {
        const hue = baseHue + (depth / treeParams.depth) * 120; 
        const lightness = 50 + depth * 2; //Get brighter toward tips
        ctx.strokeStyle = `hsl(${hue}, 70%, ${lightness}%)`; 
      } else {
        const lightness = 30 + (depth / treeParams.depth) * 50; 
        ctx.strokeStyle = `hsl(${baseHue}, 60%, ${lightness}%)`;
      }

      // Draw the branch
      ctx.lineWidth = thickness; 
      ctx.lineCap = 'round';  // rounded ends me natural
      ctx.beginPath(); 
      ctx.moveTo(x, y); 
      ctx.lineTo(endX, endY); 
      ctx.stroke(); 

      // Add a subtle glow effect for branches 
      if (depth > treeParams.depth - 3) {
        ctx.shadowBlur = 10; 
        ctx.shadowColor = ctx.strokeStyle; 
        ctx.stroke(); 
        ctx.shadowBlur = 0; // Reset shadow
      }

      // Base case 
      if (depth <= 0) return; 

      // Recursive case 
      const newLength = length * treeParams.lengthRatio; 
      const newThickness = thickness * 0.7; //Branches get thinner
      const angleStep = (treeParams.branchAngle * Math.PI) / 180; 

      //Calculates the angles for multiple branches 
      // If branches = 2: one left, one right
      // IF branches = 3: left, center, right; etc...

      for (let i = 0; i < treeParams.branches; i++){
        //spread branches evenly around the current angle
        const offset = angleStep * (i - (treeParams.branches - 1) / 2); 
        const newAngle = angle + offset; 

        // Here's the recursion 
        drawBranch(endX, endY, newLength, newAngle, depth - 1, newThickness); 
      }
    }; 

    //Recursion starts here 
    drawBranch(startX, startY, initialLength, Math.PI / 2, treeParams.depth, treeParams.thickness); 
  }; 

  // Drawing the spirograph

  const drawSpirograph = (ctx: CanvasRenderingContext2D, width: number, height: number) =>{
    ctx.fillStyle = "#0a0a15";
    ctx.fillRect(0, 0, width, height); 

    //Center of canvas 
    const centerX = width / 2; 
    const centerY = height / 2; 

    const { outerRadius, innerRadius, offset, iterations } = spiroParams; 

    //Here"'s where we continue
    ctx.beginPath(); 

    for (let i = 0; i <= iterations; i++) {
      const t = (i / iterations) * Math.PI * 20; 

      const x = centerX + (outerRadius - innerRadius) * Math.cos(t) + offset * Math.cos(((outerRadius - innerRadius) / innerRadius) * t); 
      const y = centerY + (outerRadius - innerRadius) * Math.sin(t) - offset * Math.sint(((outerRadius - innerRadius) / innerRadius) * t); 

      // color changes along the path
      if (useRainbow) {
        const hue = (baseHue + (i / iterations) * 360) % 360; 
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`; 
      } else {
        ctx.strokeStyle = `hsl(${baseHue}, 60%, 60%)`;
      }

      if (i === 0) {
        ctx.moveTo(x, y); 
      } else {
        ctx.lineTo(x, y); 
      }
    }

    ctx.lineWidth = 2; 
    ctx.lineCap = 'round'; 
    ctx.stroke(); 

    // Add glow effect
    ctx.shadowBlur = 15; 
    ctx.shadowColor = `hsl(${baseHue}, 70%, 60%)`; 
    ctx.stroke(); 
    ctx.shadowBlur = 0; 
  }; 

  // Drawing the flow field

  const draw

  return (
    <div>App</div>
  )
}

export default App