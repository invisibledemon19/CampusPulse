import { CalendarClock } from 'lucide-react';
import Badge from './Badge.jsx';

export default function DeadlineLabel({ urgency }) {
  if (!urgency) {
    return (
      <Badge variant="default" className="gap-1">
        <CalendarClock size={14} aria-hidden="true" />
        <span>Deadline not provided</span>
      </Badge>
    );
  }

  let variant = 'default';
  if (urgency.level === 'closed') {
    variant = 'danger';
  } else if (urgency.level === 'today' || urgency.level === 'urgent') {
    variant = 'warn';
  }

  return (
    <Badge variant={variant} className="gap-1">
      <CalendarClock size={14} aria-hidden="true" />
      <span>{urgency.label}</span>
    </Badge>
  );
}
