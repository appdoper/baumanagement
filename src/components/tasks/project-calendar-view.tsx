"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Navigate,
  Views,
  type ToolbarProps,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskFormSheet } from "./task-form-sheet";

// Stylesheet published by react-big-calendar; per the Next.js docs, external
// package stylesheets may be imported from any component in the app directory.
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { de };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: de }),
  getDay,
  locales,
});

// German toolbar / view labels.
const messages = {
  date: "Datum",
  time: "Zeit",
  event: "Vorgang",
  allDay: "Ganztägig",
  week: "Woche",
  work_week: "Arbeitswoche",
  day: "Tag",
  month: "Monat",
  previous: "Zurück",
  next: "Weiter",
  yesterday: "Gestern",
  tomorrow: "Morgen",
  today: "Heute",
  agenda: "Agenda",
  noEventsInRange: "Keine Vorgänge in diesem Zeitraum.",
  showMore: (count: number) => `+ ${count} weitere`,
};

const VIEW_LABELS: Record<string, string> = {
  [Views.MONTH]: "Monat",
  [Views.WEEK]: "Woche",
  [Views.DAY]: "Tag",
  [Views.AGENDA]: "Agenda",
};

const CALENDAR_VIEWS: View[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

interface TaskEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  task: Task;
}

function atMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Builds a calendar event per task from its scheduling fields:
 * - plannedStart present → event from plannedStart to plannedEnd (fallback: same day).
 * - otherwise a deadline → an all-day event on the deadline.
 * - neither → the task has no date and is skipped.
 *
 * react-big-calendar treats the end of an all-day event as exclusive, so the
 * end is pushed one day forward to make the last day render inside the bar.
 */
function buildEvents(tasks: Task[]): TaskEvent[] {
  const events: TaskEvent[] = [];
  for (const task of tasks) {
    if (task.plannedStart) {
      const start = atMidnight(new Date(task.plannedStart));
      const rawEnd = task.plannedEnd ? atMidnight(new Date(task.plannedEnd)) : start;
      const end = addDays(rawEnd < start ? start : rawEnd, 1);
      events.push({ title: task.title, start, end, allDay: true, task });
    } else if (task.deadline) {
      const day = atMidnight(new Date(task.deadline));
      events.push({ title: task.title, start: day, end: addDays(day, 1), allDay: true, task });
    }
  }
  return events;
}

function CalendarToolbar({ label, view, views, onNavigate, onView }: ToolbarProps<TaskEvent>) {
  const viewList = Array.isArray(views) ? views : CALENDAR_VIEWS;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onNavigate(Navigate.PREVIOUS)}
            aria-label="Vorheriger Zeitraum"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onNavigate(Navigate.NEXT)}
            aria-label="Nächster Zeitraum"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate(Navigate.TODAY)}
        >
          Heute
        </Button>
        <span className="ml-1 text-base font-semibold capitalize">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        {viewList.map((v) => (
          <Button
            key={v}
            variant={v === view ? "default" : "outline"}
            size="sm"
            onClick={() => onView(v)}
            className={cn(v === view && "pointer-events-none")}
          >
            {VIEW_LABELS[v] ?? v}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ProjectCalendarView({
  tasks,
  projects,
  predecessorMap,
}: {
  tasks: Task[];
  projects: Project[];
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Task | null>(null);

  const events = useMemo(() => buildEvents(tasks), [tasks]);

  return (
    <div className="rbc-shadcn flex h-full min-h-0 flex-col">
      <Calendar<TaskEvent>
        localizer={localizer}
        culture="de"
        messages={messages}
        events={events}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        popup
        components={{ toolbar: CalendarToolbar }}
        views={CALENDAR_VIEWS}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={(event) => setSelected(event.task)}
        style={{ height: "100%" }}
      />

      {/* Clicking an event opens the existing edit sheet for that task. */}
      <TaskFormSheet
        projects={projects}
        task={selected ?? undefined}
        projectTasks={tasks}
        predecessors={selected ? predecessorMap[selected.id] ?? [] : []}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
