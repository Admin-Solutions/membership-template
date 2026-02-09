// Development data loader
// Reads from .env.development (VITE_* variables) to simulate
// what the production server injects via window.eventInfo and window.__BOOTSTRAP__

declare global {
  interface Window {
    __BOOTSTRAP__?: {
      WTOB_GUID?: string;
      WALLET_OWNER_GUID?: string;
      IS_DEVELOPMENT?: boolean;
      [key: string]: unknown;
    };
  }
}

// Helper: read env var with fallback
const env = (key: string, fallback = "") =>
  import.meta.env[key] ?? fallback;

// Build eventInfo from env vars + static asset data
export const mockEventInfo = {
  AttendeeWalletGUID: env("VITE_ATTENDEE_WALLET_GUID"),
  EventNexusGUID: env("VITE_EVENT_NEXUS_GUID"),
  Attendee: {
    ProfileTitle: env("VITE_ATTENDEE_NAME"),
    ProfileText: env("VITE_ATTENDEE_PROFILE_TEXT"),
    ProfileExpandedText: "Charlie is a US Army Veteran.  With many years of business, SEO, database and programming experience, he continues to develop new technologies and marketing methods.",
    ProfileImage: env("VITE_ATTENDEE_PROFILE_IMAGE"),
    LastFirstName: env("VITE_ATTENDEE_LAST_FIRST"),
  },
  Event: {
    EventProfileTitle: env("VITE_EVENT_TITLE"),
    EventProfileText: "",
    EventProfileExpandedText:
      "The Black Hole is more than just a fan club \u2014 it\u2019s a lifetime membership into Raider Nation\u2019s most dedicated, die-hard family. Since its founding in 1995, the Black Hole has grown from a rowdy stadium section into a global community with 35 chapters.",
    EventProfileImage: env("VITE_EVENT_PROFILE_IMAGE"),
    EventWalletBackgroundImage: null,
    EventMapChitAuthority: null,
  },
  NFTToken: {
    NFTTokenTitle: env("VITE_ATTENDEE_NAME"),
    NFTTokenText: "Associate Member The Black Hole National",
    NFTTokenExpandedText: `${env("VITE_ATTENDEE_NAME")} - Associate Member The Black Hole National`,
    NFTTokenSerialNumber: 0,
  },
  EventNFTToken: {
    EventNFTTokenTitle: "The Black Hole Membership",
    EventNFTTokenText: "National",
    EventNFTTokenExpandedText:
      "The Black Hole National Membership Event Event Chit Designator",
    EventNFTTokenSerialNumber: -1,
  },
  NFT: {
    NFTTitle: "Member | The Black Hole",
    NFTText: "Member | The Black Hole",
    NFTExpandedText: "Member | The Black Hole",
  },
  Assets: {
    NFTInfo: {
      NFTTitle: null,
      NFTCardFileURL: null,
      RarityTypeName: null,
      CategoryTypeName: null,
      TokenTitle: null,
      NFTTokenCardImageTitle: null,
      NFTTokenCardFileURL: null,
      NFTTokenCardImageDescription: null,
      NFTTokenCardImageAltTag: null,
    },
    NFTOwnerships: [],
    NFTAssets: [],
    NFTTokenAssets: [
      {
        URL: "https://image.admin.solutions/ui-flag---cm_8e027072-a228-40f9-a8af-9bffdd21a6d3/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/8e027072-a228-40f9-a8af-9bffdd21a6d3",
        OnPageText: "UI Flag - CM",
        OnPageTitle: "UI Flag - CM",
        OnPageExpandedText: "UI Flag - CM",
        AltTag: "UI Flag - CM",
        Title: "UI Flag - CM",
        Description: "UI Flag - CM",
        MediaType: "UI Flag - CM",
        MapLocation: "",
        CategoryTypeMedia: "732811",
        OrigAuxId: "132776",
      },
      {
        URL: "https://image.admin.solutions/left-side-graphic_be0e2b6a-8b6b-45f3-ae4e-10c35a433f54/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/be0e2b6a-8b6b-45f3-ae4e-10c35a433f54",
        OnPageText: "Left Side Graphic",
        OnPageTitle: "Left Side Graphic",
        OnPageExpandedText: "Left Side Graphic",
        AltTag: "Left Side Graphic",
        Title: "Left Side Graphic",
        Description: "Left Side Graphic",
        MediaType: "Graphic Left Side",
        MapLocation: "",
        CategoryTypeMedia: "538938",
        OrigAuxId: "132777",
      },
      {
        URL: "https://image.admin.solutions/marketing-video_8e9fe6aa-e0e6-4fa2-8ed3-b49ca5a4e315/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/8e9fe6aa-e0e6-4fa2-8ed3-b49ca5a4e315",
        OnPageText: "Marketing Video",
        OnPageTitle: "Marketing Video",
        OnPageExpandedText: "Marketing Video",
        AltTag: "Marketing Video",
        Title: "Marketing Video",
        Description: "Marketing Video",
        MediaType: "Marketing Video",
        MapLocation: "",
        CategoryTypeMedia: "535592",
        OrigAuxId: "132782",
      },
      {
        URL: "https://image.admin.solutions/panel-topic_012b342c-5d11-4b4d-8efd-7af53911b511/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/0d779e49-75c5-4068-8791-789725098349",
        OnPageText: "Panel Topic",
        OnPageTitle: "Panel Topic",
        OnPageExpandedText: `<div class="text-center">   <p>Get Exclusive Members-Only Discounts On Merch and Travel, VIP Event Access, and More. Built By The Fans, For The Fans \u2014 Because No One Reps Raider Nation Like We Do.</p>   <hr>   <h5>     Why join? Because being a Black Hole member means you\u2019re unstoppable:   </h5>    <ul style="list-style-type:none; padding:0; margin-bottom:30px;">     <li style="margin-bottom:15px;">       <strong style="color:#ffffff;">Exclusive access & deals:</strong> 20% off everything in the official store, members-only merch drops, and priority event tickets.     </li>      <li style="margin-bottom:15px;">       <strong style="color:#ffffff;">Epic perks:</strong> Early invites to tailgates, watch parties, chapters worldwide, and game-day travel packages.     </li>      <li style="margin-bottom:15px;">       <strong style="color:#ffffff;">Collector swag:</strong> From T-shirts and patches to signed hats, tumblers, and varsity jackets \u2014 show off your allegiance in style.     </li>      <li style="margin-bottom:15px;">       <strong style="color:#ffffff;">Worldwide community:</strong> 35  chapters strong, connecting you with fans who share your passion for Raider Nation energy.     </li>    </ul>    <p style="font-size:18px; margin-bottom:15px;">     This isn\u2019t for the casual fan. It\u2019s for the fearless, the relentless, the ones who make the Black Hole legendary.   </p>   <p style="font-size:18px; font-weight:bold; color:#ffffff;">     Once a member, always a member. Step up. Stand proud. Join The Black Hole today \u2014 and become a part of Raider history.   </p>    <hr>   <hr>   <h5>Membership Terms & Conditions</h5> <div style="font-size: 13px;">   <p>All membership purchases are final. Memberships are non-refundable and non-exchangeable.</p>   <p>Membership benefits and events will proceed as scheduled unless otherwise announced by The Black Hole organization.</p>   <p>Programs, perks, and events are subject to change without prior notice.</p>   <p>Memberships are non-transferable unless approved by The Black Hole organization.</p>   <p>Access to events and benefits is subject to organizational policies and capacity limits.</p>   <p>The Black Hole organization is not responsible for personal injury, lost items, or unforeseen changes to membership perks or events.</p>   <p>Use of this membership implies acceptance of these terms.</p> </div>`,
        AltTag: "Panel Topic",
        Title: "Panel Topic",
        Description: "Panel Topic",
        MediaType: "Panel Topic",
        MapLocation: "",
        CategoryTypeMedia: "534112",
        OrigAuxId: "132778",
      },
      {
        URL: "https://image.admin.solutions/membership-napp-background-video_374dfe69-d417-4745-8b06-16fe0eabee9d/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/b26de4e0-e44d-4174-8ab0-00bcbf73a536",
        OnPageText: "Membership Napp Background Video",
        OnPageTitle: "Membership Napp Background Video",
        OnPageExpandedText: "Membership Napp Background Video",
        AltTag: "Membership Napp Background Video",
        Title: "Membership Napp Background Video",
        Description: "Membership Napp Background Video",
        MediaType: "Event Video",
        MapLocation: "",
        CategoryTypeMedia: "535648",
        OrigAuxId: "132781",
      },
      {
        URL: "https://image.admin.solutions/event-page-background-video_72f374d8-660d-4ccc-ab02-2376426b8c4b/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/fbea6489-a7f4-45c2-8d77-bb046044a8be",
        OnPageText: "Event Page Background Video",
        OnPageTitle: "Event Page Background Video",
        OnPageExpandedText: "Event Page Background Video",
        AltTag: "Event Page Background Video",
        Title: "Event Page Background Video",
        Description: "Event Page Background Video",
        MediaType: "CTAS Background Video",
        MapLocation: "",
        CategoryTypeMedia: "706271",
        OrigAuxId: "132771",
      },
      {
        URL: "https://image.admin.solutions/logo_c9f5433-c4ca-4292-a723-6bce77e26e3f/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/b8cd8859-d771-4303-a1ae-18c72d0a93a7",
        OnPageText: "Logo",
        OnPageTitle: "Logo",
        OnPageExpandedText: "Logo",
        AltTag: "Logo",
        Title: "Logo",
        Description: "Logo",
        MediaType: "Logo",
        MapLocation: "",
        CategoryTypeMedia: "531524",
        OrigAuxId: "132770",
      },
    ],
  },
};

