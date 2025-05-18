import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResume } from '@/contexts/ResumeContext';
import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { supabase } from '../../lib/supabaseClient'; // Ensure supabase is imported

export default function DashboardPage() {
  const { user } = useAuth();
  const { resume, applications = [] } = useResume();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirstName = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('signup')
          .select('first_name')
          .eq('auth_id', user.id) // Use auth_id to fetch first_name
          .single();

        if (error) {
          console.error('Error fetching first name:', error);
          return;
        }

        if (data) {
          setFirstName(data.first_name);
        }
      } catch (err) {
        console.error('Error fetching first name:', err);
      }
    };

    fetchFirstName();
  }, [user]);

  // Stats
  const totalApplications = applications.length;
  const successfulApplications = applications.filter(app => app.status === 'Submitted Successfully').length;
  const failedApplications = applications.filter(app => app.status === 'Submission Failed').length;
  const processingApplications = applications.filter(app => app.status === 'Processing').length;

  const chartData = [
    { name: 'Success', value: successfulApplications, fill: '#10B981' },
    { name: 'Processing', value: processingApplications, fill: '#3B82F6' },
    { name: 'Failed', value: failedApplications, fill: '#EF4444' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <h2 className="text-xl text-gray-600 mb-6">
          Welcome back, {firstName || user?.email?.split('@')[0] || 'User'}! 👋
        </h2>
        {!resume ? (
          <Link to="/upload-resume">
            <Button className="bg-appPurple hover:bg-appSecondary">
              <FileUp className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-3xl">{totalApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">All time applications</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Successfully Submitted</CardDescription>
              <CardTitle className="text-3xl text-green-500">{successfulApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                <CheckCircle className="inline-block h-4 w-4 mr-1" />
                Successful applications
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
              <CardTitle className="text-3xl text-blue-500">{processingApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                <Clock className="inline-block h-4 w-4 mr-1" />
                In progress
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed Submissions</CardDescription>
              <CardTitle className="text-3xl text-red-500">{failedApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                <XCircle className="inline-block h-4 w-4 mr-1" />
                Failed attempts
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Application Statistics</CardTitle>
            <CardDescription>Overview of your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}