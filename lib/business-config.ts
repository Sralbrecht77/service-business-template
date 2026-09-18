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
    { movers: 2, rate: 125, note: "Crew and moving truck included" },
    {
      movers: 3,
      rate: 165,
      note: "Crew and moving truck included",
      featured: true,
    },
    { movers: 4, rate: 205, note: "Crew and moving truck included" },
  ],
  additionalMoverRate: 40,
  minimumHours: 2,
  billingNote: "Hourly rates include the selected moving crew and truck.",
  startingPriceNote:
    "A 2-mover job starts at $250 before travel / mobilization and specialty charges.",
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
    description: "Professional moving services with the crew and truck included.",
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
    secondaryCta: "View crew + truck pricing",
  },
  services: [
    {
      title: "Truck + moving crew",
      description: "A coordinated crew and moving truck for your move from start to finish.",
      icon: "truck",
    },
    {
      title: "Local & regional moves",
      description: "Moving help for nearby and regional jobs, subject to availability and travel arrangements.",
      icon: "container",
    },
    {
      title: "Loading & unloading",
      description: "Careful loading and unloading to keep move day organized and efficient.",
      icon: "sofa",
    },
    {
      title: "In-home moves",
      description: "Move items between rooms, floors, or areas within a building.",
      icon: "home",
    },
    {
      title: "Heavy lifting",
      description: "Moving help for bulky, awkward, and difficult household items, with review when needed.",
      icon: "weight",
    },
    {
      title: "Stairs & long carries",
      description: "Plan for routes that require extra time, effort, and coordination.",
      icon: "stairs",
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
  whyChooseUs: [
    {
      title: "Straightforward pricing",
      description: "Clear crew + truck rates and mileage-based mobilization fees before the work begins.",
      icon: "check",
    },
    {
      title: "The right crew",
      description: "Choose a confirmed crew size that fits your move, timeline, and space.",
      icon: "users",
    },
    {
      title: "Truck included",
      description: "Guidestone provides the moving truck along with your selected crew.",
      icon: "truck",
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
      "Tell us your preferred crew size, move locations, mileage, and any specialty items. We’ll help you plan the truck and crew.",
    buttonLabel: "Get a moving estimate",
  },
  serviceArea: {
    eyebrow: "Service area",
    title: "Based around Wayne County.",
    description:
      "Our primary service area is approximately a 60-mile radius around Wayne County. Moves outside that area may be available depending on the job and require confirmation or custom arrangements.",
    status:
      "Travel / mobilization pricing extends through 75 miles. Longer-distance requests require a custom quote.",
    visualLocation: "Wayne County",
    visualLabel: "Primary service area",
    visualRadius: "Approx. 60-mile radius",
  },
  testimonials: [
    {
      name: "Test Customer One",
      quote:
        "The sample moving crew was friendly, careful, and easy to coordinate with from start to finish.",
      source: "Development demo — crew experience",
      rating: 5,
      isPlaceholder: true,
    },
    {
      name: "Test Customer Two",
      quote: "The sample booking experience was simple and clear.",
      source: "Development demo — booking experience",
      rating: 4,
      isPlaceholder: true,
    },
    {
      name: "Test Customer Three",
      quote:
        "For this layout test, the sample team took time with the furniture, handled each piece carefully, and kept the move organized throughout the day.",
      source: "Development demo — furniture handling",
      rating: 5,
      isPlaceholder: true,
    },
  ],
  contact: {
    title: "Ready to line up your truck and moving crew?",
    description:
      "Reach out with your move date, locations, and the kind of help you need. We’ll review the details with you.",
    phoneLabel: "606-624-5407",
    phoneHref: "tel:+16066245407",
    emailLabel: "guidestonemovingco@gmail.com",
    emailHref: "mailto:guidestonemovingco@gmail.com",
    availability: "Move dates and start times are confirmed after request review.",
  },
} satisfies BusinessConfig;
