import type { ReactNode } from 'react';
import { LuChartNoAxesCombined } from 'react-icons/lu';
import { HiBolt } from 'react-icons/hi2';
import { IoCalendarClearOutline, IoListSharp } from 'react-icons/io5';
import Homescreen from '../views/Homescreen';
import PlaceholderView from '../views/PlaceholderView';
import WorkoutView from '../views/WorkoutView';
import RoutinesView from '../views/RoutinesView';

export interface NavItem {
  /** Absolute path; also the router path for this destination. */
  path: string;
  /** Label shown in the navbar. */
  label: string;
  /** Icon for the navbar / sidebar. */
  icon: ReactNode;
  /** Element rendered by the router for this path. */
  element: ReactNode;
}

/**
 * Single source of truth for the app's primary navigation. Consumed by the
 * router (path + element) and by the navbar pill (path + label + icon), so the
 * two can never drift out of sync.
 */
export const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <LuChartNoAxesCombined fontSize={18} />,
    element: <Homescreen />,
  },
  {
    path: '/workout',
    label: 'Workout',
    icon: <HiBolt fontSize={18} />,
    element: <WorkoutView />,
  },
  {
    path: '/sessions',
    label: 'Sessions',
    icon: <IoCalendarClearOutline fontSize={18} />,
    element: <PlaceholderView title="Sessions" />,
  },
  {
    path: '/routines',
    label: 'Routines',
    icon: <IoListSharp fontSize={18} />,
    element: <RoutinesView />,
  },
];
