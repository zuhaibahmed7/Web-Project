import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MessageSquareMore, Star, Wallet } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { bookingsByCustomer, findProvider, hasReviewForBooking } from '../utils/selectors';
import { STATUS } from '../utils/booking';
import { formatDate, formatPKR } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Rating } from '../components/ui/Rating';
import { RatingBreakdown } from '../components/ui/Rating';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { ReviewCard } from '../components/cards/ReviewCard';

// The customer's review history plus the reviews they still owe (FR-RR-01, BRL-07).
export default function MyReviews() {
  const { state, currentUser } = useStore();

  const pending = useMemo(
    () =>
      bookingsByCustomer(state, currentUser.id).filter(
        (b) => b.status === STATUS.COMPLETED && !hasReviewForBooking(state, b.id)
      ),
    [state, currentUser.id]
  );

  const written = useMemo(
    () =>
      state.reviews
        .filter((r) => r.customerId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.reviews, currentUser.id]
  );

  // Ratings given by this customer — their own scorecard, not the provider's.
  const summary = useMemo(() => {
    if (!written.length) return { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0], best: null };
    const breakdown = [0, 0, 0, 0, 0];
    written.forEach((r) => {
      breakdown[r.rating - 1] += 1;
    });
    return {
      average: Math.round((written.reduce((s, r) => s + r.rating, 0) / written.length) * 10) / 10,
      count: written.length,
      breakdown,
      best: findProvider(state, [...written].sort((a, b) => b.rating - a.rating)[0].providerId),
    };
  }, [written, state]);

  return (
    <>
      <PageHeader
        eyebrow="Your feedback"
        title="My reviews"
        description="Reviews open once a provider marks a booking Completed, and each completed job may be rated exactly once (BRL-07). What you write changes that provider's public rating immediately."
        actions={<Button to="/browse">Book another service</Button>}
      />

      {/* ------------------------------------------------ waiting for a review */}
      <section aria-labelledby="pending-heading">
        <Reveal>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="pending-heading" className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
              Waiting for your review
              {pending.length > 0 && (
                <span className="ml-2 align-middle text-[13px] font-bold text-glow-600 tabular-nums dark:text-glow-300">
                  {pending.length}
                </span>
              )}
            </h2>
            <p className="text-[13px] text-content-muted">Completed jobs with no rating yet</p>
          </div>
        </Reveal>

        {pending.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            tone="dashed"
            title={
              written.length ? 'Nothing left to review' : 'You have not completed a booking yet'
            }
            description={
              written.length
                ? 'Every finished job on this account already has a review. When a provider marks a new booking Completed it appears here.'
                : 'Reviews only unlock after a provider marks a booking Completed. Find a verified professional and send your first request to start that lifecycle.'
            }
            action={written.length ? undefined : <Button to="/browse" iconRight={ArrowRight}>Browse providers</Button>}
            secondaryAction={<Button variant="outline" to="/app/bookings">See my bookings</Button>}
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {pending.map((booking, i) => {
              const provider = findProvider(state, booking.providerId);
              const service = provider?.services?.find((s) => s.id === booking.serviceId);
              return (
                <li key={booking.id}>
                  <Reveal delay={i * 0.05}>
                    <Card className="h-full">
                      <div className="flex items-start gap-3.5">
                        <Avatar name={provider?.name ?? 'Provider'} size="md" ring />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[16px] font-bold">{provider?.name ?? 'Provider removed'}</p>
                          <p className="mt-0.5 truncate text-[13px] text-content-muted">
                            {service?.name ?? 'Service'} · {booking.code}
                          </p>
                        </div>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[12.5px]">
                        <div>
                          <dt className="flex items-center gap-1.5 text-content-muted">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                            Job date
                          </dt>
                          <dd className="mt-0.5 font-semibold">{formatDate(booking.date)}</dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1.5 text-content-muted">
                            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                            Estimate
                          </dt>
                          <dd className="mt-0.5 font-semibold">
                            {booking.estimate ? formatPKR(booking.estimate) : 'Not recorded'}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-4 rounded-sm bg-canvas-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-content-muted">
                        Rate the work out of five and add a sentence about punctuality, price and finish. It publishes
                        on {provider?.name ?? 'the provider'}’s public profile.
                      </p>

                      <div className="mt-4">
                        <Button to={`/booking/${booking.id}#review`} full iconRight={ArrowRight}>
                          Write your review
                        </Button>
                      </div>
                    </Card>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------ written */}
      <section aria-labelledby="written-heading" className="mt-12">
        <Reveal>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="written-heading" className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
              Your reviews
              {written.length > 0 && (
                <span className="ml-2 align-middle text-[13px] font-bold text-content-muted tabular-nums">
                  {written.length}
                </span>
              )}
            </h2>
            <p className="text-[13px] text-content-muted">Newest first</p>
          </div>
        </Reveal>

        {written.length === 0 ? (
          <EmptyState
            icon={Star}
            tone="dashed"
            title="No reviews written yet"
            description="Once you rate a completed job it appears here, alongside the star split of everything you have published."
            action={<Button to="/browse">Find a service to book</Button>}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <ul className="flex flex-col gap-4">
              {written.map((review, i) => {
                const provider = findProvider(state, review.providerId);
                return (
                  <li key={review.id}>
                    <Reveal delay={i * 0.05}>
                      <ReviewCard review={review} providerName={provider?.name ?? 'A provider'} showCustomer={false} />
                    </Reveal>
                  </li>
                );
              })}
            </ul>

            <Reveal delay={0.08}>
              <Card className="lg:sticky lg:top-24">
                <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">
                  <MessageSquareMore className="h-3.5 w-3.5" aria-hidden="true" />
                  How you rate
                </p>
                <p className="mt-3 font-display text-[34px] leading-none font-extrabold tabular-nums">
                  {summary.average.toFixed(1)}
                  <span className="ml-1.5 text-[15px] font-bold text-content-muted">/ 5</span>
                </p>
                <Rating value={summary.average} count={summary.count} size="md" className="mt-2.5" />
                <p className="mt-3 text-[12.5px] leading-relaxed text-content-muted">
                  Average of the ratings you have given across {summary.count} completed job
                  {summary.count === 1 ? '' : 's'}.
                </p>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">
                    Your star split
                  </p>
                  <RatingBreakdown breakdown={summary.breakdown} total={summary.count} />
                </div>

                {summary.best && (
                  <div className="mt-5 rounded-sm bg-canvas-2 px-3.5 py-3 text-[12.5px] leading-relaxed text-content-muted">
                    <p className="font-bold text-content-soft">Best-rated by you</p>
                    <p className="mt-1">
                      <Link
                        to={`/provider/${summary.best.slug}`}
                        className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
                      >
                        {summary.best.name}
                      </Link>{' '}
                      in {summary.best.city}.
                    </p>
                  </div>
                )}
              </Card>
            </Reveal>
          </div>
        )}
      </section>
    </>
  );
}
