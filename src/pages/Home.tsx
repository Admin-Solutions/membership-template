import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import VideoPlayer from "../components/VideoPlayer";

declare global {
  interface Window {
    eventInfo?: {
      Assets?: {
        NFTTokenAssets?: Array<{
          CategoryTypeMedia: string;
          URL: string;
        }>;
      };
      Attendee?: {
        ProfileTitle: string;
        ProfileImage?: string;
        ProfileText?: string;
        ProfileExpandedText?: string;
        LastFirstName?: string;
      };
      Event?: {
        EventProfileTitle?: string;
        EventProfileText?: string;
        EventProfileExpandedText?: string;
        EventProfileImage?: string;
      };
      AttendeeWalletGUID?: string;
      EventNexusGUID?: string;
    };
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [bannerName, setBannerName] = useState("");
  const [bannerVideo, setBannerVideo] = useState("");
  const [bannerLogo, setBannerLogo] = useState("");
  const data = window.eventInfo;

  useEffect(() => {
    if (data?.Assets?.NFTTokenAssets) {
      data.Assets.NFTTokenAssets.forEach((item) => {
        if (item.CategoryTypeMedia === "535648") {
          setBannerVideo(item.URL);
        }
        if (item.CategoryTypeMedia === "531524") {
          setBannerLogo(item.URL);
        }
      });
    }

    if (data?.Attendee) {
      setBannerName(data.Attendee.ProfileTitle);
    }
  }, [data]);

  return (
    <>
      {bannerVideo && <VideoPlayer src={bannerVideo} />}

      <div className="welcome-banner">
        <div className="welcome-content">
          {bannerLogo && (
            <div className="welcome-logo-container">
              <img
                src={bannerLogo}
                alt=""
                className="welcome-logo"
              />
            </div>
          )}
          <h1 className="welcome-title">Hi, {bannerName || "User"}</h1>
          <p className="welcome-subtitle">
            Welcome — this is where members belong.
          </p>
          <button
            className="home-button"
            onClick={() => {
              sessionStorage.removeItem("membershipHistory");
              navigate("/hub");
            }}
          >
            <span className="backdrop">
              <span className="action"></span>
            </span>
            <span className="text">Enter</span>
            <span className="icon">
              <ArrowRight size={20} />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
