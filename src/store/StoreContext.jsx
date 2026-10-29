// The single source of truth for the prototype.
//
// Everything lives in one reducer and is mirrored to localStorage, which is what
// lets a change made in the provider view (accepting a request) appear instantly
// in the customer view and the admin statistics.
//
// Action creators build ids/timestamps *outside* the reducer so the reducer stays
// pure and double-invocation in StrictMode cannot create duplicate records.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { createInitialState, STATE_VERSION } from '../data/seed';
import { readState, writeState, clearState } from '../utils/storage';
import { STATUS, STATUS_META, allowedActions } from '../utils/booking';
import { uid } from '../utils/id';
import { todayISO } from '../utils/date';

const StoreContext = createContext(null);

/* ------------------------------------------------------------------ reducer */

function pushNotification(list, notification) {
  return [notification, ...list].slice(0, 200);
}

// Notification copy uses the same labels as the status badges, so "in_progress"
// never leaks into the UI as raw enum text.
function labelOf(status) {
  return STATUS_META[status]?.label ?? status.replace('_', ' ');
}

// Used inside a sentence: "Ayesha Khan cancelled booking FN-…".
function verbOf(status) {
  return labelOf(status).toLowerCase();
}

// Admin verification decisions, worded the way the provider would want to read them.
const VERIFY_VERBS = { verified: 'approved', rejected: 'declined', pending: 'put back in the queue' };

// Bookings/reviews only store ids, so message text is resolved from state (DR-04).
function namesFor(state, booking) {
  const customer = state.users.find((u) => u.id === booking.customerId);
  const provider = state.providers.find((p) => p.id === booking.providerId);
  const service = provider?.services?.find((s) => s.id === booking.serviceId);
  return {
    customerName: customer?.name ?? 'A customer',
    providerName: provider?.name ?? 'a provider',
    serviceName: service?.name ?? 'a service',
  };
}

