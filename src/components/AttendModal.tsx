import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppState';
import { fmtCard, startsAt } from '../lib/dates';
import { countsForOtj } from '../lib/events';
import type { Attendance, EventItem } from '../types';

const MIN_NOTES = 20;

export function AttendModal({ event, existing, onClose }: { event: EventItem; existing?: Attendance; onClose: () => void }) {
  const { state, dispatch, toast } = useApp();
  const otj = countsForOtj(event);
  const [hours, setHours] = useState<number>(existing?.hours ?? event.durationHours);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [apply, setApply] = useState(existing?.apply ?? '');
  const [touched, setTouched] = useState(false);
  const firstField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const notesOk = notes.trim().length >= MIN_NOTES;
  const hoursOk = !otj || (hours > 0 && hours <= event.durationHours);

  const save = () => {
    setTouched(true);
    if (!notesOk || !hoursOk || !state.currentUserId) return;
    dispatch({
      type: 'saveAttendance',
      attendance: {
        userId: state.currentUserId,
        eventId: event.id,
        hours: otj ? hours : 0,
        notes: notes.trim(),
        apply: apply.trim(),
        markedAt: new Date().toISOString(),
      },
    });
    toast(existing ? 'Notes updated' : 'Added to your report');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="attend-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accent-dark">{fmtCard(startsAt(event))}</p>
            <h2 id="attend-title" className="text-xl font-bold">
              {existing ? 'Edit notes' : 'I went'}: {event.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-stone-100">
            <X className="size-5" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {otj ? (
            <label className="block">
              <span className="text-sm font-semibold">Hours</span>
              <input
                type="number"
                min={0.5}
                max={event.durationHours}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="input mt-1 w-32"
              />
              <span className="ml-2 text-sm text-gray-500">max {event.durationHours}</span>
              {touched && !hoursOk && <p className="mt-1 text-sm text-red-600">Between 0.5 and {event.durationHours} hours.</p>}
            </label>
          ) : (
            <p className="rounded-xl bg-social-soft px-4 py-3 text-sm text-social">
              Social events don't add OTJ hours. Your notes are saved for your own record.
            </p>
          )}

          <label className="block">
            <span className="text-sm font-semibold">What did you do and learn?</span>
            <textarea
              ref={firstField}
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mapped a web app's data flows with STRIDE and ranked the top risks with my table."
              className="input mt-1 w-full"
            />
            <span className={`text-xs ${touched && !notesOk ? 'text-red-600' : 'text-gray-500'}`}>
              {touched && !notesOk ? `At least ${MIN_NOTES} characters, please. ` : ''}
              {notes.trim().length}/{MIN_NOTES} min
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">
              How will you use it at work? <span className="font-normal text-gray-500">(optional)</span>
            </span>
            <textarea rows={3} value={apply} onChange={(e) => setApply(e.target.value)} className="input mt-1 w-full" />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
