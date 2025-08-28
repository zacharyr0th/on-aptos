import { motion } from "framer-motion";

export const EnhancedGlobe = () => {
  return (
    <div className="relative h-[36rem] flex items-center justify-center">
      <svg
        width="520"
        height="520"
        viewBox="0 0 520 520"
        className="relative z-10"
      >
        <defs>
          {/* Gradient definitions */}
          <radialGradient id="globeGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="70%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background sphere with gradient */}
        <circle
          cx="260"
          cy="260"
          r="180"
          fill="url(#globeGradient)"
          className="text-primary"
        />

        {/* Outer orbital ring */}
        <motion.circle
          cx="260"
          cy="260"
          r="200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2,4"
          opacity="0.15"
          className="text-primary"
          animate={{ rotate: 360 }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "260px 260px" }}
        />

        {/* Main globe outline with subtle glow */}
        <circle
          cx="260"
          cy="260"
          r="180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.25"
          className="text-foreground"
          filter="url(#glow)"
        />

        {/* Enhanced grid system */}
        {/* Latitude lines */}
        {[-90, -45, 0, 45, 90].map((lat, i) => {
          const ry =
            Math.abs(lat) === 90 ? 5 : 180 * Math.cos((lat * Math.PI) / 180);
          return (
            <ellipse
              key={`lat-${i}`}
              cx="260"
              cy="260"
              rx="180"
              ry={ry}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity={lat === 0 ? "0.25" : "0.12"}
              className="text-foreground"
            />
          );
        })}

        {/* Longitude lines */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = i * 22.5;
          return (
            <g key={`lon-${i}`}>
              <ellipse
                cx="260"
                cy="260"
                rx={180 * Math.abs(Math.cos((angle * Math.PI) / 180))}
                ry="180"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.12"
                className="text-foreground"
                transform={`rotate(${angle} 260 260)`}
              />
            </g>
          );
        })}

        {/* Data flow particles */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.circle
            key={`particle-${i}`}
            r="1.5"
            fill="currentColor"
            className="text-primary"
            opacity="0.6"
            animate={{
              x: [100 + i * 60, 400 + i * 60],
              y: [200 + Math.sin(i) * 100, 300 + Math.sin(i) * 100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Enhanced network nodes with varied sizes and types */}
        {[
          { x: 120, y: 160, size: 6, type: "major", delay: 0 },
          { x: 400, y: 180, size: 8, type: "hub", delay: 0.3 },
          { x: 180, y: 320, size: 5, type: "node", delay: 0.6 },
          { x: 340, y: 340, size: 7, type: "major", delay: 0.9 },
          { x: 260, y: 120, size: 6, type: "node", delay: 1.2 },
          { x: 90, y: 260, size: 5, type: "node", delay: 1.5 },
          { x: 430, y: 260, size: 6, type: "major", delay: 1.8 },
          { x: 200, y: 380, size: 4, type: "node", delay: 2.1 },
          { x: 320, y: 380, size: 5, type: "node", delay: 2.4 },
          { x: 160, y: 220, size: 4, type: "node", delay: 2.7 },
        ].map((node, i) => (
          <g key={`node-${i}`}>
            {/* Node glow */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size + 3}
              fill="currentColor"
              className="text-primary"
              opacity="0.1"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Main node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="url(#nodeGradient)"
              className="text-primary"
              stroke="currentColor"
              strokeWidth={node.type === "hub" ? "1.5" : "1"}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.4, 0.9, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 4,
                delay: node.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Hub indicator */}
            {node.type === "hub" && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary"
                opacity="0.2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 2,
                  delay: node.delay,
                  repeat: Infinity,
                }}
              />
            )}
          </g>
        ))}

        {/* Enhanced connection lines with animation */}
        {[
          { x1: 120, y1: 160, x2: 260, y2: 120, strength: "strong" },
          { x1: 260, y1: 120, x2: 400, y2: 180, strength: "strong" },
          { x1: 180, y1: 320, x2: 340, y2: 340, strength: "medium" },
          { x1: 90, y1: 260, x2: 160, y2: 220, strength: "weak" },
          { x1: 400, y1: 180, x2: 430, y2: 260, strength: "medium" },
          { x1: 200, y1: 380, x2: 320, y2: 380, strength: "weak" },
          { x1: 120, y1: 160, x2: 160, y2: 220, strength: "weak" },
        ].map((line, i) => (
          <g key={`connection-${i}`}>
            {/* Connection glow */}
            <motion.line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth={
                line.strength === "strong"
                  ? "2"
                  : line.strength === "medium"
                    ? "1.5"
                    : "1"
              }
              className="text-primary"
              opacity="0.1"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: 3,
                delay: i * 0.4,
                repeat: Infinity,
              }}
            />
            {/* Main connection */}
            <motion.line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 5,
                delay: i * 0.4,
                repeat: Infinity,
              }}
            />
          </g>
        ))}

        {/* Central hub with enhanced design */}
        <g>
          {/* Hub rings */}
          {[12, 18, 24].map((radius, i) => (
            <motion.circle
              key={`hub-ring-${i}`}
              cx="260"
              cy="260"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
              opacity="0.15"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 2 + i * 0.5,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          {/* Central core */}
          <motion.circle
            cx="260"
            cy="260"
            r="8"
            fill="currentColor"
            className="text-primary"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Core glow */}
          <motion.circle
            cx="260"
            cy="260"
            r="12"
            fill="currentColor"
            className="text-primary"
            opacity="0.2"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </g>
      </svg>

      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-primary/3 to-transparent rounded-full opacity-60" />
      <div
        className="absolute inset-0 bg-gradient-conic from-primary/5 via-transparent to-primary/5 rounded-full animate-spin"
        style={{ animationDuration: "120s" }}
      />
    </div>
  );
};
