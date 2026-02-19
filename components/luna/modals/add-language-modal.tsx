/**
 * Add Language Modal - Multi-add with CRUD functionality
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
  LunaSearchableSelect,
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { Loader2, Languages, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type LanguageProficiency = Database['public']['Enums']['language_proficiency'];

interface AddLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LanguageEntry {
  id?: string;
  language_name: string;
  proficiency_level: LanguageProficiency;
  isNew?: boolean;
}

const PROFICIENCY_LEVELS: { value: LanguageProficiency; label: string }[] = [
  { value: 'native', label: 'Native proficiency' },
  { value: 'fluent', label: 'Professional proficiency' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
];

const WORLD_LANGUAGES = [
  'English', 'Spanish', 'Mandarin Chinese', 'Hindi', 'Arabic', 'Portuguese', 'Bengali', 'Russian',
  'Japanese', 'Punjabi', 'German', 'Javanese', 'Wu Chinese', 'Malay', 'Telugu', 'Vietnamese',
  'Korean', 'French', 'Marathi', 'Tamil', 'Urdu', 'Turkish', 'Italian', 'Yue Chinese', 'Thai',
  'Gujarati', 'Jin Chinese', 'Southern Min', 'Persian', 'Polish', 'Pashto', 'Kannada', 'Xiang Chinese',
  'Malayalam', 'Sundanese', 'Hausa', 'Odia', 'Burmese', 'Hakka Chinese', 'Ukrainian', 'Bhojpuri',
  'Tagalog', 'Yoruba', 'Maithili', 'Uzbek', 'Sindhi', 'Amharic', 'Fula', 'Romanian', 'Oromo',
  'Igbo', 'Azerbaijani', 'Awadhi', 'Gan Chinese', 'Cebuano', 'Dutch', 'Kurdish', 'Serbo-Croatian',
  'Malagasy', 'Saraiki', 'Nepali', 'Sinhalese', 'Chittagonian', 'Zhuang', 'Khmer', 'Turkmen',
  'Assamese', 'Madurese', 'Somali', 'Marwari', 'Magahi', 'Haryanvi', 'Hungarian', 'Chhattisgarhi',
  'Greek', 'Chewa', 'Deccan', 'Akan', 'Kazakh', 'Northern Min', 'Sylheti', 'Zulu', 'Czech',
  'Kinyarwanda', 'Dhundhari', 'Haitian Creole', 'Eastern Min', 'Ilocano', 'Quechua', 'Kirundi',
  'Swedish', 'Hmong', 'Shona', 'Uyghur', 'Hiligaynon', 'Mossi', 'Xhosa', 'Belarusian', 'Balochi',
  'Konkani',
];

export function AddLanguageModal({
  open,
  onOpenChange,
  onSuccess,
}: AddLanguageModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [newProficiency, setNewProficiency] = useState<LanguageProficiency>('intermediate');

  // Fetch existing languages when modal opens
  useEffect(() => {
    if (open) {
      fetchLanguages();
    }
  }, [open]);

  const fetchLanguages = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_languages')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setLanguages(data);
    }
  };

  const handleAddLanguage = () => {
    if (!newLanguage) return;

    setLanguages([
      ...languages,
      {
        language_name: newLanguage,
        proficiency_level: newProficiency,
        isNew: true,
      },
    ]);
    setNewLanguage('');
    setNewProficiency('intermediate');
  };

  const handleDeleteLanguage = async (index: number) => {
    const language = languages[index];

    if (language.id) {
      // Delete from database
      const supabase = createClient();
      await supabase
        .from('user_languages')
        .delete()
        .eq('id', language.id);
    }

    // Remove from local state
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert new languages
      const newLanguages = languages.filter(l => l.isNew);
      if (newLanguages.length > 0) {
        const { error: insertError } = await supabase
          .from('user_languages')
          .insert(
            newLanguages.map(l => ({
              user_id: user.id,
              language_name: l.language_name,
              proficiency_level: l.proficiency_level,
            }))
          );

        if (insertError) throw insertError;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving languages:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Manage Languages
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Add, edit, or remove languages from your profile
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-luna-error/10 border border-luna-error rounded-md text-sm text-luna-error">
                {error}
              </div>
            )}

            {/* Existing Languages */}
            {languages.map((lang, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-luna-gray-900 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={lang.language_name}
                    disabled
                    className="w-full px-3 py-2 border border-luna-border-default rounded-md bg-luna-bg-secondary text-luna-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-luna-gray-900 mb-1">
                    Fluency
                  </label>
                  <LunaSelect
                    value={lang.proficiency_level}
                    onValueChange={(value) => {
                      const updated = [...languages];
                      updated[index].proficiency_level = value as LanguageProficiency;
                      setLanguages(updated);
                    }}
                    disabled={!lang.isNew}
                  >
                    {PROFICIENCY_LEVELS.map((level) => (
                      <LunaSelectItem key={level.value} value={level.value}>
                        {level.label}
                      </LunaSelectItem>
                    ))}
                  </LunaSelect>
                </div>
                <LunaButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLanguage(index)}
                  className="text-luna-error hover:text-luna-error hover:bg-luna-error/10"
                >
                  <Trash2 className="w-4 h-4" />
                </LunaButton>
              </div>
            ))}

            {/* Add New Language */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end pt-4 border-t border-luna-border-default">
              <div>
                <label className="block text-sm font-medium text-luna-gray-900 mb-1">
                  Language
                </label>
                <LunaSearchableSelect
                  placeholder="Select language..."
                  value={newLanguage}
                  onValueChange={setNewLanguage}
                  options={WORLD_LANGUAGES.map(lang => ({
                    value: lang,
                    label: lang,
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-luna-gray-900 mb-1">
                  Fluency
                </label>
                <LunaSelect
                  value={newProficiency}
                  onValueChange={(value) => setNewProficiency(value as LanguageProficiency)}
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <LunaSelectItem key={level.value} value={level.value}>
                      {level.label}
                    </LunaSelectItem>
                  ))}
                </LunaSelect>
              </div>
              <LunaButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLanguage}
                disabled={!newLanguage}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add new
              </LunaButton>
            </div>
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
          <LunaButton onClick={handleSave} variant="primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

