import Image from "next/image";
import { ArrowIcon, Icon } from "@/components/icons";
import { BookingFlowProvider } from "@/components/booking/booking-flow-provider";
import { BookingRequestSection } from "@/components/booking/booking-request-section";
import { MovingCostEstimator } from "@/components/moving-cost-estimator";
import type { BusinessConfig } from "@/lib/business-config";

type HomepageProps = {
  config: BusinessConfig;
};

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why us", href: "#why-us" },
  { label: "Service area", href: "#service-area" },
];

function Container({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`mb-4 text-xs font-bold uppercase tracking-[0.22em] ${inverse ? "text-blue-300" : "text-blue-600"}`}>
        {eyebrow}
      </p>
      <h2 className={`text-balance text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl ${inverse ? "text-white" : "text-navy"}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mt-5 text-lg leading-8 ${inverse ? "text-slate-300" : "text-slate-600"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Header({ config }: HomepageProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15">
      <Container className="flex h-20 items-center justify-between gap-4">
        <a href="#top" className="flex items-center text-white" aria-label={`${config.company.name} home`}>
          <Image
            src={config.assets.logoPath}
            alt={`${config.company.name} logo`}
            width={1536}
            height={1024}
            preload
            className="h-16 w-24 object-cover object-center sm:h-[4.5rem] sm:w-28"
            sizes="(max-width: 640px) 96px, 112px"
          />
        </a>
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-200 transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#estimator" className="button button-light hidden sm:inline-flex">
          Get an estimate <ArrowIcon />
        </a>
        <a href="#estimator" className="button button-light px-4 sm:hidden" aria-label="Request an estimate">
          Estimate
        </a>
      </Container>
    </header>
  );
}

function Hero({ config }: HomepageProps) {
  return (
    <section id="top" className="hero-grid relative overflow-hidden bg-navy pt-20 text-white">
      <div className="absolute -right-40 top-28 size-[32rem] rounded-full border border-blue-400/15" />
      <div className="absolute -right-16 top-56 size-72 rounded-full border border-blue-400/15" />
      <Container className="relative grid min-h-[760px] items-center gap-14 py-20 lg:grid-cols-[1.14fr_0.86fr] lg:py-24">
        <div className="pt-6 lg:pt-0">
          <div className="mb-7 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.19em] text-blue-300">
            <span className="h-px w-9 bg-blue-400" />
            {config.hero.eyebrow}
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            {config.hero.title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            {config.hero.description}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#estimator" className="button button-primary">
              {config.hero.primaryCta} <ArrowIcon />
            </a>
            <a href="#pricing" className="button button-outline">
              {config.hero.secondaryCta}
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/15 pt-6 text-sm font-semibold text-slate-300">
            {["Truck included", "Crew included", `${config.pricing.minimumHours}-hour minimum`].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-blue-500/20 text-blue-300"><Icon name="check" className="size-3" /></span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
          <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-blue-500/20" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/25">
            <Image
              src={config.assets.truckImagePath}
              alt={`${config.company.name} moving truck`}
              width={1536}
              height={1024}
              preload
              className="aspect-[4/3] h-auto w-full object-cover object-center sm:aspect-[3/2] lg:aspect-[4/3]"
              sizes="(max-width: 1024px) 90vw, 42vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-6 pb-6 pt-20 sm:px-8 sm:pb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Crew + truck included</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-xl font-bold text-white sm:text-2xl">Moving service from ${config.pricing.crews[0].rate}/hour</p>
                <Icon name="truck" className="size-8 shrink-0 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </Container>
      <div className="bg-blue-600">
        <Container className="flex min-h-20 items-center justify-center py-5 text-center">
          <p className="text-lg font-bold tracking-tight sm:text-xl">{config.company.tagline}</p>
        </Container>
      </div>
    </section>
  );
}

function Services({ config }: HomepageProps) {
  return (
    <section id="services" className="section bg-white">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="What we do" title="Professional help for every part of the move." description="Guidestone brings the truck and moving crew to help get your belongings where they need to go." />
          <p className="max-w-sm border-l-2 border-blue-500 pl-5 text-sm font-medium leading-6 text-slate-500">Moving support for local and regional jobs, with custom arrangements available when needed.</p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {config.services.map((service) => (
            <article key={service.title} className="group bg-white p-7 transition hover:bg-blue-50/60 sm:p-8">
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon name={service.icon} />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-navy">{service.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{service.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Pricing({ config }: HomepageProps) {
  return (
    <section id="pricing" className="section bg-slate-50">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Crew + truck pricing" title="Pick the crew that fits the job." description={config.pricing.billingNote} />
          <div className="max-w-md rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-blue-900">
            {config.pricing.startingPriceNote}
          </div>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {config.pricing.crews.map((crew) => (
            <article key={crew.movers} className={`relative flex min-h-72 flex-col rounded-3xl border p-7 sm:p-8 ${crew.featured ? "border-blue-600 bg-navy text-white shadow-xl shadow-blue-950/15" : "border-slate-200 bg-white text-navy"}`}>
              {crew.featured ? <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-blue-500 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-white">Most popular</span> : null}
              <div className="flex items-center justify-between">
                <Icon name="users" className={`size-8 ${crew.featured ? "text-blue-300" : "text-blue-600"}`} />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Per hour</span>
              </div>
              <h3 className="mt-8 text-2xl font-bold">{crew.movers} movers + truck</h3>
              <p className="mt-2 text-sm text-slate-400">{crew.note}</p>
              <p className="mt-auto pt-8 text-5xl font-extrabold tracking-[-0.045em]">${crew.rate}<span className={`ml-1 text-base font-semibold ${crew.featured ? "text-slate-400" : "text-slate-500"}`}>/hr</span></p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm sm:flex-row sm:items-center">
          <p className="flex items-center gap-3 font-bold text-navy"><Icon name="clock" className="size-5 text-blue-600" /> {config.pricing.minimumHours}-hour minimum on all jobs</p>
          <p className="text-slate-500">Crews of {config.pricing.customQuoteFromMovers} or more require a custom quote. Final cost also depends on travel and specialty items.</p>
        </div>
      </Container>
    </section>
  );
}

function TravelFees({ config }: HomepageProps) {
  return (
    <section className="section bg-white">
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <SectionHeading eyebrow="Travel / mobilization fees" title="Simple mileage. No guesswork." description="Travel / mobilization is calculated using round-trip mileage, so you can see the applicable fee at a glance." />
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Quote required</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{config.specialItems.join(", ")}, and other unusually large or heavy items require a custom quote.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-navy px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 sm:px-8">
            <span>Round-trip mileage</span><span className="text-right">Travel / mobilization</span>
          </div>
          {config.travelFees.map((tier, index) => (
            <div key={tier.mileage} className={`grid grid-cols-2 items-center px-6 py-5 sm:px-8 ${index < config.travelFees.length - 1 ? "border-b border-slate-200" : ""}`}>
              <span className="font-semibold text-slate-700">{tier.mileage}</span>
              <span className="text-right text-xl font-extrabold text-navy">{tier.fee === null ? "Custom quote" : `$${tier.fee}`}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function WhyChooseUs({ config }: HomepageProps) {
  return (
    <section id="why-us" className="section relative overflow-hidden bg-navy text-white">
      <div className="absolute left-0 top-0 h-full w-1/3 bg-blue-600/5" />
      <Container className="relative">
        <SectionHeading eyebrow={`Why ${config.company.shortName}`} title="Moving help you can feel good about." description="A clear, focused service that brings the truck and crew together for a smoother move day." inverse />
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {config.whyChooseUs.map((item, index) => (
            <article key={item.title}>
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div className="grid size-11 place-items-center rounded-xl bg-blue-500 text-white"><Icon name={item.icon} className="size-5" /></div>
                <span className="text-xs font-bold text-slate-500">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function EstimateCta({ config }: HomepageProps) {
  return (
    <section id="estimate" className="bg-blue-600 py-12 text-white sm:py-16">
      <Container className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{config.estimate.title}</h2>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">{config.estimate.description}</p>
        </div>
        <a href="#estimator" className="button button-light shrink-0">{config.estimate.buttonLabel} <ArrowIcon /></a>
      </Container>
    </section>
  );
}

function ServiceArea({ config }: HomepageProps) {
  return (
    <section id="service-area" className="section bg-white">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] bg-navy p-6 text-white sm:p-10">
          <div className="map-grid map-grid-inverse absolute inset-0 opacity-50" />
          <div className="absolute left-1/2 top-[46%] size-[22rem] max-h-[80vw] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/20 bg-blue-500/5" />
          <div className="absolute left-1/2 top-[46%] size-64 max-h-[60vw] max-w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-300/40 bg-blue-500/10" />
          <div className="absolute left-1/2 top-[46%] size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/40 bg-blue-500/15" />
          <div className="absolute left-1/2 top-[46%] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-blue-500 text-white shadow-xl shadow-black/25">
            <Icon name="pin" className="size-7" />
          </div>
          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/15 bg-slate-950/80 p-5 text-center shadow-lg backdrop-blur sm:inset-x-8 sm:bottom-8">
            <p className="text-base font-extrabold uppercase tracking-[0.12em] text-white">{config.serviceArea.visualLocation}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">{config.serviceArea.visualLabel}</p>
            <p className="mt-2 text-sm font-semibold text-slate-300">{config.serviceArea.visualRadius}</p>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow={config.serviceArea.eyebrow} title={config.serviceArea.title} description={config.serviceArea.description} />
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <p className="text-sm font-semibold leading-6 text-slate-600">{config.serviceArea.status}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Testimonials({ config }: HomepageProps) {
  if (config.testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="section bg-slate-50">
      <Container>
        <SectionHeading
          eyebrow="Customer feedback"
          title="What customers are saying."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {config.testimonials.map((testimonial) => (
            <figure key={`${testimonial.name}-${testimonial.quote}`} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              {testimonial.isPlaceholder || testimonial.rating ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {testimonial.isPlaceholder ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-amber-800">
                      Sample testimonial
                    </span>
                  ) : null}
                  {testimonial.rating ? (
                    <p className="text-sm tracking-[0.16em] text-blue-600" aria-label={`${testimonial.rating} out of 5 stars`}>
                      {"★".repeat(Math.round(Math.min(5, Math.max(1, testimonial.rating))))}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <blockquote className="mt-5 text-lg leading-8 text-slate-700">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-5">
                <p className="font-bold text-navy">{testimonial.name}</p>
                {testimonial.source ? <p className="mt-1 text-sm text-slate-500">{testimonial.source}</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Contact({ config }: HomepageProps) {
  return (
    <section id="contact" className="section bg-slate-50">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-navy text-white shadow-xl shadow-slate-900/10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Contact & booking</p>
              <h2 className="mt-5 max-w-xl text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{config.contact.title}</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{config.contact.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href={config.contact.phoneHref} className="button button-primary"><Icon name="phone" className="size-5" /> Call to get started</a>
                <a href={config.contact.emailHref} className="button button-outline"><Icon name="mail" className="size-5" /> Send an email</a>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/5 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Contact details</p>
              <dl className="mt-7 space-y-6">
                <div className="border-b border-white/10 pb-6">
                  <dt className="text-xs font-semibold text-slate-400">Phone</dt>
                  <dd className="mt-2 font-bold"><a href={config.contact.phoneHref} className="transition hover:text-blue-300">{config.contact.phoneLabel}</a></dd>
                </div>
                <div className="border-b border-white/10 pb-6">
                  <dt className="text-xs font-semibold text-slate-400">Email</dt>
                  <dd className="mt-2 break-all font-bold"><a href={config.contact.emailHref} className="transition hover:text-blue-300">{config.contact.emailLabel}</a></dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400">Availability</dt>
                  <dd className="mt-2 font-bold">{config.contact.availability}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer({ config }: HomepageProps) {
  return (
    <footer className="border-t border-white/10 bg-navy py-10 text-white">
      <Container>
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Image src={config.assets.logoPath} alt={`${config.company.name} logo`} width={1536} height={1024} className="h-16 w-24 object-cover object-center" sizes="96px" />
            <div><p className="font-bold">{config.company.name}</p><p className="mt-1 max-w-sm text-xs text-slate-400">{config.company.description}</p></div>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
            {navItems.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-400 transition hover:text-white">{item.label}</a>)}
            <a href="#contact" className="text-sm font-semibold text-slate-400 transition hover:text-white">Contact</a>
          </nav>
        </div>
        <div className="mt-9 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {config.company.legalName}. All rights reserved.</p>
          <p>Professional moving crew + truck service</p>
        </div>
      </Container>
    </footer>
  );
}

export function Homepage({ config }: HomepageProps) {
  return (
    <BookingFlowProvider>
      <Header config={config} />
      <main>
        <Hero config={config} />
        <Services config={config} />
        <Pricing config={config} />
        <MovingCostEstimator
          serviceTypes={config.serviceTypes}
          defaultServiceTypeId={config.defaultServiceTypeId}
          estimator={config.estimator}
        />
        <TravelFees config={config} />
        <WhyChooseUs config={config} />
        <EstimateCta config={config} />
        <ServiceArea config={config} />
        <BookingRequestSection
          company={config.company}
          settings={config.bookingSettings}
          serviceTypes={config.serviceTypes}
        />
        <Testimonials config={config} />
        <Contact config={config} />
      </main>
      <Footer config={config} />
    </BookingFlowProvider>
  );
}
