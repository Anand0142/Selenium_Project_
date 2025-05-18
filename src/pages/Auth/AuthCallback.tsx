import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Show message that Google authentication is not yet available
      toast({
        title: "Feature not available",
        description: "Google authentication is not yet available. We will update this feature soon.",
        variant: "destructive",
      });
      
      // Navigate back to login page
      navigate('/login');
    };

    handleAuthCallback();
  }, [navigate, toast]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Processing authentication, please wait...</div>;
}