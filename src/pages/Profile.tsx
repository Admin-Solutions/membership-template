import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMembershipProfile } from "../store/membershipSlice";

interface ProfileData {
  image: string | null;
  title: string;
  text: string;
  tokenText: string;
}

export default function Profile() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<ProfileData>({
    image: null,
    title: "",
    text: "",
    tokenText: "",
  });
  const [NFTCard, setNFTCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const memberProfile = useAppSelector((state) => state.membershipProfile);
  const profileData = memberProfile?.data?.dataPayload?.value?.[0] || {};

  useEffect(() => {
    dispatch(fetchMembershipProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profileData) {
      setProfile({
        image: profileData.nexusProfileImage || null,
        title: profileData.nexusProfileTitle || "",
        text: profileData.nexusProfileExpText || "",
        tokenText: profileData.tokenText || "",
      });
      setNFTCard(profileData.NFTCardImage || null);
    }
  }, [profileData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const IDCard = () => {
    if (!profileData) return null;

    return isMobile ? (
      <div className="max-w-md mx-auto px-4">
        <div className="id-card-mobile flex gap-2 items-stretch mb-4">
          {NFTCard && (
            <div className="flex-1 h-48 rounded-2xl overflow-hidden">
              <img
                src={NFTCard}
                alt="NFT Membership Card"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {profile.image && (
            <div className="flex-1 h-48 rounded-2xl overflow-hidden">
              <img
                src={profile.image}
                alt={profile.title || "Profile"}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="text-center">
          <h5 className="mb-2 text-lg font-semibold">Ultimate Member</h5>
          {profileData.MemberSince && (
            <div className="text-sm text-gray-400">
              <strong>Member Since:</strong>{" "}
              {new Date(profileData.MemberSince).toLocaleDateString()}
            </div>
          )}
        </div>

        {profile.title && (
          <h2 className="mt-4 mb-2 text-2xl font-bold text-pink-500">
            {profile.title}
          </h2>
        )}

        <div className="flex items-center justify-between mb-4">
          {profile.tokenText && (
            <h5 className="text-lg">{profile.tokenText} - LA Chapter</h5>
          )}
          <QrCode size={60} className="text-white" />
        </div>

        <h5 className="mb-2 text-lg font-semibold">BIO</h5>
        {profile.text && <p className="text-gray-300">{profile.text}</p>}
      </div>
    ) : (
      <div className="id-card mb-4">
        <div className="flex gap-6">
          {NFTCard && (
            <div className="w-1/3">
              <img
                src={NFTCard}
                alt="NFT Membership Card"
                className="w-full border border-gray-600 rounded-lg"
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-end gap-4">
              {profile.image && (
                <img
                  src={profile.image}
                  alt={profile.title || "Profile"}
                  className="profile-image"
                />
              )}
              <div>
                {profile.title && (
                  <h2 className="profile-title">{profile.title}</h2>
                )}
                {profile.tokenText && (
                  <div className="text-gray-400 mb-3">{profile.tokenText}</div>
                )}
              </div>
            </div>
            <hr className="border-gray-700 my-4" />
            {profile.text && <p className="text-gray-300">{profile.text}</p>}
            {profileData.MemberSince && (
              <div className="text-sm text-gray-400 mt-3">
                <strong>Member Since:</strong>{" "}
                {new Date(profileData.MemberSince).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="profile">
      <div className="max-w-4xl mx-auto">
        <IDCard />
      </div>
    </section>
  );
}
