import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "@fullcalendar/daygrid";

// Add a 'text' property to the color map for popover text styling
const typeColorMap = {
  Holiday: { bg: "bg-red-100", bar: "bg-red-500", text: "text-red-700" },
  Announcement: { bg: "bg-yellow-100", bar: "bg-yellow-500", text: "text-yellow-700" },
  Meeting: { bg: "bg-blue-100", bar: "bg-blue-500", text: "text-blue-700" },
  "Team Lunch": { bg: "bg-green-100", bar: "bg-green-500", text: "text-green-700" },
  Leave: { bg: "bg-purple-100", bar: "bg-purple-500", text: "text-purple-700" },
  default: { bg: "bg-gray-100", bar: "bg-gray-500", text: "text-gray-700" },
};

const CalendarMain = ({ events, onDateClick }) => {
  // States for hover popover
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const formattedEvents = events.map((e) => ({
    ...e,
    id: e.id?.toString() ?? `${e.title}-${e.start_date}`, // ensure ID is unique and string
    title: e.title,
    start: e.start_date,
    end: e.end_date,
    // Pass created_at if it exists in your event object
    extendedProps: {
      ...e.extendedProps,
      type: e.type, // Ensure type is here if not already in extendedProps from your data
      description: e.description, // Ensure description is here
      created_at: e.created_at // Assuming 'e.created_at' now exists in your event data
    },
    // FullCalendar expects these to be transparent when using eventContent for custom rendering
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: "transparent",
  }));

  const renderEventContent = (eventInfo) => {
    const { title, extendedProps } = eventInfo.event;
    const type = extendedProps?.type || 'default';
    const { bg, bar } = typeColorMap[type] || typeColorMap.default;

    return (
      <div
        className={`
          flex items-center p-1.5 rounded-md
          ${bg} border border-transparent
          cursor-pointer hover:border-gray-300 transition-colors duration-150 ease-in-out
        `}
        onMouseEnter={(e) => {
          setHoveredEvent(eventInfo.event);
          const eventRect = e.currentTarget.getBoundingClientRect();
          const calendarContainer = e.currentTarget.closest('.relative');
          const calendarContainerRect = calendarContainer ? calendarContainer.getBoundingClientRect() : { top: 0, left: 0 };

          setPopoverPosition({
            top: eventRect.bottom - calendarContainerRect.top + 8,
            left: eventRect.left - calendarContainerRect.left,
          });
        }}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        <div className={`w-1.5 h-4 mr-2 rounded-sm ${bar} flex-shrink-0`} />
        <div className="text-sm font-medium text-gray-800 flex-grow truncate">{title || 'Untitled Event'}</div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-4 bg-gray-50 rounded-lg shadow-inner relative">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={formattedEvents}
        dateClick={(info) => onDateClick(info.dateStr)}
        eventContent={renderEventContent}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
      />

      {/* Hover Popover */}
      {hoveredEvent && (
        <div
          className="absolute z-50 p-4 rounded-lg shadow-xl bg-white border border-gray-300 max-w-xs"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            minWidth: '200px',
            transform: (popoverPosition.left + 300 > window.innerWidth) ? 'translateX(-100%)' : 'none',
          }}
          onMouseEnter={() => setHoveredEvent(hoveredEvent)}
          onMouseLeave={() => setHoveredEvent(null)}
        >
          <h4 className="font-bold text-gray-900 text-base mb-1 leading-tight">{hoveredEvent.title || 'Untitled Event'}</h4>

          {hoveredEvent.extendedProps?.type && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Type:</span>{' '}
              <span className={`${typeColorMap[hoveredEvent.extendedProps.type]?.text || 'text-gray-700'}`}>
                {hoveredEvent.extendedProps.type}
              </span>
            </p>
          )}

          {hoveredEvent.extendedProps?.description && (
            <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{hoveredEvent.extendedProps.description}</p>
          )}

          {/* ONLY Display "Added On" Date/Time (Requires 'created_at' in your event data) */}
          {hoveredEvent.extendedProps?.created_at && (
              <p className="text-xs text-gray-500"> {/* Removed mt-1 since it's now the primary date info */}
                  <span className="font-semibold">Added On: </span>
                  {new Date(hoveredEvent.extendedProps.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                  })}
                  {' '}
                  {new Date(hoveredEvent.extendedProps.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                  })}
              </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarMain;