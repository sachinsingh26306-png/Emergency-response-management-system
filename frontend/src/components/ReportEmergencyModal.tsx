import { useState } from 'react';
import { reportEmergencyManual } from '../api/client';
import type { Emergency } from '../api/client';

interface ReportEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmergency: Emergency) => void;
}

const initialState = {
  type: 'Fire',
  severity: 5,
  peopleAffected: 1,
  locationName: 'Downtown',
  gridX: 2,
  gridY: 2,
};

export const ReportEmergencyModal: React.FC<ReportEmergencyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialState);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (loading) return;
    
    // Validation
    if (formData.gridX < 0 || formData.gridX > 9 || formData.gridY < 0 || formData.gridY > 9) {
      setError('Invalid coordinates. Grid X and Y must be between 0 and 9.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...formData,
        description: `${formData.type} at ${formData.locationName}`,
      };

      const res = await reportEmergencyManual(payload);
      
      onSuccess(res.emergency);
      setFormData(initialState);
      setError(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create emergency');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(initialState);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
        <div className="mb-5 border-b border-[var(--color-border)] pb-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Report emergency
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Type</label>
            <input type="text" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Severity (1-10)</label>
              <input type="number" min="1" max="10" value={formData.severity} onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value) || 1})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">People affected</label>
              <input type="number" min="0" value={formData.peopleAffected} onChange={(e) => setFormData({...formData, peopleAffected: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Location name</label>
            <input type="text" value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Grid X (0-9)</label>
              <input type="number" value={formData.gridX} onChange={(e) => setFormData({...formData, gridX: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--color-text-tertiary)] mb-1">Grid Y (0-9)</label>
              <input type="number" value={formData.gridY} onChange={(e) => setFormData({...formData, gridY: parseInt(e.target.value) || 0})} className="w-full rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-[13px]" />
            </div>
          </div>
          {error && <p className="text-[13px] text-[var(--color-red)]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-text-primary)] hover:bg-[#333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Confirm emergency'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportEmergencyModal;
