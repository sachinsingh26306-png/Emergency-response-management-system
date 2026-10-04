import { useState } from 'react';
import { reportEmergencyAI, reportEmergencyManual } from '../api/client';
import type { Emergency } from '../api/client';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmergency: Emergency) => void;
}

const presets = [
  {
    title: 'Warehouse fire',
    text: 'Four-alarm commercial warehouse fire near Block C with multiple trapped occupants and heavy smoke.',
  },
  {
    title: 'Highway hazmat spill',
    text: 'Tanker truck overturned spilling hazardous chemicals across North Highway corridor with 4 casualties.',
  },
  {
    title: 'Multi-vehicle collision',
    text: 'Severe multi-vehicle accident near Downtown Civic Clinic, multiple critical injuries reported.',
  },
  {
    title: 'Flash flooding',
    text: 'Severe flash flooding near Riverside residential sector with submerged roads and stranded vehicles.',
  },
];

export const AiReportModal: React.FC<AiReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [manualData, setManualData] = useState({
    type: 'Fire',
    severity: 5,
    peopleAffected: 1,
    locationName: 'Downtown',
    gridX: 2,
    gridY: 2,
  });

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please describe the emergency situation.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await reportEmergencyAI(description);

      if (res.success && res.aiAnalysis) {
        setAnalysis(res.aiAnalysis);
      } else {
        // Fallback local analysis
        const isFire = /fire|flame|smoke|burn/i.test(description);
        const isMedical = /injury|casualt|heart|bleed|trauma|clinic/i.test(description);
        const isCrime = /robbery|gun|weapon|assault|theft/i.test(description);
        const isHazmat = /chemical|toxic|gas|spill|leak/i.test(description);
        const isFlood = /flood|water|submerged|river/i.test(description);

        const type = isFire ? 'Fire' : isMedical ? 'Medical' : isCrime ? 'Crime' : isHazmat ? 'Hazmat' : isFlood ? 'Flood' : 'Other';
        const severity = isFire || isHazmat ? 9 : isMedical ? 8 : 6;
        const peopleAffected = description.match(/\d+/) ? parseInt(description.match(/\d+/)![0]) : 4;

        let gridX = 2, gridY = 2;
        if (isHazmat) { gridX = 5; gridY = 7; }
        else if (isMedical) { gridX = 7; gridY = 3; }
        else if (isFlood) { gridX = 8; gridY = 4; }

        setAnalysis({
          type,
          severity,
          peopleAffected,
          location: isFire ? 'Block C Industrial' : isHazmat ? 'North Highway' : 'Downtown Plaza',
          gridX,
          gridY,
          traffic: 'High',
          summary: 'Local fallback parser used.',
          urgency: severity >= 8 ? 'Critical' : 'High',
          fallback: true,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      let payload;
      if (mode === 'ai' && analysis) {
        payload = {
          type: analysis.type,
          description: description,
          locationName: analysis.location,
          gridX: analysis.gridX,
          gridY: analysis.gridY,
          severity: analysis.severity,
          peopleAffected: analysis.peopleAffected,
        };
      } else if (mode === 'manual') {
        payload = {
          ...manualData,
          description: `${manualData.type} at ${manualData.locationName}`,
        };
      } else {
        return;
      }

      const res = await reportEmergencyManual(payload);
      
      onSuccess(res.emergency);
      // Reset state
      setDescription('');
      setAnalysis(null);
      setError(null);
      setMode('ai');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create emergency');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setAnalysis(null);
    setError(null);
    setMode('ai');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Report emergency
          </h2>
          <div className="flex gap-4 mt-3 border-b border-[var(--color-border)]">
            <button
              className={`pb-2 text-[13px] font-medium transition-colors ${mode === 'ai' ? 'text-[var(--color-red)] border-b-2 border-[var(--color-red)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
              onClick={() => setMode('ai')}
            >
              AI-assisted report
            </button>
            <button
              className={`pb-2 text-[13px] font-medium transition-colors ${mode === 'manual' ? 'text-[var(--color-red)] border-b-2 border-[var(--color-red)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
              onClick={() => setMode('manual')}
            >
              Manual report
            </button>
          </div>
        </div>

        {mode === 'ai' ? (
          <>
            <p className="text-[13px] text-[var(--color-text-tertiary)] mb-3">
              Gemini extracts incident details from your description. The C++ engine handles priority scoring and dispatch.
            </p>

            {/* Textarea */}
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="There is a major fire near Block C. Five people are trapped and traffic is heavy."
              className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2.5 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-text-tertiary)] transition resize-none mb-3"
            />
            
            {/* Preset scenarios */}
            {!analysis && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setDescription(p.text); setError(null); setAnalysis(null); }}
                    className="px-2.5 py-1 text-[12px] text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[#EFECE7] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-[13px] text-[var(--color-red)] mb-2">{error}</p>
            )}

            {/* Analysis results */}
            {analysis && (
              <div className="p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border-subtle)]">
                <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
                  AI analysis
                  {analysis.fallback && (
                    <span className="text-[11px] font-normal text-[var(--color-text-tertiary)] ml-2">
                      Local parser
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] mb-3">
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Type</span>
                    <div className="text-[var(--color-text-primary)] font-medium">{analysis.type}</div>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Severity</span>
                    <div className={`font-medium ${analysis.severity >= 8 ? 'text-[var(--color-red)]' : 'text-[var(--color-text-primary)]'}`}>
                      {analysis.severity} / 10
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Affected</span>
                    <div className="text-[var(--color-text-primary)] font-medium">{analysis.peopleAffected} people</div>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Location</span>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {analysis.location} <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">[{analysis.gridX}, {analysis.gridY}]</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Traffic</span>
                    <div className="text-[var(--color-text-primary)] font-medium">{analysis.traffic || 'Normal'}</div>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Urgency</span>
                    <div className="text-[var(--color-text-primary)] font-medium">{analysis.urgency || 'High'}</div>
                  </div>
                </div>
                <div>
                    <span className="text-[var(--color-text-tertiary)] text-[12px]">Summary</span>
                    <div className="text-[var(--color-text-primary)] font-medium text-[12px]">{analysis.summary || description}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Type</label>
              <input type="text" value={manualData.type} onChange={(e) => setManualData({...manualData, type: e.target.value})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Severity (1-10)</label>
                <input type="number" min="1" max="10" value={manualData.severity} onChange={(e) => setManualData({...manualData, severity: parseInt(e.target.value) || 1})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">People affected</label>
                <input type="number" min="0" value={manualData.peopleAffected} onChange={(e) => setManualData({...manualData, peopleAffected: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Location name</label>
              <input type="text" value={manualData.locationName} onChange={(e) => setManualData({...manualData, locationName: e.target.value})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Grid X (0-9)</label>
                <input type="number" min="0" max="9" value={manualData.gridX} onChange={(e) => setManualData({...manualData, gridX: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Grid Y (0-9)</label>
                <input type="number" min="0" max="9" value={manualData.gridY} onChange={(e) => setManualData({...manualData, gridY: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
              </div>
            </div>
            {error && <p className="text-[13px] text-[var(--color-red)]">{error}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {mode === 'ai' ? (
            !analysis ? (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-red)] hover:bg-[#B02D2D] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Analyzing…' : 'Analyze with Gemini'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-text-primary)] hover:bg-[#333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm emergency'}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-text-primary)] hover:bg-[#333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Confirm emergency'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiReportModal;
