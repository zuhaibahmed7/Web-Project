import { useMemo, useState } from 'react';
import { Clock, Plus, Trash, CalendarCheck, CircleAlert, IdCard, Sparkles, Repeat } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { decorateProvider, nextAvailableISO } from '../utils/selectors';
import { formatDate, formatDayShort, formatTime } from '../utils/format';
import { WEEKDAYS, isoFromToday } from '../utils/date';
import { hasErrors, runValidation, validTime } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Toggle } from '../components/ui/Input';
import { Reveal } from '../components/ui/Reveal';

const DEFAULT_SLOT = { start: '09:00', end: '12:00' };

// Days are JS getDay() numbers: 0 = Sunday … 6 = Saturday (providers.js header).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function ProviderAvailability() {
  const { state, currentProvider, currentUser, updateProvider } = useStore();
  const toast = useToast();

  const saved = currentProvider?.availability ?? { days: [], slots: [] };

  // Local draft so the provider can try a combination before committing it.
  const [days, setDays] = useState(saved.days ?? []);
  const [slots, setSlots] = useState(() => (saved.slots?.length ? saved.slots : [DEFAULT_SLOT]));
  const [slotErrors, setSlotErrors] = useState({});

  const preview = useMemo(
    () =>
      currentProvider
        ? decorateProvider(state, { ...currentProvider, availability: { days, slots } })
        : null,
    [state, currentProvider, days, slots]
  );

  const nextIso = currentProvider ? nextAvailableISO({ availability: { days } }) : null;

  if (!currentUser) return null;

  if (!currentProvider) {
    return (
      <>
        <PageHeader eyebrow="Scheduling" title="Availability" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but there is no provider record to hold an availability calendar. Register as a service provider or ask an administrator to link your business.`}
          action={<Button to="/login">Sign in with another account</Button>}
        />
      </>
    );
  }

  const dirty =
    JSON.stringify([...days].sort((a, b) => a - b)) !== JSON.stringify([...(saved.days ?? [])].sort((a, b) => a - b)) ||
    JSON.stringify(slots) !== JSON.stringify(saved.slots ?? []);

  const toggleDay = (dow) => {
    if (days.includes(dow)) {
      // At least one working day must stay on, otherwise nobody can pick a date.
      if (days.length === 1) {
        toast.warning('Keep at least one working day selected — customers need a date to book.', {
          title: 'Last working day',
        });
        return;
      }
      setDays((d) => d.filter((x) => x !== dow));
    } else {
      setDays((d) => [...d, dow].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)));
    }
  };

  const setSlot = (index, key, value) => {
    setSlots((list) => list.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
    setSlotErrors((e) => (e[index] ? { ...e, [index]: '' } : e));
  };

  const addSlot = () => {
    const last = slots[slots.length - 1];
    // Chain the new slot after the previous one so a normal day fills up quickly.
    const start = last?.end && Number(last.end.slice(0, 2)) < 23 ? `${String(Number(last.end.slice(0, 2))).padStart(2, '0')}:00` : DEFAULT_SLOT.start;
    const end = Number(start.slice(0, 2)) < 23 ? `${String(Number(start.slice(0, 2)) + 3).padStart(2, '0')}:00` : '23:59';
    setSlots((list) => [...list, { start, end }]);
  };

  const removeSlot = (index) => {
    setSlots((list) => list.filter((_, i) => i !== index));
    setSlotErrors({});
  };

  const validateSlots = () => {
    const found = {};
    slots.forEach((slot, i) => {
      const errors = runValidation(slot, {
        start: (v) => validTime(v),
        end: (v) => validTime(v),
      });
      if (!errors.start && !errors.end && slot.end <= slot.start) {
        errors.end = 'End time must be later than the start time.';
      }
      // Duplicate detection compares normalized HH:MM pairs.
      const dupeIndex = slots.findIndex((s, j) => j < i && s.start === slot.start && s.end === slot.end);
      if (!errors.end && dupeIndex !== -1) {
        errors.end = `This exact slot is already listed in row ${dupeIndex + 1}.`;
      }
      if (Object.keys(errors).length) found[i] = Object.values(errors)[0];
    });
    setSlotErrors(found);
    return Object.keys(found).length === 0;
  };

  const save = () => {
    if (!days.length) {
      toast.error('Select at least one working day first.');
      return;
    }
    if (!slots.length) {
      toast.error('Add at least one time slot — customers pick from these hours.');
      return;
    }
    if (!validateSlots()) {
      toast.error('Fix the highlighted time slots before saving.', { title: 'Check your slots' });
      return;
    }

    // availability is replaced wholesale because updateProvider shallow-merges.
    updateProvider(currentProvider.id, {
      availability: {
        days: [...days].sort((a, b) => a - b),
        slots: slots.map((s) => ({ start: s.start, end: s.end })),
      },
    });
    toast.success('Availability updated. Customers now see these days and slots when booking.', {
      title: 'Schedule saved',
    });
  };

  const resetToSaved = () => {
    setDays(saved.days ?? []);
    setSlots(saved.slots?.length ? saved.slots : [DEFAULT_SLOT]);
    setSlotErrors({});
    toast.info('Changes discarded.');
  };

  const starts = slots.map((s) => s.start).filter((v) => /^\d{2}:\d{2}$/.test(v ?? '')).sort();
  const earliestStart = starts[0] ?? '';

  const busyHours = slots.reduce((sum, s) => {
    const [sh, sm] = String(s.start ?? '0:0').split(':').map(Number);
    const [eh, em] = String(s.end ?? '0:0').split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    return sum + (mins > 0 ? mins : 0);
  }, 0);

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Availability"
        description="The days and hours you accept work. This calendar drives the date picker on your public profile, so keep it honest — missed slots turn into complaints."
        actions={
          <>
            {dirty && (
              <Button variant="ghost" size="sm" icon={Repeat} onClick={resetToSaved}>
                Discard
              </Button>
            )}
            <Button size="sm" icon={CalendarCheck} onClick={save} disabled={!dirty}>
              {dirty ? 'Save schedule' : 'Saved'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {/* ------------------------------------------------ working days */}
          <Reveal>
            <Card padding="md">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">Working days</h2>
                  <p className="mt-1 text-[13px] text-content-muted">
                    {days.length} of 7 days open. Friday and Sunday closures are common in Pakistan — set what you
                    actually staff.
                  </p>
                </div>
                <Badge tone={days.length ? 'success' : 'danger'} size="sm">
                  {days.length ? `${days.length} day${days.length === 1 ? '' : 's'} selected` : 'No day selected'}
                </Badge>
              </div>

              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Working days">
                {DAY_ORDER.map((dow) => (
                  <li key={dow} className="rounded-sm border border-line bg-canvas-2/50 px-3.5 py-2.5">
                    <Toggle
                      checked={days.includes(dow)}
                      onChange={() => toggleDay(dow)}
                      label={fullDayName(dow)}
                      description={days.includes(dow) ? 'Open for bookings' : 'Closed'}
                    />
                  </li>
                ))}
              </ul>

              {!days.length && (
                <p className="mt-4 flex items-start gap-2 rounded-sm border border-rejected/35 bg-rejected/8 px-4 py-3 text-[13px] leading-relaxed text-content-soft">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rejected" aria-hidden="true" />
                  Every day is closed, so your profile shows "no open slots this week" and cannot be booked. Turn at
                  least one day back on before saving.
                </p>
              )}
            </Card>
          </Reveal>

          {/* ------------------------------------------------ time slots */}
          <Reveal>
            <Card padding="md">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">Daily time slots</h2>
                  <p className="mt-1 text-[13px] text-content-muted">
                    Each slot applies to every working day. Keep the end time later than the start, and avoid
                    duplicates.
                  </p>
                </div>
                <Button variant="outline" size="sm" icon={Plus} onClick={addSlot}>
                  Add slot
                </Button>
              </div>

              {slots.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={Clock}
                    tone="dashed"
                    title="No time slots yet"
                    description="Add the hours you work — customers choose one of these when they request a visit."
                    action={<Button icon={Plus} onClick={addSlot}>Add your first slot</Button>}
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {slots.map((slot, i) => (
                    <li
                      key={`${slot.start}-${slot.end}-${i}`}
                      className="flex flex-col gap-3 rounded-sm border border-line bg-canvas-2/40 p-3.5 sm:flex-row sm:items-center"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/12 text-[12px] font-bold text-brand-600 dark:text-brand-300">
                        {i + 1}
                      </span>
                      <div className="grid min-w-0 flex-1 gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                        <Input
                          id={`slot-start-${i}`}
                          label="From"
                          type="time"
                          value={slot.start ?? ''}
                          onChange={(e) => setSlot(i, 'start', e.target.value)}
                          inputClassName="h-10"
                        />
                        <span className="hidden self-end pb-6 text-content-muted sm:block" aria-hidden="true">
                          &rarr;
                        </span>
                        <Input
                          id={`slot-end-${i}`}
                          label="Until"
                          type="time"
                          value={slot.end ?? ''}
                          onChange={(e) => setSlot(i, 'end', e.target.value)}
                          error={slotErrors[i]}
                          inputClassName="h-10"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-[12.5px] font-semibold tabular-nums text-content-muted">
                          {slot.start && slot.end && slot.end > slot.start
                            ? `${formatTime(slot.start)} – ${formatTime(slot.end)}`
                            : 'Incomplete'}
                        </span>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          icon={Trash}
                          onClick={() => removeSlot(i)}
                          aria-label={`Remove slot ${i + 1}, ${formatTime(slot.start)} to ${formatTime(slot.end)}`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-content-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {slots.length} slot{slots.length === 1 ? '' : 's'} · about{' '}
                {busyHours ? `${Math.round(busyHours / 60)} h of daily capacity` : 'no usable capacity'} across{' '}
                {days.length} day{days.length === 1 ? '' : 's'}.
              </p>
            </Card>
          </Reveal>

          <div className="flex flex-wrap items-center gap-3">
            <Button icon={CalendarCheck} onClick={save} disabled={!dirty}>
              {dirty ? 'Save schedule' : 'Everything saved'}
            </Button>
            {dirty && (
              <>
                <Button variant="ghost" icon={Repeat} onClick={resetToSaved}>
                  Discard changes
                </Button>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-glow-700 dark:text-glow-300">
                  <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" /> Unsaved changes
                </span>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------ live preview */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card padding="md" className="overflow-hidden">
            <p className="text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">What customers see</p>
            <h2 className="mt-2 font-display text-[17px] font-bold tracking-[-0.02em]">Next bookable slot</h2>
            <p className="mt-1.5 font-display text-[20px] leading-tight font-extrabold tracking-[-0.03em]">
              {nextIso ? (
                <>
                  {formatDate(nextIso, { weekday: 'long' })}
                  {earliestStart && (
                    <span className="mt-1 block text-[14px] font-bold text-aqua-700 dark:text-aqua-300">
                      from {formatTime(earliestStart)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-content-muted">No open date</span>
              )}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {DAY_ORDER.map((dow) => (
                <span
                  key={dow}
                  className={`inline-flex h-7 min-w-9 items-center justify-center rounded-full px-2 text-[11.5px] font-bold ${
                    days.includes(dow)
                      ? 'grad-brand text-white'
                      : 'border border-dashed border-line-strong text-content-muted line-through'
                  }`}
                >
                  {WEEKDAYS[dow]}
                </span>
              ))}
            </div>

            <ul className="mt-4 space-y-1.5 text-[12.5px]">
              {[...slots]
                .sort((a, b) => String(a.start).localeCompare(String(b.start)))
                .map((slot) => (
                  <li key={`${slot.start}-${slot.end}`} className="flex items-center gap-2 text-content-soft">
                    <Clock className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                    {slot.start && slot.end ? `${formatTime(slot.start)} – ${formatTime(slot.end)}` : 'Incomplete slot'}
                  </li>
                ))}
              {!slots.length && <li className="text-content-muted">No slots — nothing selectable in the booking form.</li>}
            </ul>
          </Card>

          <Card padding="sm" className="bg-brand-500/6">
            <p className="flex items-center gap-2 font-display text-[14px] font-bold tracking-[-0.02em]">
              <Sparkles className="h-4 w-4 text-brand-500" aria-hidden="true" />
              Profile card preview
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-content-soft">
              {preview?.nextAvailable
                ? `Your listing will show "Next slot ${formatDayShort(preview.nextAvailable)}" — listings with an open slot are ranked higher in search.`
                : 'Your listing will show "No open slots this week", which pushes you down the results list.'}
            </p>
            <ul className="mt-3 space-y-1 text-[12px] text-content-muted">
              <li>Working days: {days.length ? DAY_ORDER.filter((d) => days.includes(d)).map((d) => WEEKDAYS[d]).join(', ') : 'none'}</li>
              <li>
                Next seven days:{' '}
                {Array.from({ length: 7 }, (_, i) => isoFromToday(i))
                  .filter((iso) => days.includes(new Date(`${iso}T00:00:00`).getDay()))
                  .slice(0, 4)
                  .map((iso) => formatDayShort(iso))
                  .join(' · ') || 'closed'}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

function fullDayName(dow) {
  return {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  }[dow];
}
