import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if the email exists in the Signup table
      const { data: userData, error: userError } = await supabase
        .from('signup')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError) {
        if (userError.code === 'PGRST116') {
          // No matching record found
          toast({
            title: "Account not found",
            description: "Please sign up first before attempting to log in.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw userError;
      }
      
      // Check if password matches
      if (userData.password !== password) {
        toast({
          title: "Invalid credentials",
          description: "The email or password you entered is incorrect.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If we get here, credentials are valid
      // Now use Supabase Auth to create a session
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Explicitly navigate to dashboard after successful login
      // This ensures the user goes to the dashboard regardless of 
      // any other navigation logic in the app
      setTimeout(() => {
        navigate('/dashboard');
      }, 300); // Short delay to ensure toast is visible
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    toast({
      title: "Feature not available",
      description: "Google authentication is not yet available. We will update this feature soon.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Panel with updated bg-appPurple and preserved 3D effects */}
      <motion.div 
        className="hidden md:flex md:w-1/2 bg-appPurple items-center justify-center relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* 3D Stars Background - Preserved exactly */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
            <Stars radius={80} depth={50} count={5000} factor={4} fade />
          </Canvas>
        </div>

        <motion.div 
          className="max-w-md p-8 z-10 text-white"
          whileHover={{ scale: 1.02 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              whileHover={{ rotateY: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Briefcase className="h-8 w-8" />
            </motion.div>
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              JobFinder
            </motion.h1>
          </motion.div>
          <motion.h2 
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome back to your job search assistant
          </motion.h2>
          <motion.p 
            className="text-lg text-purple-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Log in to continue your job search journey, track your applications, and discover new opportunities.
          </motion.p>
        </motion.div>
        
        {/* Floating animated circles - Preserved exactly */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-white opacity-10"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-white opacity-10"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </motion.div>
      
      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col p-8">
        <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-12 self-start">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <Briefcase className="h-8 w-8 text-appPurple" />
            <h1 className="text-2xl font-bold text-gray-800">JobFinder</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-8">Log in to your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.01 }}
            >
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <motion.div
                whileFocus={{ 
                  scale: 1.02,
                  boxShadow: "0 0 0 2px rgba(126, 34, 206, 0.5)"
                }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
            >
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <motion.div
                whileFocus={{ 
                  scale: 1.02,
                  boxShadow: "0 0 0 2px rgba(126, 34, 206, 0.5)"
                }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-appPurple hover:bg-appSecondary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.span
                    animate={{ 
                      opacity: [0.6, 1, 0.6],
                      scale: [0.98, 1, 0.98]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity 
                    }}
                  >
                    Logging in...
                  </motion.span>
                ) : "Log in"}
              </Button>
            </motion.div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
              disabled={isLoading}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </motion.button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-appPurple hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}