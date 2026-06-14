/**
 * Formats roles like SUPER_ADMIN to Super Admin, or STAFF_ADMIN to Staff Admin.
 */
export const formatRole = (role: string): string => {
  if (!role) return "";
  
  // Custom mappings for special/legacy roles if any
  const mappings: Record<string, string> = {
    "SUPER_ADMIN": "Super Admin",
    "FLOOR_ADMIN": "Floor Admin",
    "OFFICE_OWNER": "Office Owner",
    "STAFF_ADMIN": "Staff Admin"
  };

  if (mappings[role]) {
    return mappings[role];
  }

  return role
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
