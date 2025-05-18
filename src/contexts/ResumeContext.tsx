import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileType: string;
  uploadDate: string;
}

interface ResumeContextType {
  resume: Resume | null;
  isUploading: boolean;
  uploadResume: (file: File, userId: string, isReplace?: boolean) => Promise<void>;
  deleteResume: (userId: string) => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserResume = async () => {
      if (!user?.id) {
        setResume(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('upload_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error

        setResume(data ? {
          id: data.id,
          userId: data.user_id,
          fileName: data.file_name,
          fileUrl: data.public_url,
          filePath: data.file_path,
          fileType: data.file_type,
          uploadDate: data.upload_date
        } : null);
      } catch (error) {
        console.error('Error fetching resume:', error);
        setResume(null);
      }
    };

    fetchUserResume();
  }, [user]);

  const uploadResume = async (file: File, userId: string, isReplace = false) => {
    setIsUploading(true);
    
    try {
      // Validate file
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['pdf', 'docx'].includes(fileExt)) {
        throw new Error('Only PDF and DOCX files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      const filePath = `users/${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // First upload to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Then update database
      let data, error;
      if (isReplace && resume) {
        // Delete old file from storage
        await supabase.storage
          .from('resumes')
          .remove([resume.filePath]);

        // Update existing record
        ({ data, error } = await supabase
          .from('resumes')
          .update({
            file_name: file.name,
            file_path: filePath,
            file_type: fileExt,
            file_size: file.size,
            public_url: publicUrl,
            processed: false,
            processing_result: null,
            upload_date: new Date().toISOString()
          })
          .eq('id', resume.id)
          .select('*')
          .single());
      } else {
        // Insert new record
        ({ data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: filePath,
            file_type: fileExt,
            file_size: file.size,
            public_url: publicUrl,
            processed: false,
            processing_result: null
          })
          .select('*')
          .single());
      }

      if (error) throw error;

      setResume({
        id: data.id,
        userId: data.user_id,
        fileName: data.file_name,
        fileUrl: data.public_url,
        filePath: data.file_path,
        fileType: data.file_type,
        uploadDate: data.upload_date
      });

    } catch (error) {
      console.error('Resume upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResume = async (userId: string) => {
    if (!resume || resume.userId !== userId) return;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id)
        .eq('user_id', userId);

      if (error) throw error;

      setResume(null);
    } catch (error) {
      console.error('Resume deletion failed:', error);
      throw error;
    }
  };

  return (
    <ResumeContext.Provider value={{ resume, isUploading, uploadResume, deleteResume }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};