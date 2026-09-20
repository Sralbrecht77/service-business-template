import Image from "next/image";
import {
  bookingNeedsCustomQuote,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTime,
  formatMoney,
  formatServiceType,
  getBookingSpecialtyItems,
  type Booking,
} from "@/lib/admin-bookings";
import { businessConfig } from "@/lib/business-config";

function PrintField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="print-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PrintableJobSheet({ booking }: { booking: Booking }) {
  const customQuoteRequired = bookingNeedsCustomQuote(booking);
  const specialtyItems = getBookingSpecialtyItems(booking);
  const travelLabel =
    booking.service_type === "crew_only" ? "Crew Only travel fee" : "Travel / mobilization fee";

  return (
    <article className="job-sheet print-only">
      <header className="job-sheet-header">
        <div>
          <p className="job-sheet-kicker">Moving job sheet</p>
          <h1>{businessConfig.company.legalName}</h1>
          <p>Booking {booking.id}</p>
        </div>
        <Image
          src={businessConfig.assets.logoPath}
          alt={`${businessConfig.company.name} logo`}
          width={180}
          height={120}
          className="job-sheet-logo"
        />
      </header>

      {customQuoteRequired ? (
        <p className="job-sheet-quote-alert">CUSTOM QUOTE REQUIRED</p>
      ) : null}

      <section>
        <h2>Job overview</h2>
        <dl className="job-sheet-grid">
          <PrintField label="Status" value={booking.status.toUpperCase()} />
          <PrintField label="Service type" value={formatServiceType(booking.service_type)} />
          <PrintField label="Move date" value={formatAdminDate(booking.requested_date)} />
          <PrintField label="Requested start" value={formatAdminTime(booking.requested_time)} />
          <PrintField label="Created" value={formatAdminDateTime(booking.created_at)} />
        </dl>
      </section>

      <section>
        <h2>Customer and addresses</h2>
        <dl className="job-sheet-grid">
          <PrintField label="Customer" value={booking.customer_name} />
          <PrintField label="Phone" value={booking.customer_phone} />
          <PrintField label="Email" value={booking.customer_email} />
          <PrintField label="FROM" value={booking.pickup_address} />
          <PrintField label="TO" value={booking.destination_address} />
        </dl>
      </section>

      <section>
        <h2>Estimate</h2>
        <dl className="job-sheet-grid">
          <PrintField label="Crew size" value={`${booking.crew_size} movers`} />
          <PrintField label="Estimated hours" value={`${booking.estimated_hours} hours`} />
          <PrintField label="Round-trip mileage" value={`${booking.round_trip_miles} miles`} />
          <PrintField label="Hourly rate" value={booking.hourly_rate === null ? "Custom quote required" : `${formatMoney(booking.hourly_rate)}/hour`} />
          <PrintField label="Labor estimate" value={booking.estimated_labor_cost === null ? "Custom quote required" : formatMoney(booking.estimated_labor_cost)} />
          <PrintField label={travelLabel} value={booking.travel_fee === null ? "Custom quote required" : formatMoney(booking.travel_fee)} />
          <PrintField label="Estimated total" value={customQuoteRequired || booking.estimated_base_total === null ? "CUSTOM QUOTE REQUIRED" : formatMoney(booking.estimated_base_total)} />
        </dl>
      </section>

      <section>
        <h2>Move details</h2>
        <dl className="job-sheet-grid">
          <PrintField
            label="Specialty items / conditions"
            value={specialtyItems.length > 0 ? specialtyItems.map((item) => item.label).join(", ") : "None noted"}
          />
          <PrintField label="Customer move notes" value={booking.move_notes || "None provided"} />
          <PrintField label="Internal job notes" value={booking.admin_notes || "None provided"} />
        </dl>
      </section>
    </article>
  );
}
