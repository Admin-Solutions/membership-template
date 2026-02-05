// Mock data for local development
// This simulates what the production server injects via window.eventInfo

export const mockEventInfo = {
  AttendeeWalletGUID: "3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8",
  EventNexusGUID: "89026528-2e97-4019-b2b4-73bb9fb49866",
  Attendee: {
    ProfileTitle: "Charlie Raffay",
    ProfileText: "Wallet Profile Image",
    ProfileExpandedText: "Charlie is a US Army Veteran...",
    ProfileImage: "https://image.admin.solutions/wallet-profile-image_c27ae511-a43c-49f2-bbaf-6747ca8fab26/ed30b0de-c4fb-4edf-984c-c0e4be94e69c/3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8/9c816db5-9a95-41ad-ab4e-f345ca2581ae",
    LastFirstName: "Charles Raffay"
  },
  Event: {
    EventProfileTitle: "The Black Hole National Membership",
    EventProfileText: "",
    EventProfileExpandedText: "The Black Hole is more than just a fan club...",
    EventProfileImage: "https://image.admin.solutions/wallet-profile-image_7fa45f6e-bc98-4525-a0bc-16282941bd96/ed30b0de-c4fb-4edf-984c-c0e4be94e69c/89026528-2e97-4019-b2b4-73bb9fb49866/c05c770a-a077-4832-81a7-ffcc93605c3b"
  },
  Assets: {
    NFTTokenAssets: [
      {
        URL: "https://image.admin.solutions/membership-napp-background-video_374dfe69-d417-4745-8b06-16fe0eabee9d/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/b26de4e0-e44d-4174-8ab0-00bcbf73a536",
        CategoryTypeMedia: "535648", // Background Video
        Title: "Membership Napp Background Video"
      },
      {
        URL: "https://image.admin.solutions/logo_55eb9289-f283-41ef-918b-d8f93fca06f9/65efd3ef-aaeb-40ac-ab43-25cd7571963d/61c488f7-f162-4061-a1bc-63dcd28491b9/b8cd8859-d771-4303-a1ae-18c72d0a93a7",
        CategoryTypeMedia: "531524", // Logo
        Title: "Logo"
      }
    ]
  }
};

// Initialize mock data in development
export function initDevData() {
  if (import.meta.env.DEV) {
    // Only set if not already present (production server sets it)
    if (!window.eventInfo) {
      window.eventInfo = mockEventInfo;
    }
  }
}
