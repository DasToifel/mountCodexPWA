import type { FarmRoute } from '@/types/farmRoute'

export const FARM_ROUTES: FarmRoute[] = [
  {
    id: 1,
    mountId: 31821,
    title: 'Halion-Lockout-Reset',
    zone: 'Drachenöde',
    waypoints: [
      {
        title: 'Eingang Rubinsanktum',
        hint: 'Portal in der Drachenöde nahe Wyrmruhtempel.',
        x: 0.45,
        y: 0.55,
      },
      { title: 'Halion-Plattform', hint: 'Boss-Arena im Inneren.', x: 0.6, y: 0.4 },
    ],
    tips: [
      'Wöchentlicher Lockout – einmal pro ID.',
      '25 heroisch bietet die beste Dropchance.',
    ],
    respawn: 'Wöchentlicher Raid-Reset',
    recommendation: 'Mit Twinks mehrere Lockouts pro Woche abdecken.',
  },
  {
    id: 2,
    mountId: 71086,
    title: 'Hallowfall-Weltboss-Runde',
    zone: 'Hallowfall',
    waypoints: [
      { title: 'Event-Trigger', hint: "Warte auf 'Schimmer der Tiefe'.", x: 0.3, y: 0.5 },
      { title: 'Boss-Spawn', hint: 'Im Zentrum der gefluteten Höhle.', x: 0.55, y: 0.62 },
    ],
    tips: ['Gruppe über Premade-Finder bilden.', 'Event startet ca. alle 90 Minuten.'],
    respawn: 'ca. 90 Min.',
    recommendation: 'Tägliches Looten möglich, kein Lockout.',
  },
]
