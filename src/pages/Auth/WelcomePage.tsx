import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Animated Background Bubbles
const Bubble = ({ position, scale, speed = 0.5, opacity = 0.6 }: {
  position: [number, number, number];
  scale: number | [number, number, number];
  speed?: number;
  opacity?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y += Math.sin(clock.getElapsedTime() * speed) * 0.002;
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.z += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={new THREE.Color('#a566ff')}
        transparent={true}
        opacity={opacity}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
};

const BubbleField = () => {
  const bubbles = [];
  const count = 20;

  for (let i = 0; i < count; i++) {
    const scale = Math.random() * 1.5 + 0.5;
    const position: [number, number, number] = [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10
    ];
    const speed = Math.random() * 0.8 + 0.2;
    const opacity = Math.random() * 0.3 + 0.1;

    bubbles.push(
      <Bubble
        key={i}
        position={position}
        scale={scale}
        speed={speed}
        opacity={opacity}
      />
    );
  }

  return <>{bubbles}</>;
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-appPurple-dark overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <BubbleField />
        </Canvas>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-appPurple-light opacity-10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              transition: {
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              },
            }}
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <header className="flex justify-between items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <h1 className="text-2xl font-bold text-white">JobFinder</h1>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-4"
          >
            <Link to="/login">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
                  Sign up
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </header>

        <main className="mt-20">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl font-bold text-white mb-6 leading-tight"
              >
                <motion.span className="inline-block" whileHover={{ scale: 1.05 }}>
                  Streamline
                </motion.span>{' '}
                Your{' '}
                <motion.span
                  className="text-appPurple-light inline-block"
                  animate={{
                    color: ['#8b5cf6', '#a78bfa', '#8b5cf6'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  Job Search
                </motion.span>{' '}
                Journey
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-gray-300 mb-8"
              >
                Upload once, apply everywhere. Start your career journey today with our AI-powered platform.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex gap-4 justify-center lg:justify-start"
              >
                <Link to="/signup">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>

            {/* Placeholder Canvas (empty to maintain layout) */}
            <div className="lg:w-1/2 h-96 lg:h-auto">
              <Canvas>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
              </Canvas>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
