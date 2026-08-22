// Single source of truth for the fixed department list on the frontend.
// Mirrors backend/constants.py — keep both in sync if the list ever changes.
export const DEPARTMENTS = [
  'IT Support',
  'Network Support',
  'Hardware Support',
  'Software Support',
  'HR Support',
  'Payroll Support',
  'Administration',
  'Security Support',
];

export const DEPARTMENT_ICONS = {
  'IT Support': '💻',
  'Network Support': '🌐',
  'Hardware Support': '🖥️',
  'Software Support': '💾',
  'HR Support': '👥',
  'Payroll Support': '💰',
  'Administration': '🏢',
  'Security Support': '🔒',
};

export const departmentToSlug = (dept) => {
  if (!dept) return '';
  return dept.toLowerCase().replace(/\s+/g, '-');
};

export const slugToDepartment = (slug) => {
  if (!slug) return '';
  const decoded = decodeURIComponent(slug).toLowerCase();
  const match = DEPARTMENTS.find(
    (d) => d.toLowerCase() === decoded || departmentToSlug(d) === decoded
  );
  return match || slug;
};