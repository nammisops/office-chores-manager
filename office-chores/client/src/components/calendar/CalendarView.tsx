import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg, EventSourceFuncArg } from '@fullcalendar/core';
import { useAppStore } from '../../store/appStore';
import { api } from '../../api';
import { ChoreInstanceRow } from '../../types';
import { ChoreEvent } from './ChoreEvent';

function toCalendarEvent(row: ChoreInstanceRow) {
  const color = row.assignee_color ?? '#6c757d';
  return {
    id: String(row.id),
    title: row.chore_title,
    start: row.due_date,
    allDay: true,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      instanceId: row.id,
      choreId: row.chore_id,
      choreTitle: row.chore_title,
      choreDescription: row.chore_description,
      status: row.status,
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_name,
      assigneeColor: row.assignee_color,
      isRecurring: !!row.is_recurring,
      notes: row.notes,
    },
  };
}

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { currentView, setSelectedInstance, calendarRefetchKey } = useAppStore();

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(currentView);
  }, [currentView]);

  useEffect(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, [calendarRefetchKey]);

  async function fetchEvents(info: EventSourceFuncArg) {
    const start = info.startStr.substring(0, 10);
    const end = info.endStr.substring(0, 10);
    const rows = await api.instances.list(start, end);
    return rows.map(toCalendarEvent);
  }

  function handleEventClick(arg: EventClickArg) {
    const ep = arg.event.extendedProps;
    setSelectedInstance({
      id: ep['instanceId'] as number,
      chore_id: ep['choreId'] as number,
      chore_title: ep['choreTitle'] as string,
      chore_description: ep['choreDescription'] as string | null,
      due_date: arg.event.startStr.substring(0, 10),
      assignee_id: ep['assigneeId'] as number | null,
      assignee_name: ep['assigneeName'] as string | null,
      assignee_color: ep['assigneeColor'] as string | null,
      status: ep['status'] as 'pending' | 'completed' | 'skipped',
      completed_at: null,
      is_recurring: ep['isRecurring'] ? 1 : 0,
      notes: ep['notes'] as string | null,
    });
  }

  async function handleEventDrop(arg: EventDropArg) {
    const instanceId = arg.event.extendedProps['instanceId'] as number;
    const newDate = arg.event.startStr.substring(0, 10);
    try {
      await api.instances.update(instanceId, { dueDate: newDate });
    } catch {
      arg.revert();
    }
  }

  return (
    <div className="calendar-wrap">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={fetchEvents}
        eventContent={(arg) => <ChoreEvent arg={arg} />}
        eventClick={handleEventClick}
        editable={true}
        eventDrop={handleEventDrop}
        height="100%"
        dayMaxEvents={4}
        moreLinkClick="popover"
      />
    </div>
  );
}
