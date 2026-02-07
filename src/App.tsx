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


  return (
    <div>App</div>
  )
}

export default App