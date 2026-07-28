import {
  MdAdd,
  MdAdminPanelSettings,
  MdArrowBack,
  MdArrowForward,
  MdBadge,
  MdBlock,
  MdCalendarMonth,
  MdCampaign,
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDashboard,
  MdDelete,
  MdDownload,
  MdEdit,
  MdEventAvailable,
  MdExpandLess,
  MdExpandMore,
  MdFactCheck,
  MdFilterList,
  MdGroups,
  MdHelp,
  MdHelpOutline,
  MdLock,
  MdLogout,
  MdMail,
  MdMenu,
  MdMoreVert,
  MdNotifications,
  MdPayments,
  MdPerson,
  MdPersonAdd,
  MdPhotoCamera,
  MdReceiptLong,
  MdSchool,
  MdSearch,
  MdSettings,
  MdShoppingBag,
  MdUploadFile,
  MdVerified,
  MdVerifiedUser,
  MdVideocam,
  MdVisibility,
  MdVisibilityOff,
  MdZoomIn,
} from "react-icons/md";

const iconRegistry = {
  add: MdAdd,
  arrow_back: MdArrowBack,
  arrow_forward: MdArrowForward,
  badge: MdBadge,
  block: MdBlock,
  calendar_month: MdCalendarMonth,
  campaign: MdCampaign,
  check: MdCheck,
  chevron_left: MdChevronLeft,
  chevron_right: MdChevronRight,
  close: MdClose,
  dashboard: MdDashboard,
  delete: MdDelete,
  download: MdDownload,
  edit: MdEdit,
  event_available: MdEventAvailable,
  expand_less: MdExpandLess,
  expand_more: MdExpandMore,
  fact_check: MdFactCheck,
  filter_list: MdFilterList,
  groups: MdGroups,
  help: MdHelp,
  help_outline: MdHelpOutline,
  lock: MdLock,
  lock_person: MdAdminPanelSettings,
  logout: MdLogout,
  mail: MdMail,
  menu: MdMenu,
  more_vert: MdMoreVert,
  notifications: MdNotifications,
  payments: MdPayments,
  person: MdPerson,
  person_add: MdPersonAdd,
  photo_camera: MdPhotoCamera,
  receipt: MdReceiptLong,
  school: MdSchool,
  search: MdSearch,
  settings: MdSettings,
  shopping_bag: MdShoppingBag,
  upload_file: MdUploadFile,
  verified: MdVerified,
  verified_user: MdVerifiedUser,
  videocam: MdVideocam,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  zoom_in: MdZoomIn,
};

export default function AppIcon({
  name,
  size = 20,
  className = "",
  title,
}) {
  const Icon = iconRegistry[name];

  if (!Icon) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[AppIcon] Icon "${name}" belum terdaftar.`);
    }

    return null;
  }

  return (
    <Icon
      size={size}
      className={className}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      focusable="false"
    />
  );
}