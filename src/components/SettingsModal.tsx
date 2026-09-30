import React from 'react';
import { X, Volume2, Wind, Eye, Gauge } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.ts';

interface SettingsModalProps {
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  fanAudioEnabled: boolean;
  onToggleFanAudio: () => void;
  showTrajectoryGuide: boolean;
  onToggleTrajectoryGuide: () => void;
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  soundEnabled,
  onToggleSound,
  fanAudioEnabled,
  onToggleFanAudio,
  showTrajectoryGuide,
  onToggleTrajectoryGuide,
  sensitivity,
  onChangeSensitivity,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white font-display">Settings & Audio</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-sky-400">
                <Volume2 size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Sound Effects</div>
                <div className="text-[11px] text-slate-400">Whoosh, swish, rim hits, and cheers</div>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleSound();
                soundEngine.enableAudioOnFirstGesture();
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Ambient Fan Drone Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-amber-400">
                <Wind size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Ambient Fan Hum</div>
                <div className="text-[11px] text-slate-400">Gentle background AC & fan air breeze</div>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleFanAudio();
                soundEngine.enableAudioOnFirstGesture();
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                fanAudioEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  fanAudioEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trajectory Guide (Practice helper) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-purple-400">
                <Eye size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Trajectory Arc Helper</div>
                <div className="text-[11px] text-slate-400">Dashed wind trajectory line when aiming</div>
              </div>
            </div>
            <button
              onClick={onToggleTrajectoryGuide}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                showTrajectoryGuide ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showTrajectoryGuide ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Flick Sensitivity Slider */}
          <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold text-white">Flick Sensitivity</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.round(sensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={sensitivity}
              onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Low (Heavy)</span>
              <span>Default (100%)</span>
              <span>Fast (Light)</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
