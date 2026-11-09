import House from '@lucide/svelte/icons/house';
import Users from '@lucide/svelte/icons/users';
import MessageSquareText from '@lucide/svelte/icons/message-square-text';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import Presentation from '@lucide/svelte/icons/presentation';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import Settings from '@lucide/svelte/icons/settings';

export const PAGES = [
  { id: 'start', label: 'Start', icon: House },
  { id: 'klasse', label: 'Klasse', icon: Users },
  {
    id: 'muendlich',
    label: 'Mündlich',
    icon: MessageSquareText,
    step: 5,
    plan: ['Nach der Stunde schnell Note oder Eindruck festhalten', 'Art per Knopf: RA, RF, UB oder Freitext, dazu +/−', 'Haken „in Notenmanager übertragen“'],
  },
  {
    id: 'leistungsnachweise',
    label: 'Leistungsnachweise',
    icon: ClipboardCheck,
    step: 6,
    plan: ['Terminübersicht aller Exen und Schulaufgaben', 'Notenschlüssel-Rechner'],
  },
  {
    id: 'unterricht',
    label: 'Unterricht',
    icon: Presentation,
    step: 8,
    plan: ['Timer, Glücksrad, Lautstärkemesser, QR-Code, Zufallsauswahl', 'Jedes Werkzeug im Vollbild für den Beamer'],
  },
  {
    id: 'stundenplan',
    label: 'Stundenplan',
    icon: CalendarDays,
    step: 3,
    plan: ['Wochenplan, der jede Woche gilt', 'Einzelne Stunden jederzeit verschieben', 'Speist die Tagesansicht auf der Startseite'],
  },
  {
    id: 'notizen',
    label: 'Notizen',
    icon: NotebookPen,
    step: 9,
    plan: ['Einfache Textseiten mit Überschriften, Listen und Checkboxen', 'Allgemein oder einer Klasse zugeordnet', 'Suche über alle Notizen'],
  },
];

export const SETTINGS_PAGE = { id: 'einstellungen', label: 'Einstellungen', icon: Settings };
