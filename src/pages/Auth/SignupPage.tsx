import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signupWithEmail, signupWithGoogle } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, use Supabase auth to send verification email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      
      if (error) throw error;
      
      // After successful signup with Supabase Auth, store data in Signup table
      const { error: signupError } = await supabase
        .from('signup')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password, // Note: In production, you should never store plain passwords
            auth_id: data.user?.id, // Link to Supabase Auth user
            auth_provider: 'email',
          }
        ]);
      
      if (signupError) {
        console.error("Error storing in Signup table:", signupError);
        // Continue anyway since the auth verification email was sent
      }
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account, then log in.",
      });

      navigate('/login');
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    toast({
      title: "Feature not available",
      description: "Google authentication is not yet available. We will update this feature soon.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Panel */}
      <motion.div 
        className="hidden md:flex md:w-1/2 bg-appPurple items-center justify-center relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
            <Stars radius={80} depth={50} count={5000} factor={4} fade />
          </Canvas>
        </div>

        <motion.div className="max-w-md p-8 z-10 text-white" whileHover={{ scale: 1.02 }}>
          <motion.div className="flex items-center gap-2 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <motion.div whileHover={{ rotateY: 180, scale: 1.1 }} transition={{ duration: 0.6 }}>
              <Briefcase className="h-8 w-8" />
            </motion.div>
            <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              JobFinder
            </motion.h1>
          </motion.div>
          <motion.h2 className="text-3xl font-bold mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            Welcome to Job Finder
          </motion.h2>
          <motion.p className="text-lg text-purple-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Find your dream job with personalized recommendations
          </motion.p>
        </motion.div>

        {/* Floating circles */}
        <motion.div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-white opacity-10"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-white opacity-10"
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </motion.div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col p-8">
        <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-12 self-start">
          <ArrowLeft className="h-6 w-6" />
          Back to home
        </Link>
        
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-appPurple" />
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Input name="firstName" type="text" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
              <Input name="lastName" type="text" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Input name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleChange} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Button
                type="submit"
                className="w-full bg-appPurple hover:bg-appSecondary"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </motion.div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignup}
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

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-appPurple hover:text-appSecondary">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
