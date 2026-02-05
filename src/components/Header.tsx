import { NavLink } from "react-router-dom";

interface HeaderProps {
  visible: boolean;
}

export default function Header({ visible }: HeaderProps) {
  const eventInfo = window.eventInfo;
  const profileImage = eventInfo?.Attendee?.ProfileImage;
  const profileTitle = eventInfo?.Attendee?.ProfileTitle || "Member";
  const logo = eventInfo?.Assets?.NFTTokenAssets?.find(
    (asset: { CategoryTypeMedia: string }) => asset.CategoryTypeMedia === "531524"
  )?.URL;

  return (
    <header
      className={`app-header ${visible ? "header-visible" : "header-hidden"}`}
    >
      <div className="header-content">
        {/* Left: Logo */}
        <div className="header-left">
          {logo && (
            <img src={logo} alt="Logo" className="header-logo" />
          )}
        </div>

        {/* Right: Profile Avatar */}
        <NavLink to="/profile" className="header-profile">
          {profileImage ? (
            <img
              src={profileImage}
              alt={profileTitle}
              className="header-avatar"
            />
          ) : (
            <div className="header-avatar header-avatar-placeholder">
              {profileTitle.charAt(0).toUpperCase()}
            </div>
          )}
        </NavLink>
      </div>
    </header>
  );
}
