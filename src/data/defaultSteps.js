export const DEFAULT_STEPS = {
  hackathon: [
    'Check eligibility and team size',
    'Prepare a project idea',
    'Confirm teammates',
    'Confirm the venue or joining link',
    "Register on the organizer's site"
  ],
  internship: [
    'Check eligibility',
    'Update your resume',
    'Collect portfolio or project links',
    "Apply on the organizer's site",
    'Note the interview date'
  ],
  workshop: [
    'Check prerequisites',
    "Register on the organizer's site",
    'Add the date to your calendar',
    'Install the tools you need'
  ],
  event: [
    'Check eligibility',
    "Register on the organizer's site",
    'Confirm the venue',
    'Add the date to your calendar'
  ]
};

export function getDefaultStepsForCategory(category) {
  const steps = DEFAULT_STEPS[category] || DEFAULT_STEPS.event;
  return steps.map((task, index) => ({
    id: `step-${index + 1}`,
    task,
    completed: false
  }));
}