function reducer(state, action) {
  switch (action.type) {
    /* ---------------- session & accounts ---------------- */
    case 'session/set':
      return { ...state, session: action.userId ? { userId: action.userId, at: action.at } : null };

    case 'user/add':
      return { ...state, users: [...state.users, action.user] };

    case 'user/update':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.id ? { ...u, ...action.patch } : u)),
      };

    case 'user/setStatus':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.id ? { ...u, status: action.status } : u)),
      };

    /* ---------------- providers ---------------- */
    case 'provider/add':
      return { ...state, providers: [...state.providers, action.provider] };

    case 'provider/update':
      return {
        ...state,
        providers: state.providers.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };

    case 'provider/setVerification': {
      const providers = state.providers.map((p) =>
        p.id === action.id ? { ...p, verificationStatus: action.status } : p
      );
      const provider = state.providers.find((p) => p.id === action.id);
      const owner = state.users.find((u) => u.providerId === action.id);
      const verb = VERIFY_VERBS[action.status] ?? action.status;
      let notifications = state.notifications;
      if (owner) {
        notifications = pushNotification(notifications, {
          id: `nt-${action.id}-${action.status}-${action.at}`,
          userId: owner.id,
          kind: 'verification',
          read: false,
          createdAt: action.at,
          title: `Verification ${verb}`,
          message: `${provider?.name ?? 'Your business'} was ${verb} by the FixNow team.`,
        });
      }
      return { ...state, providers, notifications };
    }

    /* ---------------- bookings ---------------- */
    case 'booking/add': {
      const { booking } = action;
      const names = namesFor(state, booking);
      const owner = state.users.find((u) => u.providerId === booking.providerId);
      let notifications = state.notifications;
      if (owner) {
        notifications = pushNotification(notifications, {
          id: `nt-${booking.id}-${STATUS.PENDING}-${booking.createdAt}`,
          userId: owner.id,
          kind: 'booking',
          bookingId: booking.id,
          read: false,
          createdAt: booking.createdAt,
          title: `New request ${booking.code}`,
          message: `${names.customerName} requested ${names.serviceName} on ${booking.date} at ${booking.time}.`,
        });
      }
      return { ...state, bookings: [booking, ...state.bookings], notifications };
    }

    case 'booking/setStatus': {
      const booking = state.bookings.find((b) => b.id === action.id);
      if (!booking || booking.status === action.status) return state;

      const allowed = allowedActions(booking, action.by);
      if (!allowed.includes(action.status)) return state; // SC-09 / SC-10

      const step = { status: action.status, at: action.at, by: action.by };
      const patch = { status: action.status, updatedAt: action.at, timeline: [...booking.timeline, step] };
      if (action.reason) {
        if (action.status === STATUS.CANCELLED) patch.cancelReason = action.reason;
        if (action.status === STATUS.REJECTED) patch.rejectReason = action.reason;
      }

      const bookings = state.bookings.map((b) => (b.id === action.id ? { ...b, ...patch } : b));

      // Tell the other side about the change (FR-N-01, FR-N-02). A provider
      // listing without a login account has nobody to notify, so the row is
      // skipped instead of being addressed to an id no user can ever read.
      const owner = state.users.find((u) => u.providerId === booking.providerId);
      const recipient = action.by === 'customer' ? owner?.id : booking.customerId;
      if (!recipient) return { ...state, bookings };

      const notifications = pushNotification(state.notifications, {
        id: `nt-${booking.id}-${action.status}-${action.at}`,
        userId: recipient,
        kind: 'booking',
        bookingId: booking.id,
        read: false,
        createdAt: action.at,
        title: `${booking.code} · ${labelOf(action.status)}`,
        message:
          action.by === 'customer'
            ? `${namesFor(state, booking).customerName} ${verbOf(action.status)} booking ${booking.code}.`
            : `Your booking ${booking.code} is now "${labelOf(action.status)}".`,
      });

      return { ...state, bookings, notifications };
    }

    case 'booking/patch':
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      };

    case 'booking/remove':
      return {
        ...state,
        bookings: state.bookings.filter((b) => b.id !== action.id),
      };

    /* ---------------- reviews ---------------- */
    case 'review/add': {
      const { review } = action;
      const owner = state.users.find((u) => u.providerId === review.providerId);
      const providerName = state.providers.find((p) => p.id === review.providerId)?.name ?? 'your business';
      const bookings = state.bookings.map((b) =>
        b.id === review.bookingId ? { ...b, reviewed: true } : b
      );
      const notifications = owner
        ? pushNotification(state.notifications, {
            id: `nt-${review.id}-review-${review.createdAt}`,
            userId: owner.id,
            kind: 'review',
            read: false,
            createdAt: review.createdAt,
            title: `New ${review.rating}-star review`,
            message: `${review.customerName} reviewed ${providerName}: "${review.comment.slice(0, 70)}${review.comment.length > 70 ? '…' : ''}"`,
          })
        : state.notifications;

      return { ...state, reviews: [review, ...state.reviews], bookings, notifications };
    }

    /* ---------------- complaints ---------------- */
    case 'complaint/add': {
      const admins = state.users.filter((u) => u.role === 'admin');
      const complainant = state.users.find((u) => u.id === action.complaint.complainantId);
      const raisedBy = complainant?.name ?? 'A customer';
      let notifications = state.notifications;
      admins.forEach((admin, i) => {
        notifications = pushNotification(notifications, {
          id: `nt-${action.complaint.id}-admin-${i}-${action.complaint.createdAt}`,
          userId: admin.id,
          kind: 'complaint',
          read: false,
          createdAt: action.complaint.createdAt,
          title: `Complaint ${action.complaint.code}`,
          message: `${action.complaint.subject} — raised by ${raisedBy}.`,
        });
      });
      return { ...state, complaints: [action.complaint, ...state.complaints], notifications };
    }

    case 'complaint/setStatus':
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.id === action.id
            ? {
                ...c,
                status: action.status,
                resolution: action.resolution ?? c.resolution,
                updatedAt: action.at,
              }
            : c
        ),
      };

    /* ---------------- categories ---------------- */
    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] };

    case 'category/update':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case 'category/remove':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) };

    /* ---------------- notifications ---------------- */
    case 'notification/read':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };

    case 'notification/readAll':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.userId ? { ...n, read: true } : n
        ),
      };

    case 'state/reset':
      return createInitialState();

    default:
      return state;
  }
}

/* -------------------------------------------------------------------- init */

function initState() {
  const saved = readState();
  // A saved state from an older seed version is discarded so the demo never
  // renders against mismatched shapes.
  if (saved && saved.version === STATE_VERSION) return saved;
  return createInitialState();
}

