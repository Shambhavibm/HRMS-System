import { useModal } from "../../hooks/useModal";
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserMetaCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { user_id: userId } = userData || {};
  const [image, setImage] = useState("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png");
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    city: '',
    country: '',
    facebook: '',
    x: '',
    linkedin: '',
    instagram: ''
  });

  const BASE_URL = "http://localhost:5001";

  useEffect(() => {
    if (!userId) {
      setImage("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png");
      setProfileData({
        firstName: '', lastName: '', bio: '', city: '', country: '', facebook: '', x: '', linkedin: '', instagram: ''
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found. Skipping user profile fetch.");
          return;
    }

    axios.get(`${BASE_URL}/api/users/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        const user = res.data;
        if (user.profile_picture_url) {
          const imageUrl = user.profile_picture_url.startsWith(BASE_URL)
            ? user.profile_picture_url
            : `${BASE_URL}${user.profile_picture_url}`;
          setImage(imageUrl);
        } else {
              setImage("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png");
        }

        setProfileData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          bio: user.bio || '',
          city: user.city || '',
          country: user.country || '',
          facebook: user.facebook_url || '',
          x: user.x_url || '',
          linkedin: user.linkedin_url || '',
          instagram: user.instagram_url || ''
        });
      })
      .catch(err => {
        console.error("Error loading user data:", err);
           setImage("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png");
        setProfileData({
            firstName: '', lastName: '', bio: '', city: '', country: '', facebook: '', x: '', linkedin: '', instagram: ''
        });
        toast.error("Failed to load user profile data.");
      });
  }, [userId]); 

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authentication token missing. Please log in again.");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/users/profile/${userId}/upload-picture`, 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setImage(`${BASE_URL}/${res.data.imageUrl}`);
      toast.success("Profile picture updated successfully!");
      if (refreshUserData) refreshUserData(); 
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Image upload failed.");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
    }

    const updatedData = {
      bio: profileData.bio,
      city: profileData.city,
      country: profileData.country,
      facebook_url: profileData.facebook,
      x_url: profileData.x,
      linkedin_url: profileData.linkedin,
      instagram_url: profileData.instagram
    };

    try {
      await axios.put(
        `${BASE_URL}/api/users/profile/${userId}`, // Use BASE_URL here
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     if (refreshUserData) refreshUserData();
      toast.success("Profile updated successfully!");
      closeModal();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

 const handleSocialClick = (platform) => {
    const url = profileData[platform];
    if (!url) {
      toast.info(`Please update your ${platform} link.`); 
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Icons for social platforms (no changes here)
  const renderIcon = (platform) => {
    switch (platform) {
      case 'facebook':
        return <svg width="20" height="20" fill="currentColor"><path d="M18 0h-3c-3.3 0-6 2.7-6 6v3H6v4h3v7h4v-7h3l1-4h-4V6c0-.6.4-1 1-1h3V0z" /></svg>;
      case 'x':
        return <svg width="20" height="20" fill="currentColor"><path d="M5 3h2l6 6 6-6h2l-7 7 7 7h-2l-6-6-6 6H5l7-7z" /></svg>;
      case 'linkedin':
        return <svg width="20" height="20" fill="currentColor"><path d="M4 3c0 1.1-.9 2-2 2S0 4.1 0 3s.9-2 2-2 2 .9 2 2zM0 6h4v12H0zM6 6h4v2h.1c.5-.9 1.7-1.9 3.4-1.9C16 6 18 8 18 11.3V18h-4v-5.3c0-1.3-.4-2.2-1.6-2.2-1 0-1.6.7-1.9 1.4-.1.3-.1.7-.1 1V18H6V6z" /></svg>;
      case 'instagram':
        return <svg width="20" height="20" fill="currentColor"><path d="M9 2C5.1 2 2 5.1 2 9c0 3.9 3.1 7 7 7s7-3.1 7-7c0-3.9-3.1-7-7-7zm0 12.5c-3 0-5.5-2.5-5.5-5.5S6 3.5 9 3.5 14.5 6 14.5 9 12 14.5 9 14.5zM13.5 4c-.8 0-1.5.7-1.5 1.5S12.7 7 13.5 7 15 6.3 15 5.5 14.3 4 13.5 4z" /></svg>;
      default:
        return <span>?</span>;
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Profile Image */}
            <div
              onClick={handleImageClick}
              className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 cursor-pointer bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
              title="Click to change profile picture"
            >
              <img src={image} alt="User" className="object-cover w-full h-full" />
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            </div>

            {/* Name and Bio */}
            <div className="order-3 xl:order-2 flex flex-col">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profileData.firstName} {profileData.lastName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center xl:text-left">{profileData.bio}</p>
              {(profileData.city || profileData.country) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center xl:text-left mt-1">
                  {profileData.city}{profileData.city && profileData.country ? ", " : ""}{profileData.country}
                </p>
              )}
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center order-2 gap-3 grow xl:order-3 xl:justify-end">
              {["facebook", "x", "linkedin", "instagram"].map((platform) => (
                <button
                  key={platform}
                  onClick={() => handleSocialClick(platform)}
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  aria-label={`Open ${platform} profile`}
                >
                  {renderIcon(platform)}
                </button>
              ))}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.05470 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.63590 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.12620 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Social Links
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your social media URLs to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Facebook</Label>
                  <Input
                    type="text"
                    value={profileData.facebook}
                    onChange={(e) => setProfileData({ ...profileData, facebook: e.target.value })}
                    placeholder="Facebook URL"
                  />
                </div>
                <div>
                  <Label>X.com</Label>
                  <Input
                    type="text"
                    value={profileData.x}
                    onChange={(e) => setProfileData({ ...profileData, x: e.target.value })}
                    placeholder="X / Twitter URL"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    type="text"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    placeholder="LinkedIn URL"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    type="text"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                    placeholder="Instagram URL"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" type="submit" loading={loading}>Save</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}