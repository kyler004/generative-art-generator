import React, { useState, useRef, useEffect } from "react";

// Type definitions

type PatternType = "tree" | "spirograph" | "flow";

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

const App: React.FC = () => {
  //Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //Animation frame Id - used to cancel anumations loops
  const animationRef = useRef<number | null>(null);

  //Current pattern selection
  const [pattern, setPattern] = useState<PatternType>("tree");

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
  });

  //Flow Field Parameters
  const [flowParams, setFlowParams] = useState<FlowParams>({
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

  const drawTree = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    //Clear the canvas with a dark background
    ctx.fillStyle = "#0a0a15";
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
      thickness: number,
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
      ctx.lineCap = "round"; // rounded ends me natural
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

      for (let i = 0; i < treeParams.branches; i++) {
        //spread branches evenly around the current angle
        const offset = angleStep * (i - (treeParams.branches - 1) / 2);
        const newAngle = angle + offset;

        // Here's the recursion
        drawBranch(endX, endY, newLength, newAngle, depth - 1, newThickness);
      }
    };

    //Recursion starts here
    drawBranch(
      startX,
      startY,
      initialLength,
      Math.PI / 2,
      treeParams.depth,
      treeParams.thickness,
    );
  };

  // Drawing the spirograph

  const drawSpirograph = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    ctx.fillStyle = "#0a0a15";
    ctx.fillRect(0, 0, width, height);

    // Center of canvas
    const centerX = width / 2;
    const centerY = height / 2;

    const { outerRadius, innerRadius, offset, iterations } = spiroParams;

    ctx.save(); // Save canvas state for alpha blending
    ctx.globalAlpha = 0.7; // Add alpha blending for softer look

    ctx.beginPath();

    // Smooth color transitions: interpolate hue from baseHue to baseHue+360
    for (let i = 0; i <= iterations; i++) {
      const t = (i / iterations) * Math.PI * 20;

      const x =
        centerX +
        (outerRadius - innerRadius) * Math.cos(t) +
        offset * Math.cos(((outerRadius - innerRadius) / innerRadius) * t);
      const y =
        centerY +
        (outerRadius - innerRadius) * Math.sin(t) -
        offset * Math.sin(((outerRadius - innerRadius) / innerRadius) * t);

      // Smooth color transitions using HSL and alpha blending
      let hue;
      if (useRainbow) {
        // Interpolate hue smoothly
        hue = baseHue + (i / iterations) * 360;
      } else {
        hue = baseHue;
      }
      ctx.strokeStyle = `hsla(${hue % 360}, 70%, 60%, 0.8)`; // Use alpha in color

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.restore(); // Restore canvas state

    // Add glow effect (optional, can be further styled)
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsl(${baseHue}, 70%, 60%)`;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= iterations; i++) {
      const t = (i / iterations) * Math.PI * 20;
      const x =
        centerX +
        (outerRadius - innerRadius) * Math.cos(t) +
        offset * Math.cos(((outerRadius - innerRadius) / innerRadius) * t);
      const y =
        centerY +
        (outerRadius - innerRadius) * Math.sin(t) -
        offset * Math.sin(((outerRadius - innerRadius) / innerRadius) * t);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  // Drawing the flow field

  const drawFlowField = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Fade overlay for trail effect
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#0a0a15";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const { particles, steps, noiseScale, flowStrength, alpha } = flowParams;

    for (let p = 0; p < particles; p++) {
      let x = Math.random() * width;
      let y = Math.random() * height;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let i = 0; i < steps; i++) {
        const noiseValue = noise(x * noiseScale, y * noiseScale);
        const angle = noiseValue * Math.PI * 4;

        // Add random jitter for organic motion
        const jitter = (Math.random() - 0.5) * 0.5;
        x += Math.cos(angle + jitter) * flowStrength;
        y += Math.sin(angle + jitter) * flowStrength;

        // Wrap around edges
        if (x < 0) x = width;
        if (x > width) x = 0;
        if (y < 0) y = height;
        if (y > height) y = 0;

        ctx.lineTo(x, y);

        // Dynamic color transitions: interpolate hue along the path
        let hue;
        if (useRainbow) {
          hue = (baseHue + (i / steps) * 360) % 360;
        } else {
          hue = baseHue;
        }
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
      ctx.restore();
    }
  };

  // Animation Loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update animation progress
    setAnimationProgress((prev) => (prev + 0.01) % 1);

    // Modify parameters based on animation progress
    if (pattern === "tree") {
      // Animate branch angle - creates breathing effect
      const animatedAngle = 25 + Math.sin(animationProgress * Math.PI * 2) * 10;
      setTreeParams((prev) => ({ ...prev, branchAngle: animatedAngle }));
    } else if (pattern === "spirograph") {
      // Rotate through different ratios
      const animatedInner =
        100 + Math.sin(animationProgress * Math.PI * 2) * 30;
      setSpiroParams((prev) => ({ ...prev, innerRadius: animatedInner }));
    } else if (pattern === "flow") {
      // Shift the noise field over time
      const animatedScale =
        0.01 + Math.sin(animationProgress * Math.PI * 2) * 0.005;
      setFlowParams((prev) => ({ ...prev, noiseScale: animatedScale }));
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(animate);
  };

  // Draw when parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to display size (for crisp rendering)
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw the selected pattern
    if (pattern === "tree") {
      drawTree(ctx, canvas.width, canvas.height);
    } else if (pattern === "spirograph") {
      drawSpirograph(ctx, canvas.width, canvas.height);
    } else if (pattern === "flow") {
      drawFlowField(ctx, canvas.width, canvas.height);
    }
  }, [pattern, treeParams, spiroParams, flowParams, useRainbow, baseHue]);

  // Handle animation start/stop
  useEffect(() => {
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-900 via-slate-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2">
            Generative Art Studio
          </h1>
          <p className="text-cyan-300 text-lg">
            Create infinite unique patterns through algorithms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur rounded-xl p-4 shadow-2xl">
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg"
                style={{ height: "600px" }}
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Pattern Selection */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">
                Pattern Type
              </h3>
              <div className="space-y-2">
                {(["tree", "spirograph", "flow"] as PatternType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPattern(p)}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                      pattern === p
                        ? "bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg scale-105"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {p === "tree" && "🌳 Recursive Tree"}
                    {p === "spirograph" && "⭕ Spirograph"}
                    {p === "flow" && "🌊 Flow Field"}
                  </button>
                ))}
              </div>
            </div>

            {/* Global Controls */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">Global</h3>

              <div className="space-y-4">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                    isAnimating
                      ? "bg-linear-to-r from-red-500 to-orange-500"
                      : "bg-linear-to-r from-green-500 to-emerald-500"
                  } text-white shadow-lg`}
                >
                  {isAnimating ? "⏸️ Stop Animation" : "▶️ Animate"}
                </button>

                <button
                  onClick={() => setUseRainbow(!useRainbow)}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                    useRainbow
                      ? "bg-linear-to-r from-pink-500 via-purple-500 to-cyan-500"
                      : "bg-gray-700"
                  } text-white shadow-lg`}
                >
                  {useRainbow ? "🌈 Rainbow" : "🎨 Monochrome"}
                </button>

                <div>
                  <label className="text-cyan-300 text-sm font-semibold block mb-2">
                    Base Hue: {baseHue}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={baseHue}
                    onChange={(e) => setBaseHue(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Pattern-Specific Controls */}
            {pattern === "tree" && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">
                  Tree Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Branch Angle: {treeParams.branchAngle}°
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={treeParams.branchAngle}
                      onChange={(e) =>
                        setTreeParams({
                          ...treeParams,
                          branchAngle: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Depth: {treeParams.depth}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      value={treeParams.depth}
                      onChange={(e) =>
                        setTreeParams({
                          ...treeParams,
                          depth: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Branches: {treeParams.branches}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="5"
                      value={treeParams.branches}
                      onChange={(e) =>
                        setTreeParams({
                          ...treeParams,
                          branches: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Length Ratio: {treeParams.lengthRatio.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={treeParams.lengthRatio * 100}
                      onChange={(e) =>
                        setTreeParams({
                          ...treeParams,
                          lengthRatio: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Thickness: {treeParams.thickness}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={treeParams.thickness}
                      onChange={(e) =>
                        setTreeParams({
                          ...treeParams,
                          thickness: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {pattern === "spirograph" && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">
                  Spirograph Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Outer Radius: {spiroParams.outerRadius}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="300"
                      value={spiroParams.outerRadius}
                      onChange={(e) =>
                        setSpiroParams({
                          ...spiroParams,
                          outerRadius: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Inner Radius: {spiroParams.innerRadius}
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      value={spiroParams.innerRadius}
                      onChange={(e) =>
                        setSpiroParams({
                          ...spiroParams,
                          innerRadius: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Offset: {spiroParams.offset}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      value={spiroParams.offset}
                      onChange={(e) =>
                        setSpiroParams({
                          ...spiroParams,
                          offset: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Iterations: {spiroParams.iterations}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      value={spiroParams.iterations}
                      onChange={(e) =>
                        setSpiroParams({
                          ...spiroParams,
                          iterations: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {pattern === "flow" && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">
                  Flow Field Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Particles: {flowParams.particles}
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={flowParams.particles}
                      onChange={(e) =>
                        setFlowParams({
                          ...flowParams,
                          particles: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Steps: {flowParams.steps}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={flowParams.steps}
                      onChange={(e) =>
                        setFlowParams({
                          ...flowParams,
                          steps: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Noise Scale: {flowParams.noiseScale.toFixed(3)}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={flowParams.noiseScale * 1000}
                      onChange={(e) =>
                        setFlowParams({
                          ...flowParams,
                          noiseScale: Number(e.target.value) / 1000,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Flow Strength: {flowParams.flowStrength}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={flowParams.flowStrength}
                      onChange={(e) =>
                        setFlowParams({
                          ...flowParams,
                          flowStrength: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 text-sm font-semibold block mb-2">
                      Opacity: {flowParams.alpha.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={flowParams.alpha * 100}
                      onChange={(e) =>
                        setFlowParams({
                          ...flowParams,
                          alpha: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Info Panel */}
            <div className="bg-linear-to-br from-cyan-900/30 to-purple-900/30 backdrop-blur rounded-xl p-6 shadow-xl border border-cyan-500/20">
              <h3 className="text-lg font-bold text-cyan-300 mb-2">💡 Tips</h3>
              <ul className="text-cyan-200/80 text-sm space-y-1">
                {pattern === "tree" && (
                  <>
                    <li>• Higher depth = more detail (but slower)</li>
                    <li>• Try 3+ branches for bushy trees</li>
                    <li>• Low length ratio = stubby branches</li>
                  </>
                )}
                {pattern === "spirograph" && (
                  <>
                    <li>• Try ratios like 2:1 or 3:2</li>
                    <li>• Different radii create different patterns</li>
                    <li>• More iterations = complete designs</li>
                  </>
                )}
                {pattern === "flow" && (
                  <>
                    <li>• Lower noise scale = smoother flow</li>
                    <li>• More particles = denser artwork</li>
                    <li>• Low opacity creates layered effects</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
