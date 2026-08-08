/**
 * Demo launcher flows — the "jump straight into this state" shortcuts exposed
 * on the landing page (and behind ?dev). Because the prototype is a mobile app
 * demoed to judges, the tuning Lab isn't reachable on a phone; these let anyone
 * drop the app cold into a specific conditional flow from the first screen.
 *
 * Each intent resolves to how `MapHome` should mount:
 *  - onboarding: run the first-run flow
 *  - dayOf: prime PlansProvider so the "Your plans" focused card shows the
 *    slide-to-RSVP slider (the "day of the plan" state)
 *  - initialFlow: a flow MapHome opens on mount via its existing handlers
 */

/** A flow MapHome opens on mount (null = plain map). */
export type InitialFlow = 'plans' | 'create' | 'profile' | 'messages' | null;

export type DemoIntent =
  | 'default' // the main CTA: full first-run — onboarding on + day-of primed
  | 'onboarding'
  | 'dayOfPlan'
  | 'create'
  | 'profile'
  | 'messages'
  | 'map';

export type LaunchConfig = {
  onboarding: boolean;
  dayOf: boolean;
  initialFlow: InitialFlow;
};

export function resolveIntent(intent: DemoIntent): LaunchConfig {
  switch (intent) {
    case 'default':
      return { onboarding: true, dayOf: true, initialFlow: null };
    case 'onboarding':
      return { onboarding: true, dayOf: false, initialFlow: null };
    case 'dayOfPlan':
      return { onboarding: false, dayOf: true, initialFlow: 'plans' };
    case 'create':
      return { onboarding: false, dayOf: false, initialFlow: 'create' };
    case 'profile':
      return { onboarding: false, dayOf: false, initialFlow: 'profile' };
    case 'messages':
      return { onboarding: false, dayOf: false, initialFlow: 'messages' };
    case 'map':
      return { onboarding: false, dayOf: false, initialFlow: null };
  }
}

/** Chips shown in the landing launcher (the main CTA covers 'default'). */
export const DEMO_FLOWS: Array<{ intent: DemoIntent; label: string }> = [
  { intent: 'onboarding', label: 'Onboarding' },
  { intent: 'dayOfPlan', label: 'Día del plan' },
  { intent: 'create', label: 'Crear un plan' },
  { intent: 'profile', label: 'Mi perfil' },
  { intent: 'messages', label: 'Mensajes' },
  { intent: 'map', label: 'Solo el mapa' },
];
