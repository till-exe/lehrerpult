import House from '@lucide/svelte/icons/house';
import Users from '@lucide/svelte/icons/users';
import MessageSquareText from '@lucide/svelte/icons/message-square-text';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import Presentation from '@lucide/svelte/icons/presentation';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import Table2 from '@lucide/svelte/icons/table-2';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import Settings from '@lucide/svelte/icons/settings';

export const PAGES = [
  { id: 'start', label: 'Start', icon: House },
  { id: 'kalender', label: 'Kalender', icon: CalendarDays },
  { id: 'klasse', label: 'Klasse', icon: Users },
  { id: 'muendlich', label: 'Mündlich', icon: MessageSquareText },
  { id: 'leistungsnachweise', label: 'Leistungsnachweise', icon: ClipboardCheck },
  { id: 'unterricht', label: 'Unterricht', icon: Presentation },
  { id: 'stundenplan', label: 'Stundenplan', icon: Table2 },
  { id: 'notizen', label: 'Notizen', icon: NotebookPen },
];

export const SETTINGS_PAGE = { id: 'einstellungen', label: 'Einstellungen', icon: Settings };