/* ---------------------------------------------------------------- provider */

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    writeState(state);
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.session?.userId) ?? null,
    [state.users, state.session]
  );

  // The login user behind a provider profile (providers are linked by user.providerId).
  const currentProvider = useMemo(() => {
    if (currentUser?.role !== 'provider') return null;
    return state.providers.find((p) => p.id === currentUser.providerId) ?? null;
  }, [currentUser, state.providers]);

  const login = useCallback((email, password) => {
    const user = stateRef.current.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user) return { ok: false, error: 'No account found with that email address.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password. Try again.' };
    if (user.status === 'suspended') {
      return { ok: false, error: 'This account is suspended. Please contact an administrator.' };
    }
    dispatch({ type: 'session/set', userId: user.id, at: new Date().toISOString() });
    return { ok: true, user };
  }, []);

  const register = useCallback((payload) => {
    const email = String(payload.email).trim().toLowerCase();
    const exists = stateRef.current.users.some((u) => u.email.toLowerCase() === email);
    if (exists) return { ok: false, error: 'Account already exists. Please log in.' };

    const id = uid('u');
    const user = {
      id,
      name: payload.name.trim(),
      email,
      password: payload.password,
      role: payload.role,
      phone: payload.phone || '',
      city: payload.city || '',
      address: payload.address || '',
      status: 'active',
      joinedAt: todayISO(),
    };

    // A registering provider also gets a (unverified) business profile so the
    // admin verification queue has something to approve.
    let provider = null;
    if (payload.role === 'provider') {
      provider = {
        id: uid('p'),
        ownerId: id,
        slug: `${payload.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-4)}`,
        name: payload.businessName?.trim() || `${payload.name.trim()}'s Services`,
        ownerName: payload.name.trim(),
        tagline: 'New on FixNow',
        bio: payload.bio?.trim() || 'This provider has not added a description yet.',
        categoryId: payload.categoryId,
        city: payload.city,
        areas: payload.areas
          ? payload.areas.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
        phone: payload.phone || '',
        email,
        verificationStatus: 'pending',
        jobsCompleted: 0,
        yearsExperience: Number(payload.yearsExperience) || 1,
        responseMins: 60,
        joinedAt: todayISO(),
        badges: [],
        services: [],
        availability: { days: [1, 2, 3, 4, 5, 6], slots: [{ start: '09:00', end: '17:00' }] },
      };
      user.providerId = provider.id;
    }

    dispatch({ type: 'user/add', user });
    if (provider) dispatch({ type: 'provider/add', provider });
    dispatch({ type: 'session/set', userId: id, at: new Date().toISOString() });
    return { ok: true, user, provider };
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'session/set', userId: null, at: new Date().toISOString() });
  }, []);

  const createBooking = useCallback((draft) => {
    const now = new Date().toISOString();
    const booking = {
      id: uid('bk'),
      code: `FN-${Math.floor(2410 + Math.random() * 5000)}`,
      status: STATUS.PENDING, // BRL-03
      createdAt: now,
      updatedAt: now,
      reviewed: false,
      timeline: [{ status: STATUS.PENDING, at: now, by: 'customer' }],
      ...draft,
    };
    dispatch({ type: 'booking/add', booking });
    return booking;
  }, []);

  const setBookingStatus = useCallback((id, status, by, reason = '') => {
    dispatch({ type: 'booking/setStatus', id, status, by, reason, at: new Date().toISOString() });
  }, []);

  const addReview = useCallback((review) => {
    dispatch({ type: 'review/add', review: { id: uid('rev'), createdAt: new Date().toISOString(), ...review } });
  }, []);

  const addComplaint = useCallback((complaint) => {
    dispatch({
      type: 'complaint/add',
      complaint: {
        id: uid('cp'),
        code: `CM-${Math.floor(121 + Math.random() * 700)}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolution: '',
        ...complaint,
      },
    });
  }, []);

  const setComplaintStatus = useCallback((id, status, resolution) => {
    dispatch({ type: 'complaint/setStatus', id, status, resolution, at: new Date().toISOString() });
  }, []);

  const updateProvider = useCallback((id, patch) => {
    dispatch({ type: 'provider/update', id, patch });
  }, []);

  const setVerification = useCallback((id, status) => {
    dispatch({ type: 'provider/setVerification', id, status });
  }, []);

  const updateUser = useCallback((id, patch) => {
    dispatch({ type: 'user/update', id, patch });
  }, []);

  const setUserStatus = useCallback((id, status) => {
    dispatch({ type: 'user/setStatus', id, status });
  }, []);

  const removeBooking = useCallback((id) => {
    dispatch({ type: 'booking/remove', id });
  }, []);

  const addCategory = useCallback((category) => {
    dispatch({ type: 'category/add', category: { id: uid('cat'), ...category } });
  }, []);

  const updateCategory = useCallback((id, patch) => {
    dispatch({ type: 'category/update', id, patch });
  }, []);

  const removeCategory = useCallback((id) => {
    dispatch({ type: 'category/remove', id });
  }, []);

  const markNotificationRead = useCallback((id) => {
    dispatch({ type: 'notification/read', id });
  }, []);

  const markAllNotificationsRead = useCallback((userId) => {
    dispatch({ type: 'notification/readAll', userId });
  }, []);

  const resetDemoData = useCallback(() => {
    clearState();
    dispatch({ type: 'state/reset' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      currentUser,
      currentProvider,
      login,
      register,
      logout,
      createBooking,
      setBookingStatus,
      addReview,
      addComplaint,
      setComplaintStatus,
      updateProvider,
      setVerification,
      updateUser,
      setUserStatus,
      removeBooking,
      addCategory,
      updateCategory,
      removeCategory,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
    }),
    [
      state,
      currentUser,
      currentProvider,
      login,
      register,
      logout,
      createBooking,
      setBookingStatus,
      addReview,
      addComplaint,
      setComplaintStatus,
      updateProvider,
      setVerification,
      updateUser,
      setUserStatus,
      removeBooking,
      addCategory,
      updateCategory,
      removeCategory,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
