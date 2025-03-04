import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js'

// Use environment variables if available, otherwise fall back to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jaihtntzjyospdjjqris.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWh0bnR6anlvc3BkampxcmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MTg2NDksImV4cCI6MjA1NjE5NDY0OX0.HGAcuxvbwxc3fBcfvX7DD_if88JOxuWqxn3d_nBQNFM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UploadedModel {
  id: number;
  name: string;
  title: string;
  description: string;
  file_path: string;
  file_name: string;
  material?: string;
  type?: string;
  created_at: string;
  geometry?: THREE.BufferGeometry;
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

// Add this function to test Supabase connection and bucket access
export async function testSupabaseConnection() {
  try {
    // Test database connection with correct syntax
    const { data: dbTest, error: dbError } = await supabase
      .from('assets')
      .select('*', { count: 'exact' });

    if (dbError) {
      console.error('Database connection error:', dbError);
      throw dbError;
    }
    console.log('Database connection successful. Row count:', dbTest.length);

    // Test storage connection and list buckets
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.error('Storage connection error:', bucketError);
      throw bucketError;
    }
    console.log('Available buckets:', buckets);

    // If stls bucket exists, list its contents
    const stlsBucket = buckets.find(b => b.name === 'stls');
    let storageFiles: StorageFile[] = [];
    
    if (stlsBucket) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from('stls')
        .list();

      if (filesError) {
        console.error('Error listing files:', filesError);
        throw filesError;
      }
      console.log('Files in stls bucket:', files);
      storageFiles = files || [];
    } else {
      console.log('STLS bucket does not exist');
    }

    return { buckets, files: storageFiles };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    throw error;
  }
}

export async function uploadSTLFile(file: File, title: string, description: string): Promise<UploadedModel> {
  const fileName = `${Date.now()}_${file.name}`
  const filePath = fileName

  try {
    console.log('Attempting to upload file...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stls')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }
    console.log('File uploaded successfully:', uploadData);

    // Get the correct public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('stls')
      .getPublicUrl(filePath);

    console.log('Creating database entry...');
    const { data: modelData, error: dbError } = await supabase
      .from('assets')
      .insert([
        {
          name: title || file.name,
          description: description,
          file_path: filePath,
          type: 'ready-made',
          material: 'matte',
          customizable: false,
          approved: true,
          submitted_by: 'user',
          uploaded_at: new Date().toISOString(),
          url: publicUrl,
          tags: ['ready-made'],
          price: 0, // Can be updated later
          dimensions: {
            width: 0,
            height: 0,
            depth: 0
          }
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error creating database entry:', dbError);
      throw new Error(`Error creating database entry: ${dbError.message}`);
    }
    console.log('Database entry created successfully:', modelData);

    // Return the model data with the public URL
    return {
      ...modelData,
      publicUrl
    };
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    throw error;
  }
} 