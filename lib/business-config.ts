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

export type BusinessConfig = {
  company: {
    name: string;
    shortName: string;
    legalName: string;
    tagline: string;
    description: string;
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
  pricing: {
    crews: Array<{
      movers: number;
      rate: number;
      note: string;
      featured?: boolean;
    }>;
    additionalMoverRate: number;
    minimumHours: number;
    billingNote: string;
  };
  travelFees: Array<{
    minMiles: number;
    maxMiles: number;
    mileage: string;
    fee: number;
  }>;
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
  };
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

export const businessConfig = {
  company: {
    name: "Guidestone Moving Co",
    shortName: "Guidestone",
    legalName: "Guidestone Moving Co LLC",
    tagline: "Moving You Forward. Every Step of the Way.",
    description: "Professional labor-only moving services.",
  },
  hero: {
    eyebrow: "Labor-only moving help",
    title: "You Rent the Truck. We Handle the Heavy Work.",
    description:
      "A dependable moving crew for loading, unloading, rearranging, and the heavy lifting in between.",
    primaryCta: "Request an estimate",
    secondaryCta: "View crew pricing",
  },
  services: [
    {
      title: "Trucks & trailers",
      description: "Careful loading and unloading to make the most of your space.",
      icon: "truck",
    },
    {
      title: "Storage containers",
      description: "Organized help with portable and stationary storage units.",
      icon: "container",
    },
    {
      title: "Furniture rearranging",
      description: "Refresh a room or move furniture exactly where it needs to go.",
      icon: "sofa",
    },
    {
      title: "In-home moves",
      description: "Move items between rooms, floors, or areas within a building.",
      icon: "home",
    },
    {
      title: "Heavy lifting",
      description: "Extra muscle for bulky, awkward, and difficult household items.",
      icon: "weight",
    },
    {
      title: "Stairs & long carries",
      description: "Reliable help when the route takes extra effort and coordination.",
      icon: "stairs",
    },
  ],
  pricing: {
    crews: [
      { movers: 2, rate: 125, note: "Great for apartments & smaller moves" },
      {
        movers: 3,
        rate: 165,
        note: "Our most versatile crew size",
        featured: true,
      },
      { movers: 4, rate: 205, note: "Built for larger, faster moves" },
    ],
    additionalMoverRate: 40,
    minimumHours: 2,
    billingNote: "Rates are for the entire crew, not per person.",
  },
  travelFees: [
    { minMiles: 0, maxMiles: 15, mileage: "0–15 miles", fee: 0 },
    { minMiles: 16, maxMiles: 30, mileage: "16–30 miles", fee: 35 },
    { minMiles: 31, maxMiles: 45, mileage: "31–45 miles", fee: 60 },
    { minMiles: 46, maxMiles: 60, mileage: "46–60 miles", fee: 85 },
  ],
  specialItems: ["Pianos", "Gun safes", "Very large or heavy items"],
  estimator: {
    eyebrow: "Moving cost estimator",
    title: "Build a quick move-day estimate.",
    description:
      "Choose your crew, estimated time, and round-trip mileage for an instant base estimate.",
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
      "Scheduling times are temporary request windows and are not guaranteed until confirmed.",
  },
  whyChooseUs: [
    {
      title: "Straightforward pricing",
      description: "Clear crew rates and mileage-based travel fees before the work begins.",
      icon: "check",
    },
    {
      title: "The right crew",
      description: "Choose the crew size that fits your move, your timeline, and your space.",
      icon: "users",
    },
    {
      title: "Careful, capable help",
      description: "Focused moving labor for the hard work that move day demands.",
      icon: "shield",
    },
    {
      title: "Your schedule matters",
      description: "A professional team committed to keeping your move moving forward.",
      icon: "clock",
    },
  ],
  estimate: {
    title: "Know what your move needs?",
    description:
      "Tell us about your truck, crew size, location, and any specialty items. We’ll help you plan the labor.",
    buttonLabel: "Get a moving estimate",
  },
  serviceArea: {
    eyebrow: "Service area",
    title: "Local help for moves in your area.",
    description:
      "Travel fees are based on round-trip mileage. Share your locations when requesting an estimate and we’ll confirm availability and any applicable fee.",
    status: "Specific cities and coverage details coming soon.",
  },
  contact: {
    title: "Ready to line up your moving crew?",
    description:
      "Reach out with your move date, locations, and the kind of help you need. We’ll take it from there.",
    phoneLabel: "Phone number coming soon",
    phoneHref: "#contact",
    emailLabel: "Email address coming soon",
    emailHref: "#contact",
    availability: "Scheduling details coming soon",
  },
} satisfies BusinessConfig;
