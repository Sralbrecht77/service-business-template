import type { Database } from "@/lib/supabase/database.types";

type BookingPhoto = Database["public"]["Tables"]["booking_photos"]["Row"];

export function BookingPhotoGallery({
  bookingId,
  photos,
  loadError = false,
}: {
  bookingId: string;
  photos: BookingPhoto[];
  loadError?: boolean;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-navy">Customer photos</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Private booking attachments. Links are authorized and expire shortly.
      </p>
      {loadError ? (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Photos could not be loaded. Confirm that the booking-photo migration has been applied.</p>
      ) : photos.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No photos were attached.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const photoUrl = `/api/admin/bookings/${bookingId}/photos/${photo.id}`;

            return (
              <figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <a href={photoUrl} target="_blank" rel="noreferrer" className="block bg-slate-100">
                  {/* A normal img keeps the authenticated request in the browser; the route redirects to a short-lived signed URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt={photo.original_name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </a>
                <figcaption className="p-3">
                  <p className="truncate text-sm font-bold text-navy">{photo.original_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{(photo.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