// Build __BOOTSTRAP__ from env vars
export const mockBootstrap = {
  frameNonce: "dev-nonce",
  IS_DEVELOPMENT: true,
  PAGE_MONKEY_CODE_COOKIE: "",
  USER_ACCESS_TOKEN: env("VITE_USER_ACCESS_TOKEN"),
  IS_AUTHORIZED_USER: env("VITE_IS_AUTHORIZED_USER") === "true",
  WALLET_OWNER_GUID: env("VITE_ATTENDEE_WALLET_GUID"),
  WALLET_NAME_USER: env("VITE_ATTENDEE_NAME"),
  ENTITY_AUTH_USER: env("VITE_ENTITY_AUTH_USER"),
  DIRTY_AUTH_USER: env("VITE_DIRTY_AUTH_USER"),
  OWNED_BY_USER: env("VITE_OWNED_BY_USER") === "true",
  CUSTODY_TIME_FRAME: env("VITE_CUSTODY_TIME_FRAME", "Current"),
  HOW_OWNED: env("VITE_HOW_OWNED", "Lend Sell"),
  WTOB_GUID: env("VITE_WTOB_GUID"),
  WALLET_BEING_VIEWED_CUSTODY_TIME_FRAME: env("VITE_CUSTODY_TIME_FRAME", "Current"),
  WALLET_BEING_VIEWED_CUSTODY_TYPE: env("VITE_HOW_OWNED", "Lend Sell"),
  WALLET_BEING_VIEWED_WTOB_GUID: env("VITE_WTOB_GUID"),
  WALLET_LOGGED_INTO: env("VITE_ATTENDEE_WALLET_GUID"),
  WALLET_LOGGED_INTO_USER_NAME: env("VITE_ATTENDEE_NAME"),
  WALLET_LOGGED_INTO_VALID_LOG_IN: env("VITE_IS_AUTHORIZED_USER") === "true",
  WALLET_LOGGED_INTO_ENTITY_AUTH: env("VITE_WALLET_LOGGED_INTO_ENTITY_AUTH"),
  WALLET_LOGGED_INTO_WALLET_AUTH: env("VITE_WALLET_LOGGED_INTO_WALLET_AUTH"),
};

// Initialize mock data in development
export function initDevData() {
  if (import.meta.env.DEV) {
    // Only set if not already present (production server sets it)
    if (!window.eventInfo) {
      window.eventInfo = mockEventInfo;
    }
    if (!window.__BOOTSTRAP__) {
      window.__BOOTSTRAP__ = mockBootstrap;
    }
  }
}
