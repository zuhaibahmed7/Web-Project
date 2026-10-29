import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, CircleCheck, Funnel, Pause, Play, Search, ShieldCheck, UserRoundX, Users, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { findProvider } from '../utils/selectors';
import { formatDate } from '../utils/format';
import { required, hasErrors, runValidation } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, LinkButton } from '../components/ui/Button';
import { Input, Segmented, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

const ROLE_TONE = { admin: 'ink', provider: 'aqua', customer: 'brand' };
const ROLE_LABEL = { admin: 'Admin', provider: 'Provider', customer: 'Customer' };

// Rows shared by the desktop table and the mobile card list, so both views can
// never disagree about which accounts match the filters.
function useAccountRows(state, query, role, status) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.users
      .map((user) => {
        const provider = user.providerId ? findProvider(state, user.providerId) : null;
        const bookings = provider
          ? state.bookings.filter((b) => b.providerId === provider.id).length
          : state.bookings.filter((b) => b.customerId === user.id).length;
        return { user, provider, bookings };
      })
      .filter(({ user }) => (role === 'all' ? true : user.role === role))
      .filter(({ user }) => (status === 'all' ? true : user.status === status))
      .filter(({ user, provider }) => {
        if (!q) return true;
        return [user.name, user.email, user.phone, user.city, provider?.name].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
  }, [state, query, role, status]);
}

