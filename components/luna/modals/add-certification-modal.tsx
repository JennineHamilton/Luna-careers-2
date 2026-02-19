/**
 * Add/Edit Certification Modal
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaInput,
  LunaCheckbox,
  LunaFileUpload,
} from '@/components/luna';
import { Loader2, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Certification = Database['public']['Tables']['certifications']['Row'];

interface AddCertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  certification?: Certification | null;
}

export function AddCertificationModal({
  open,
  onOpenChange,
  onSuccess,
  certification,
}: AddCertificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [formData, setFormData] = useState({
    certification_title: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    does_not_expire: false,
    certificate_id: '',
    certificate_url_external: '',
  });

  useEffect(() => {
    if (certification) {
      setFormData({
        certification_title: certification.certification_title,
        issuing_organization: certification.issuing_organization,
        issue_date: certification.issue_date ? certification.issue_date.split('T')[0] : '',
        expiry_date: certification.expiry_date ? certification.expiry_date.split('T')[0] : '',
        does_not_expire: certification.does_not_expire || false,
        certificate_id: certification.certificate_id || '',
        certificate_url_external: certification.certificate_url_external || '',
      });
    } else {
      setFormData({
        certification_title: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        does_not_expire: false,
        certificate_id: '',
        certificate_url_external: '',
      });
    }
    // Reset file when modal opens/closes
    setCertificateFile(null);
    setError('');
  }, [certification, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let certificate_file_url = certification?.certificate_file_url || null;

      // Upload certificate file if a new one is selected
      if (certificateFile) {
        setUploadProgress(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('You must be logged in to upload files');
          setLoading(false);
          setUploadProgress(false);
          return;
        }

        // Upload to user-credentials bucket
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${user.id}/certificates/${Date.now()}_${certificateFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from('user-credentials')
          .upload(fileName, certificateFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload certificate file');
          setLoading(false);
          setUploadProgress(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-credentials')
          .getPublicUrl(fileName);

        certificate_file_url = publicUrl;
        setUploadProgress(false);
      }

      // Convert date strings to ISO datetime format (required by API validation)
      const issueDateTime = formData.issue_date ? new Date(formData.issue_date).toISOString() : '';
      const expiryDateTime = formData.expiry_date && !formData.does_not_expire
        ? new Date(formData.expiry_date).toISOString()
        : null;

      // Prepare data for API
      const submitData = {
        certification_title: formData.certification_title,
        issuing_organization: formData.issuing_organization,
        issue_date: issueDateTime,
        expiry_date: expiryDateTime,
        does_not_expire: formData.does_not_expire,
        certificate_id: formData.certificate_id || null,
        certificate_url_external: formData.certificate_url_external || null,
        certificate_file_url,
      };

      const url = certification
        ? `/api/user/certifications/${certification.id}`
        : '/api/user/certifications';
      const method = certification ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save certification');
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving certification:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
      setUploadProgress(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent>
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              {certification ? 'Edit Certification' : 'Add Certification'}
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            {certification ? 'Update your certification details' : 'Add a professional certification'}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-luna-red-50 border border-luna-red-200 rounded-lg text-sm text-luna-red-700">
                  {error}
                </div>
              )}

              <LunaInput
                label="Certification Title"
                required
                value={formData.certification_title}
                onChange={(e) => setFormData({ ...formData, certification_title: e.target.value })}
                placeholder="e.g. AWS Certified Solutions Architect"
              />

              <LunaInput
                label="Issuing Organization"
                required
                value={formData.issuing_organization}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                placeholder="e.g. Amazon Web Services"
              />

              <LunaInput
                label="Certificate ID"
                value={formData.certificate_id}
                onChange={(e) => setFormData({ ...formData, certificate_id: e.target.value })}
                placeholder="e.g. ABC123XYZ"
              />

              <LunaInput
                label="Certificate URL"
                type="url"
                value={formData.certificate_url_external}
                onChange={(e) => setFormData({ ...formData, certificate_url_external: e.target.value })}
                placeholder="https://..."
                helperText="Link to verify your certification online"
              />

              <LunaFileUpload
                label="Certificate File"
                helperText="Upload a copy of your certificate (PDF, PNG, JPG, WEBP - max 10MB)"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                maxSize={10 * 1024 * 1024} // 10MB
                onFilesChange={(files) => setCertificateFile(files[0] || null)}
              />

              {uploadProgress && (
                <div className="p-3 bg-luna-blue-50 border border-luna-blue-200 rounded-lg text-sm text-luna-blue-700">
                  Uploading certificate file...
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="Issue Date"
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />

                <LunaInput
                  label="Expiry Date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  disabled={formData.does_not_expire}
                />
              </div>

              <LunaCheckbox
                label="This certification does not expire"
                checked={formData.does_not_expire}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, does_not_expire: checked as boolean, expiry_date: '' })
                }
              />
            </div>
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton type="submit" variant="primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {certification ? 'Update' : 'Add'} Certification
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

