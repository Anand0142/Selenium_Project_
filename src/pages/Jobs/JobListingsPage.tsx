import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  job_link: string;
  description: string;
  created_at: string;
  user_id: string;
  resume_id: string;
}

export default function JobListingsPage() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  const [applyingStates, setApplyingStates] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useAuth();

  // Fetch jobs with resume data
  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        setError(null);
        if (!user?.id) return;

        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;
        setJobs(jobsData || []);
      } catch (err) {
        setError(err.message || 'Failed to load jobs');
      }
    };

    fetchJobs();
  }, [user]);

  const handleDownloadResume = async (job: Job) => {
    try {
      setLoadingStates(prev => ({ ...prev, [job.id]: true }));
      setError(null);
      
      const filePath = `enhanced_${job.resume_id}_${job.id}.docx`;

      const { data: signedUrl, error: urlError } = await supabase
        .storage
        .from('customizedresumes')
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrl) {
        throw new Error(urlError?.message || 'Failed to generate download link');
      }

      const link = document.createElement('a');
      link.href = signedUrl.signedUrl;
      link.download = `Resume_${job.company}_${job.title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);

    } catch (err) {
      setError(err.message || 'Failed to download resume');
    } finally {
      setLoadingStates(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const handleApplyToJob = async (job: Job) => {
    try {
      setApplyingStates(prev => ({ ...prev, [job.id]: true }));
      setError(null);
      
      // Get signed URL for the customized resume
      const resumePath = `enhanced_${job.resume_id}_${job.id}.docx`;
      const { data: signedUrl } = await supabase
        .storage
        .from('customizedresumes')
        .createSignedUrl(resumePath, 3600);

      if (!signedUrl) {
        throw new Error('Could not get resume URL');
      }

      // Prepare data for Python script
      const jobData = {
        job_link: job.job_link,
        job_id: job.id,
        user_id: user?.id,
        resume_url: signedUrl.signedUrl,
        company: job.company,
        position: job.title
      };

      // In a production Electron app, you would call the Python script here
      console.log('Python script would be called with:', jobData);
      
      // For demo purposes, we'll just open the job link
      window.open(job.job_link, '_blank');

    } catch (err) {
      setError(err.message || 'Failed to apply to job');
    } finally {
      setApplyingStates(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Please sign in to view job listings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Your Job Applications</h1>
        <p className="text-gray-500">
          {jobs.length > 0 
            ? "Download customized resumes for each application"
            : "No job applications found"}
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-2">
            {error.includes('not found') ? (
              <>
                Resume file missing. Please contact support.
                <br />
                <span className="text-xs opacity-75">Technical details: {error}</span>
              </>
            ) : (
              error
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full flex flex-col border border-gray-200 hover:border-blue-200 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <CardDescription className="font-medium">{job.company}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Applied: {formatDate(job.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.description || "No description available"}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a 
                    href={job.job_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-appPurple hover:bg-appSecondary">
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Job
                    </Button>
                  </a>
                  <Button
                    onClick={() => handleDownloadResume(job)}
                    disabled={loadingStates[job.id]}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loadingStates[job.id] ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Preparing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Download className="mr-2 h-4 w-4" />
                        Download Resume
                      </span>
                    )}
                  </Button>
                </div>
                <div className="mt-3">
                  <Button
                    onClick={() => handleApplyToJob(job)}
                    disabled={applyingStates[job.id]}
                    className="w-full bg-[#329DF0] hover:bg-[#2180d0]"
                  >
                    {applyingStates[job.id] ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Applying...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Apply Now
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}