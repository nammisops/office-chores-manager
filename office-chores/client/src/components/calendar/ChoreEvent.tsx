import { EventContentArg } from '@fullcalendar/core';

interface Props {
  arg: EventContentArg;
}

export function ChoreEvent({ arg }: Props) {
  const { status, assigneeName } = arg.event.extendedProps as {
    status: string;
    assigneeName: string | null;
  };

  const initials = assigneeName
    ? assigneeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <div className={`chore-event ${status}`}>
      <span className="chore-event__title">{arg.event.title}</span>
      {initials && <span className="chore-event__badge">{initials}</span>}
      {status === 'completed' && <span>✓</span>}
    </div>
  );
}
