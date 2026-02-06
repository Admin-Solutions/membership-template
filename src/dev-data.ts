// Mock data for local development
// This simulates what the production server injects via window.eventInfo

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

export const mockEventInfo = {
  AttendeeWalletGUID: "3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8",
  EventNexusGUID: "89026528-2e97-4019-b2b4-73bb9fb49866",
  Attendee: {
    ProfileTitle: "Charlie Raffay",
    ProfileText: "Wallet Profile Image",
    ProfileExpandedText: "Charlie is a US Army Veteran.  With many years of business, SEO, database and programming experience, he continues to develop new technologies and marketing methods.",
    ProfileImage: "https://image.admin.solutions/wallet-profile-image_c27ae511-a43c-49f2-bbaf-6747ca8fab26/ed30b0de-c4fb-4edf-984c-c0e4be94e69c/3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8/9c816db5-9a95-41ad-ab4e-f345ca2581ae",
    LastFirstName: "Charles Raffay"
  },
  Event: {
    EventProfileTitle: "The Black Hole National Membership",
    EventProfileText: "",
    EventProfileExpandedText: "The Black Hole is more than just a fan club — it's a lifetime membership into Raider Nation's most dedicated, die-hard family. Since its founding in 1995, the Black Hole has grown from a rowdy stadium section into a global community with 35 chapters.",
    EventProfileImage: "https://image.admin.solutions/wallet-profile-image_7fa45f6e-bc98-4525-a0bc-16282941bd96/ed30b0de-c4fb-4edf-984c-c0e4be94e69c/89026528-2e97-4019-b2b4-73bb9fb49866/c05c770a-a077-4832-81a7-ffcc93605c3b",
    EventWalletBackgroundImage: null,
    EventMapChitAuthority: null
  },
  NFTToken: {
    NFTTokenTitle: "Charlie Raffay",
    NFTTokenText: "Associate Member The Black Hole National",
    NFTTokenExpandedText: "Charlie Raffay - Associate Member The Black Hole National",
    NFTTokenSerialNumber: 0
  },
  EventNFTToken: {
    EventNFTTokenTitle: "The Black Hole Membership",
    EventNFTTokenText: "National",
    EventNFTTokenExpandedText: "The Black Hole National Membership Event Event Chit Designator",
    EventNFTTokenSerialNumber: -1
  },
  NFT: {
    NFTTitle: "Member | The Black Hole",
    NFTText: "Member | The Black Hole",
    NFTExpandedText: "Member | The Black Hole"
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
      NFTTokenCardImageAltTag: null
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
        OrigAuxId: "132776"
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
        OrigAuxId: "132777"
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
        OrigAuxId: "132782"
      },
      {
        URL: "https://image.admin.solutions/panel-topic_012b342c-5d11-4b4d-8efd-7af53911b511/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/0d779e49-75c5-4068-8791-789725098349",
        OnPageText: "Panel Topic",
        OnPageTitle: "Panel Topic",
        OnPageExpandedText: "<div class=\"text-center\">   <p>Get Exclusive Members-Only Discounts On Merch and Travel, VIP Event Access, and More. Built By The Fans, For The Fans — Because No One Reps Raider Nation Like We Do.</p>   <hr>   <h5>     Why join? Because being a Black Hole member means you're unstoppable:   </h5>    <ul style=\"list-style-type:none; padding:0; margin-bottom:30px;\">     <li style=\"margin-bottom:15px;\">       <strong style=\"color:#ffffff;\">Exclusive access & deals:</strong> 20% off everything in the official store, members-only merch drops, and priority event tickets.     </li>      <li style=\"margin-bottom:15px;\">       <strong style=\"color:#ffffff;\">Epic perks:</strong> Early invites to tailgates, watch parties, chapters worldwide, and game-day travel packages.     </li>      <li style=\"margin-bottom:15px;\">       <strong style=\"color:#ffffff;\">Collector swag:</strong> From T-shirts and patches to signed hats, tumblers, and varsity jackets — show off your allegiance in style.     </li>      <li style=\"margin-bottom:15px;\">       <strong style=\"color:#ffffff;\">Worldwide community:</strong> 35  chapters strong, connecting you with fans who share your passion for Raider Nation energy.     </li>    </ul>    <p style=\"font-size:18px; margin-bottom:15px;\">     This isn't for the casual fan. It's for the fearless, the relentless, the ones who make the Black Hole legendary.   </p>   <p style=\"font-size:18px; font-weight:bold; color:#ffffff;\">     Once a member, always a member. Step up. Stand proud. Join The Black Hole today — and become a part of Raider history.   </p>    <hr>   <hr>   <h5>Membership Terms & Conditions</h5> <div style=\"font-size: 13px;\">   <p>All membership purchases are final. Memberships are non-refundable and non-exchangeable.</p>   <p>Membership benefits and events will proceed as scheduled unless otherwise announced by The Black Hole organization.</p>   <p>Programs, perks, and events are subject to change without prior notice.</p>   <p>Memberships are non-transferable unless approved by The Black Hole organization.</p>   <p>Access to events and benefits is subject to organizational policies and capacity limits.</p>   <p>The Black Hole organization is not responsible for personal injury, lost items, or unforeseen changes to membership perks or events.</p>   <p>Use of this membership implies acceptance of these terms.</p> </div>",
        AltTag: "Panel Topic",
        Title: "Panel Topic",
        Description: "Panel Topic",
        MediaType: "Panel Topic",
        MapLocation: "",
        CategoryTypeMedia: "534112",
        OrigAuxId: "132778"
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
        OrigAuxId: "132781"
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
        OrigAuxId: "132771"
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
        OrigAuxId: "132770"
      }
    ]
  }
};

// Bootstrap data for local development
export const mockBootstrap = {
  frameNonce: "dev-nonce",
  IS_DEVELOPMENT: true,
  PAGE_MONKEY_CODE_COOKIE: "",
  USER_ACCESS_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Imp3dHVzZXIiLCJuYmYiOjE3NzAyOTMwMTgsImV4cCI6MTc3MDM3OTQxOCwiaWF0IjoxNzcwMjkzMDE4fQ.JdBoAtoP-vXB1F30HrWtJ1ANeg0jDcndi1ZHjq45Az4",
  IS_AUTHORIZED_USER: true,
  WALLET_OWNER_GUID: "3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8",
  WALLET_NAME_USER: "Charlie Raffay",
  ENTITY_AUTH_USER: "2E0D6230-4B25-4D00-94B0-A18DDF1CC8E9",
  DIRTY_AUTH_USER: "7f342cf318f87a7904244a0d245738e6",
  OWNED_BY_USER: true,
  CUSTODY_TIME_FRAME: "Current",
  HOW_OWNED: "Lend Sell",
  WTOB_GUID: "1009D4E8-AF8E-4339-8711-F85604BF153E",
  WALLET_BEING_VIEWED_CUSTODY_TIME_FRAME: "Current",
  WALLET_BEING_VIEWED_CUSTODY_TYPE: "Lend Sell",
  WALLET_BEING_VIEWED_WTOB_GUID: "1009D4E8-AF8E-4339-8711-F85604BF153E",
  WALLET_LOGGED_INTO: "3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8",
  WALLET_LOGGED_INTO_USER_NAME: "Charlie Raffay",
  WALLET_LOGGED_INTO_VALID_LOG_IN: true,
  WALLET_LOGGED_INTO_ENTITY_AUTH: "2E0D6230-4B25-4D00-94B0-A18DDF1CC8E9",
  WALLET_LOGGED_INTO_WALLET_AUTH: "6E837542-D0A4-4240-97A7-8F813FC243F7"
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
