export const calculateProfileCompletion = (user) => {
  if (!user) return 0;

  const fields = [
    user.name,
    user.email,
    user.gender,
    user.dob,
    user.phone,
    user.bio,
    user.country,
    user.state,
    user.city,
    user.profilephoto,
  ];

  const completed = fields.filter((field) => {
    if (field === null || field === undefined) return false;

    if (typeof field === "string") {
      return field.trim() !== "";
    }

    return true;
  }).length;

  return Math.round((completed / fields.length) * 100);
};