import React, { useState } from 'react';
import { Volume2, VolumeX, X, Bell, Shield, Play } from 'lucide-react';
import { ReminderSettings } from '../types/index';
import { storageService } from '../services/storageService';
import { voiceReminderService } from '../services/voiceReminderService';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: ReminderSettings) => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<ReminderSettings>(storageService.getSettings());
  const [testPlaying, setTestPlaying] = useState(false);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    const updated = { ...settings, voiceEnabled: !settings.voiceEnabled };
    setSettings(updated);
    storageService.saveSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    storageService.saveSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...settings, voiceRate: rate };
    setSettings(updated);
    storageService.saveSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
  };

  const handleTestVoice = () => {
    setTestPlaying(true);
    voiceReminderService.testVoiceReminder();
    setTimeout(() => setTestPlaying(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-800 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 id="reminder-settings-title" className="text-xl font-extrabold text-slate-900">
                Reminder &amp; Voice Settings
              </h2>
              <p className="text-xs text-slate-500">
                Configure browser audio and voice assistance for Arthur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Reminders Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5 pr-4">
              <label htmlFor="voice-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                Web Speech Voice Reminders
              </label>
              <p className="text-xs text-slate-500">
                Announces scheduled dose reviews using natural speech (Web Speech API).
              </p>
            </div>
            <button
              id="voice-toggle"
              type="button"
              role="switch"
              aria-checked={settings.voiceEnabled}
              onClick={handleToggleVoice}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                settings.voiceEnabled ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  settings.voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound alert toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-0.5 pr-4">
              <label htmlFor="sound-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                In-App Audio Chime
              </label>
              <p className="text-xs text-slate-500">
                Plays a gentle chime on dose action confirmations.
              </p>
            </div>
            <button
              id="sound-toggle"
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={handleToggleSound}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                settings.soundEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Speech cadence for elders */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-sm font-bold text-slate-900">
              Elderly Speech Cadence
            </label>
            <p className="text-xs text-slate-500">
              Slower pacing improves clarity and comprehension for older listeners.
            </p>
            <div className="flex gap-2 pt-1">
              {[
                { label: 'Elder Cadence (Slow)', rate: 0.8 },
                { label: 'Standard (0.9x)', rate: 0.9 },
                { label: 'Normal (1.0x)', rate: 1.0 },
              ].map((item) => (
                <button
                  key={item.rate}
                  type="button"
                  onClick={() => handleRateChange(item.rate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.voiceRate === item.rate
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Voice Reminder button */}
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={testPlaying}
            className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-sky-300 hover:bg-sky-50 text-sky-800 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            {settings.voiceEnabled ? <Volume2 className="w-4 h-4 text-sky-600" /> : <Play className="w-4 h-4 text-sky-600" />}
            <span>{testPlaying ? 'Speaking Test Audio...' : 'Test Voice Reminder Now'}</span>
          </button>
        </div>

        {/* Safety Disclaimer */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-2xs sm:text-xs text-amber-900">
          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Safety Notice: </strong>
            Browser voice reminders are assistance tools only and do not guarantee administration. Arthur and Elena should maintain their primary physical pill organizer routine.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
