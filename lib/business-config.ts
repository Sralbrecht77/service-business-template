export type IconName =
  | "truck"
  | "container"
  | "sofa"
  | "home"
  | "weight"
  | "stairs"
  | "shield"
  | "clock"
  | "users"
  | "check"
  | "pin"
  | "phone"
  | "mail";

export const serviceTypeIds = ["movers_and_truck", "crew_only"] as const;

export type ServiceTypeId = (typeof serviceTypeIds)[number];

export type CrewPricingConfig = {
  crews: Array<{
    movers: number;
    rate: number;
    note: string;
    featured?: boolean;
  }>;
  additionalMoverRate?: number;
  customQuoteFromMovers?: number;
  minimumHours: number;
  billingNote: string;
  startingPriceNote: string;
};

export type TravelFeeConfig = {
  minMiles: number;
  maxMiles: number | null;
  mileage: string;
  fee: number | null;
};

export type ServiceTypeConfig = {
  id: ServiceTypeId;
  label: string;
  description: string;
  enabled: boolean;
  crewSizes: number[];
  pricingMode: "hourly" | "custom_quote";
  pricing: CrewPricingConfig | null;
  travelFees: TravelFeeConfig[] | null;
  customQuoteMessage: string;
};

export type BusinessConfig = {
  company: {
    name: string;
    shortName: string;
    legalName: string;
    tagline: string;
    description: string;
  };
  assets: {
    logoPath: string;
    truckImagePath: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  services: Array<{
    title: string;
    description: string;
    icon: IconName;
  }>;
  pricing: CrewPricingConfig;
  travelFees: TravelFeeConfig[];
  serviceTypes: ServiceTypeConfig[];
  defaultServiceTypeId: ServiceTypeId;
  specialItems: string[];
  estimator: {
    eyebrow: string;
    title: string;
    description: string;
    maxCrewSize: number;
    maxHours: number;
    hourStep: number;
    details: Array<{
      id: "piano" | "gunSafe" | "heavyItem" | "stairs" | "longCarry";
      label: string;
      note: string;
      requiresQuote: boolean;
    }>;
    disclaimer: string;
    continueLabel: string;
  };
  bookingSettings: {
    timeZone: string;
    bookableWeekdays: number[];
    minimumAdvanceDays: number;
    maximumDaysAhead: number;
    startTimes: Array<{
      value: string;
      label: string;
    }>;
    temporaryDefaultsNotice: string;
  };
  bookingUploads: {
    enabled: boolean;
    bucket: string;
    maxFiles: number;
    maxFileSizeBytes: number;
    acceptedMimeTypes: string[];
  };
  terms: {
    href: string;
    version: string;
    lastUpdated: string;
  };
  whyChooseUs: Array<{
    title: string;
    description: string;
    icon: IconName;
  }>;
  estimate: {
    title: string;
    description: string;
    buttonLabel: string;
  };
  serviceArea: {
    eyebrow: string;
    title: string;
    description: string;
    status: string;
    visualLocation: string;
    visualLabel: string;
    visualRadius: string;
  };
  testimonials: Array<{
    name: string;
    quote: string;
    source?: string;
    rating?: number;
    isPlaceholder?: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  reviewUrl: string | null;
  contact: {
    title: string;
    description: string;
    phoneLabel: string;
    phoneHref: string;
    emailLabel: string;
    emailHref: string;
    availability: string;
  };
};

const moversAndTruckPricing: CrewPricingConfig = {
  crews: [
    { movers: 2, rate: 125, note: "Hourly crew rate" },
    {
      movers: 3,
      rate: 165,
      note: "Hourly crew rate",
      featured: true,
    },
    { movers: 4, rate: 205, note: "Hourly crew rate" },
  ],
  additionalMoverRate: 40,
  minimumHours: 2,
  billingNote:
    "The same hourly crew rates apply to Movers + Truck and Crew Only. Travel fees vary by service type.",
  startingPriceNote:
    "A 2-mover job starts at $250 before travel and any specialty charges.",
};

const crewOnlyPricing: CrewPricingConfig = {
  ...moversAndTruckPricing,
  crews: moversAndTruckPricing.crews.map((crew) => ({
    ...crew,
    note: "Moving crew; customer provides transportation",
  })),
  billingNote:
    "Hourly rates include the selected moving crew. The customer provides transportation.",
  startingPriceNote:
    "A 2-mover Crew Only job starts at $250 before travel and specialty charges.",
};

const moversAndTruckTravelFees: TravelFeeConfig[] = [
  { minMiles: 0, maxMiles: 15, mileage: "0–15 miles", fee: 50 },
  { minMiles: 16, maxMiles: 30, mileage: "16–30 miles", fee: 75 },
  { minMiles: 31, maxMiles: 50, mileage: "31–50 miles", fee: 125 },
  { minMiles: 51, maxMiles: 75, mileage: "51–75 miles", fee: 175 },
  { minMiles: 76, maxMiles: null, mileage: "More than 75 miles", fee: null },
];

const crewOnlyTravelFees: TravelFeeConfig[] = [
  { minMiles: 0, maxMiles: 15, mileage: "0–15 miles", fee: 0 },
  { minMiles: 16, maxMiles: 30, mileage: "16–30 miles", fee: 35 },
  { minMiles: 31, maxMiles: 45, mileage: "31–45 miles", fee: 60 },
  { minMiles: 46, maxMiles: 60, mileage: "46–60 miles", fee: 85 },
  { minMiles: 61, maxMiles: null, mileage: "More than 60 miles", fee: null },
];

const serviceTypes: ServiceTypeConfig[] = [
  {
    id: "movers_and_truck",
    label: "Movers + Truck",
    description: "Guidestone provides the moving crew and truck.",
    enabled: true,
    crewSizes: [2, 3, 4, 5, 6, 7, 8],
    pricingMode: "hourly",
    pricing: moversAndTruckPricing,
    travelFees: moversAndTruckTravelFees,
    customQuoteMessage:
      "Some move details require review before final pricing can be confirmed.",
  },
  {
    id: "crew_only",
    label: "Crew Only",
    description:
      "You provide the truck, trailer, POD, or container. Guidestone provides the moving crew.",
    enabled: true,
    crewSizes: [2, 3, 4, 5, 6, 7, 8],
    pricingMode: "hourly",
    pricing: crewOnlyPricing,
    travelFees: crewOnlyTravelFees,
    customQuoteMessage:
      "Crew Only rates and travel fees are calculated separately from Movers + Truck pricing.",
  },
];

export const businessConfig = {
  company: {
    name: "Guidestone Moving Co LLC",
    shortName: "Guidestone",
    legalName: "Guidestone Moving Co LLC",
    tagline: "Moving You Forward. Every Step of the Way.",
    description: "Professional Movers + Truck and Crew Only moving services.",
  },
  assets: {
    logoPath: "/guidestone-logo.png",
    truckImagePath: "/guidestone-truck.png",
  },
  hero: {
    eyebrow: "Professional moving services",
    title: "Your Move. Our Truck and Crew.",
    description:
      "Guidestone brings the moving truck and a capable crew for local and regional moves, with straightforward hourly pricing.",
    primaryCta: "Request an estimate",
    secondaryCta: "View crew pricing",
  },
  services: [
    {
      title: "Movers + Truck",
      description: "A coordinated moving crew and Guidestone truck for your move from start to finish.",
      icon: "truck",
    },
    {
      title: "Crew Only",
      description: "Professional moving help when you already have a truck, trailer, POD, or container.",
      icon: "users",
    },
    {
      title: "Loading, unloading & in-home moves",
      description: "Organized help at either end of a move or between rooms, floors, and areas in a building.",
      icon: "sofa",
    },
    {
      title: "Local, regional & specialty help",
      description: "Support for nearby and regional jobs, including stairs, long carries, and heavy items that may need review.",
      icon: "weight",
    },
  ],
  pricing: moversAndTruckPricing,
  travelFees: moversAndTruckTravelFees,
  serviceTypes,
  defaultServiceTypeId: "movers_and_truck",
  specialItems: ["Pianos", "Gun safes", "Very large or heavy items"],
  estimator: {
    eyebrow: "Moving cost estimator",
    title: "Build a quick move-day estimate.",
    description:
      "Choose the kind of moving help you need, your crew size, estimated time, and round-trip mileage.",
    maxCrewSize: 8,
    maxHours: 24,
    hourStep: 0.5,
    details: [
      {
        id: "piano",
        label: "Piano",
        note: "Additional pricing requires a quote.",
        requiresQuote: true,
      },
      {
        id: "gunSafe",
        label: "Gun safe",
        note: "Additional pricing requires a quote.",
        requiresQuote: true,
      },
      {
        id: "heavyItem",
        label: "Very large/heavy item",
        note: "Additional pricing requires a quote.",
        requiresQuote: true,
      },
      {
        id: "stairs",
        label: "Excessive stairs",
        note: "Additional labor charges may apply.",
        requiresQuote: false,
      },
      {
        id: "longCarry",
        label: "Long carry",
        note: "Additional labor charges may apply.",
        requiresQuote: false,
      },
    ],
    disclaimer:
      "This is an estimate only. Your final total may change based on actual time, access, item details, and move conditions.",
    continueLabel: "Continue to Schedule",
  },
  // Temporary scheduling defaults. Confirm these with the business owner before launch.
  bookingSettings: {
    timeZone: "America/New_York",
    bookableWeekdays: [1, 2, 3, 4, 5, 6],
    minimumAdvanceDays: 1,
    maximumDaysAhead: 90,
    startTimes: [
      { value: "08:00", label: "8:00 AM" },
      { value: "09:00", label: "9:00 AM" },
      { value: "10:00", label: "10:00 AM" },
      { value: "12:00", label: "12:00 PM" },
      { value: "14:00", label: "2:00 PM" },
    ],
    temporaryDefaultsNotice:
      "Scheduling times are request windows and are not guaranteed until confirmed.",
  },
  bookingUploads: {
    enabled: true,
    bucket: "booking-photos",
    maxFiles: 5,
    maxFileSizeBytes: 5 * 1024 * 1024,
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  terms: {
    href: "/terms",
    version: "2026-09-18",
    lastUpdated: "September 18, 2026",
  },
  whyChooseUs: [
    {
      title: "Straightforward pricing",
      description: "Clear hourly crew rates with travel fees shown for each service option before you continue.",
      icon: "check",
    },
    {
      title: "The right crew",
      description: "Choose a confirmed crew size that fits your move, timeline, and space.",
      icon: "users",
    },
    {
      title: "Flexible service options",
      description: "Choose Movers + Truck for the complete setup, or Crew Only when transportation is already arranged.",
      icon: "users",
    },
    {
      title: "Your schedule matters",
      description: "Request the move date and start window that work best for your plans.",
      icon: "clock",
    },
  ],
  estimate: {
    title: "Ready to plan your move?",
    description:
      "Tell us your preferred service, crew size, mileage, and any specialty items. We’ll help you plan the next step.",
    buttonLabel: "Get a moving estimate",
  },
  serviceArea: {
    eyebrow: "Service area",
    title: "Based around Wayne County.",
    description:
      "Our primary service area is approximately a 60-mile radius around Wayne County. Moves outside that area may be available depending on the job and require confirmation or custom arrangements.",
    status:
      "Movers + Truck travel tiers extend through 75 miles; Crew Only travel tiers extend through 60 miles. Longer-distance requests require a custom quote.",
    visualLocation: "Wayne County",
    visualLabel: "Primary service area",
    visualRadius: "Approx. 60-mile radius",
  },
  testimonials: [],
  faqs: [
    {
      question: "Do you provide the truck?",
      answer:
        "Yes. Choose Movers + Truck when you want Guidestone to provide both the moving crew and truck.",
    },
    {
      question: "Can I hire just the moving crew?",
      answer:
        "Yes. Choose Crew Only when you are providing the truck, trailer, POD, or container and need Guidestone to provide the moving crew.",
    },
    {
      question: "Is there a minimum number of hours?",
      answer: "Both Movers + Truck and Crew Only have a 2-hour minimum.",
    },
    {
      question: "How are travel or mobilization fees calculated?",
      answer:
        "Travel pricing is based on the round-trip mileage entered in the estimator. Movers + Truck and Crew Only use separate mileage schedules, which are applied automatically when you select a service type.",
    },
    {
      question: "How far does Guidestone travel?",
      answer:
        "Guidestone's primary service area is approximately a 60-mile radius around Wayne County. Longer-distance requests may be available but can require confirmation or a custom quote.",
    },
    {
      question: "Can Guidestone handle safes, pianos, or unusually heavy items?",
      answer:
        "Include those items in your estimate and booking request. Pianos, gun safes, and very large or heavy items require review and custom pricing.",
    },
    {
      question: "Is the website estimate the guaranteed final price?",
      answer:
        "No. The website provides an estimate. Final pricing can change based on actual time, access, item details, mileage, and move conditions.",
    },
    {
      question: "What information should I provide when booking?",
      answer:
        "Provide your preferred date and start time, full FROM and TO addresses, service type, crew and time estimate, round-trip mileage, access details, specialty items, and any optional photos that may help Guidestone review the move.",
    },
  ],
  reviewUrl: null,
  contact: {
    title: "Ready to plan your move?",
    description:
      "Reach out with your move date, locations, and the kind of help you need. We’ll review the details with you.",
    phoneLabel: "606-624-5407",
    phoneHref: "tel:6066245407",
    emailLabel: "guidestonemovingco@gmail.com",
    emailHref: "mailto:guidestonemovingco@gmail.com",
    availability: "Move dates and start times are confirmed after request review.",
  },
} satisfies BusinessConfig;