export default function AdminUsers() {
  const { state, setUserStatus } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  // Suspension always carries a written reason so the decision is explainable.
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = useAccountRows(state, query, role, status);
  const filtersActive = query.trim() !== '' || role !== 'all' || status !== 'all';

  const activeAdmins = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
  const counts = {
    total: state.users.length,
    admins: state.users.filter((u) => u.role === 'admin').length,
    suspended: state.users.filter((u) => u.status === 'suspended').length,
  };

  const clearFilters = () => {
    setQuery('');
    setRole('all');
    setStatus('all');
  };

  const guardFor = (user) => {
    // The platform must never be left without an administrator who can sign in.
    if (user.role === 'admin' && user.status === 'active' && activeAdmins.length <= 1) {
      return 'You cannot suspend the last active admin account.';
    }
    return '';
  };

  const openSuspend = (user) => {
    setPending(user);
    setReason('');
    setErrors({});
    setConfirmOpen(true);
  };

  const closeSuspend = () => {
    setConfirmOpen(false);
    setPending(null);
    setErrors({});
  };

  const submitSuspension = () => {
    const validation = runValidation({ reason }, { reason: (v) => required(v, 'Reason') });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    closeSuspend();
    setUserStatus(pending.id, 'suspended');
    toast.warning(`${pending.name} is suspended and can no longer sign in.`, { title: 'Account suspended' });
  };

  const reactivate = (user) => {
    setUserStatus(user.id, 'active');
    toast.success(`${user.name} can sign in again.`, { title: 'Account reactivated' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="User accounts"
        description="Every login on the platform — customers, service providers and administrators — with their linked business, booking volume and access status."
        actions={
          <Badge tone={counts.suspended > 0 ? 'danger' : 'success'} icon={ShieldCheck}>
            {counts.suspended > 0 ? `${counts.suspended} suspended` : 'No suspensions'}
          </Badge>
        }
      />

      {/* ------------------------------------------------------------- filters */}
      <Card padding="sm" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 lg:max-w-sm lg:flex-1">
            <Input
              label="Search accounts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, phone or city"
              icon={Search}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-content-soft">Role</p>
              <Segmented
                ariaLabel="Filter accounts by role"
                size="sm"
                value={role}
                onChange={setRole}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'customer', label: 'Customers' },
                  { value: 'provider', label: 'Providers' },
                  { value: 'admin', label: 'Admins' },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-content-soft">Status</p>
              <Segmented
                ariaLabel="Filter accounts by status"
                size="sm"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-1 text-[12.5px] text-content-muted">
          <span className="inline-flex items-center gap-1.5 font-semibold text-content">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {rows.length} of {counts.total} accounts shown
          </span>
          <span>· {counts.admins} admin seats</span>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold text-content-soft transition-colors hover:border-brand-500/50 hover:text-content"
            >
              <Funnel className="h-3 w-3" aria-hidden="true" />
              Clear filters
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </Card>

      {rows.length === 0 ? (
        <Reveal className="mt-6 block">
          <EmptyState
            icon={UserRoundX}
            tone="dashed"
            title="No accounts match these filters"
            description="Try a different spelling, or widen the role and status filters to see the full register."
            action={<Button variant="secondary" onClick={clearFilters}>Clear all filters</Button>}
          />
        </Reveal>
      ) : (
        <>
          {/* Desktop ledger */}
          <Reveal className="mt-6 hidden lg:block">
            <Card padding="none" className="overflow-hidden">
              <table className="w-full text-left text-[13.5px]" aria-label="User accounts">
                <caption className="sr-only">
                  All registered accounts with role, city, activity and access status. Suspending an account blocks it
                  at sign-in until an administrator reactivates it.
                </caption>
                <thead>
                  <tr className="border-b border-line bg-canvas-2/60 text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">
                    <th scope="col" className="px-5 py-3">Account</th>
                    <th scope="col" className="px-3 py-3">Role</th>
                    <th scope="col" className="px-3 py-3">City</th>
                    <th scope="col" className="px-3 py-3">Linked business / activity</th>
                    <th scope="col" className="px-3 py-3">Joined</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ user, provider, bookings }) => {
                    const guard = guardFor(user);
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-canvas-2/50">
                        <th scope="row" className="px-5 py-3.5 text-left font-normal">
                          <span className="flex items-center gap-3">
                            <Avatar name={user.name} size="sm" ring={user.role === 'admin'} />
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-content">{user.name}</span>
                              <span className="block truncate text-[12.5px] text-content-muted">{user.email}</span>
                            </span>
                          </span>
                        </th>
                        <td className="px-3 py-3.5">
                          <Badge tone={ROLE_TONE[user.role]} size="sm">
                            {ROLE_LABEL[user.role]}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5 text-content-soft">{user.city || '—'}</td>
                        <td className="px-3 py-3.5">
                          {provider ? (
                            <span className="flex flex-col gap-0.5">
                              <Link
                                to={`/provider/${provider.slug}`}
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline dark:text-brand-300"
                              >
                                <Building className="h-3.5 w-3.5" aria-hidden="true" />
                                {provider.name}
                              </Link>
                              <span className="text-[12px] text-content-muted">
                                {bookings} booking{bookings === 1 ? '' : 's'} · verification {provider.verificationStatus}
                              </span>
                            </span>
                          ) : (
                            <span className="text-content-soft">
                              {bookings} booking{bookings === 1 ? '' : 's'} placed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-content-muted">{formatDate(user.joinedAt)}</td>
                        <td className="px-3 py-3.5">
                          <Badge tone={user.status === 'active' ? 'success' : 'danger'} size="sm">
                            {user.status === 'active' ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center justify-end gap-3">
                            {provider && (
                              <LinkButton to={`/provider/${provider.slug}`} className="text-[12.5px]">
                                Business
                              </LinkButton>
                            )}
                            {user.status === 'active' ? (
                              <button
                                type="button"
                                disabled={Boolean(guard)}
                                title={guard || `Suspend ${user.name}`}
                                onClick={() => openSuspend(user)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-rejected/35 bg-rejected/8 px-2.5 text-[12px] font-bold text-rejected transition-colors hover:bg-rejected/15 disabled:pointer-events-none disabled:opacity-40"
                              >
                                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => reactivate(user)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-completed/35 bg-completed/8 px-2.5 text-[12px] font-bold text-completed transition-colors hover:bg-completed/15"
                              >
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                Reactivate
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </Reveal>

          {/* Mobile / tablet: the same data reflowed into cards (375px safe). */}
          <div className="mt-6 flex flex-col gap-3 lg:hidden">
            <p className="sr-only" aria-live="polite">
              {rows.length} accounts shown as cards.
            </p>
            {rows.map(({ user, provider, bookings }) => {
              const guard = guardFor(user);
              return (
                <Card key={user.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <Avatar name={user.name} size="sm" ring={user.role === 'admin'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[15px] font-bold tracking-[-0.02em]">{user.name}</p>
                      <p className="truncate text-[12.5px] text-content-muted">{user.email}</p>
                    </div>
                    <Badge tone={user.status === 'active' ? 'success' : 'danger'} size="sm">
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                    <div>
                      <dt className="text-content-muted">Role</dt>
                      <dd className="mt-0.5">
                        <Badge tone={ROLE_TONE[user.role]} size="sm">
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">City</dt>
                      <dd className="font-semibold text-content">{user.city || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">Activity</dt>
                      <dd className="font-semibold text-content">
                        {bookings} booking{bookings === 1 ? '' : 's'}
                        {provider ? '' : ' placed'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">Joined</dt>
                      <dd className="font-semibold text-content">{formatDate(user.joinedAt)}</dd>
                    </div>
                  </dl>

                  {provider && (
                    <div className="mt-3 rounded-sm border border-line bg-canvas-2/60 px-3 py-2.5">
                      <p className="text-[10.5px] font-bold tracking-[0.1em] text-content-muted uppercase">
                        Linked business
                      </p>
                      <Link
                        to={`/provider/${provider.slug}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:underline dark:text-brand-300"
                      >
                        <Building className="h-3.5 w-3.5" aria-hidden="true" />
                        {provider.name}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-content-muted">
                        Verification: {provider.verificationStatus}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Pause}
                        disabled={Boolean(guard)}
                        title={guard || `Suspend ${user.name}`}
                        onClick={() => openSuspend(user)}
                        className="border-rejected/35 text-rejected"
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="success" icon={Play} onClick={() => reactivate(user)}>
                        Reactivate
                      </Button>
                    )}
                    {provider && (
                      <Button size="sm" variant="ghost" icon={Building} to={`/provider/${provider.slug}`}>
                        View business
                      </Button>
                    )}
                  </div>
                  {guard && (
                    <p className="mt-2 text-[11.5px] leading-snug text-rejected dark:text-[#ff8a8a]">{guard}</p>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-content-muted">
        <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-completed" aria-hidden="true" />
        Suspension is enforced inside the store&rsquo;s login check, not just hidden in this UI. Suspended accounts keep
        their history, and reactivating restores access immediately.
      </p>

      {/* ----------------------------------------------- suspension: reason + action */}
      <Modal
        open={confirmOpen && Boolean(pending)}
        onClose={closeSuspend}
        title={`Suspend ${pending?.name ?? 'account'}?`}
        description="The store refuses their login immediately — this is not just a UI change."
        footer={
          <>
            <Button variant="ghost" onClick={closeSuspend}>
              Keep active
            </Button>
            <Button variant="danger" icon={Pause} onClick={submitSuspension}>
              Suspend account
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for suspension"
          required
          rows={3}
          maxLength={240}
          showCount
          value={reason}
          error={errors.reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (errors.reason) setErrors({});
          }}
          hint="Stored with the account so the decision can be reviewed later."
        />
        <p className="flex items-start gap-2 rounded-sm border border-rejected/30 bg-rejected/8 px-3.5 py-3 text-[12.5px] leading-relaxed text-content-soft">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rejected" aria-hidden="true" />
          {pending?.email} will get &ldquo;This account is suspended. Please contact an administrator.&rdquo; at
          sign-in. Their existing bookings and reviews stay in the ledger, and reactivating restores access instantly.
        </p>
      </Modal>
    </>
  );
}
