/**
 * Mock message threads for the Messages screen. Two flavors, one shape:
 *
 *  - 1:1 chats: a direct thread with a known Person (avatar + tag come from
 *    data/people). `personId` identifies the other side.
 *  - group chats: tied to a plan/event (the same peer plans the map + activity
 *    cards use). `planId` links them, so tapping "Enter groupchat" on a joined
 *    plan lands in (or spins up) that plan's thread. Members drive the stacked
 *    avatars and the sender labels on incoming bubbles.
 *
 * Purely a visual prototype: messages you send are appended in-session only.
 */
import type { PersonId } from './people';
import { PEOPLE } from './people';
import type { PeerPlan } from './peerPlans';

export type ChatMessage = {
  id: string;
  /** True = sent by the signed-in user (Pere). */
  fromMe: boolean;
  /** Group chats: who sent it (for the avatar + name label). Omit when fromMe. */
  senderId?: PersonId;
  /** Fallback sender name when the sender isn't a known Person (plan hosts). */
  senderName?: string;
  text: string;
  /** Display clock ("20:14"). */
  time: string;
};

export type Conversation = {
  id: string;
  kind: '1on1' | 'group';
  /** 1:1 — the other person. */
  personId?: PersonId;
  /** Group — display title + sub-line + the plan it belongs to. */
  title?: string;
  subtitle?: string;
  planId?: string;
  /** Group members (drive the stacked avatars). */
  memberIds?: PersonId[];
  messages: ChatMessage[];
  /** Unread count — clears to 0 when the thread is opened. */
  unread: number;
  /** Inbox right-column stamp ("20:14", "Yesterday", "Mon"). */
  updatedLabel: string;
};

/** The signed-in user. */
const ME_NAME = 'You';

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c-lluc-party',
    kind: 'group',
    title: 'Party at Rita’s 🎉',
    subtitle: 'Rita’s · Live music night',
    planId: 'mp-lluc',
    memberIds: ['lluc', 'giulia', 'martin', 'theo'],
    unread: 2,
    updatedLabel: '20:41',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'lluc', text: 'okay the band starts at 21:00, don’t be late this time 😤', time: '19:58' },
      { id: 'm2', fromMe: false, senderId: 'giulia', text: 'leaving now, saving the good spot by the bar', time: '20:02' },
      { id: 'm3', fromMe: true, text: 'on my way, grabbing Martin on the way over', time: '20:05' },
      { id: 'm4', fromMe: false, senderId: 'martin', text: 'I’m outside already lol where are you', time: '20:33' },
      { id: 'm5', fromMe: false, senderId: 'lluc', text: 'afterparty at mine after, ticket has one free drink remember', time: '20:41' },
    ],
  },
  {
    id: 'c-giulia',
    kind: '1on1',
    personId: 'giulia',
    unread: 1,
    updatedLabel: '18:12',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'giulia', text: 'rooftop before the basement swallows us? golden hour is unreal today', time: '17:40' },
      { id: 'm2', fromMe: true, text: 'yes please. bringing a jacket this time, learned my lesson', time: '17:52' },
      { id: 'm3', fromMe: false, senderId: 'giulia', text: 'good call it gets windy up there 🌬️ see you at 18:30', time: '18:12' },
    ],
  },
  {
    id: 'c-picnic',
    kind: 'group',
    title: 'Sunset picnic 🌅',
    subtitle: 'Templo de Debod',
    planId: 'mp-picnic',
    memberIds: ['giulia', 'theo', 'emma'],
    unread: 0,
    updatedLabel: 'Yesterday',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'theo', text: 'blankets ✅ cheap wine ✅ who’s on the playlist', time: 'Yesterday' },
      { id: 'm2', fromMe: false, senderId: 'emma', text: 'me!! no skips allowed though', time: 'Yesterday' },
      { id: 'm3', fromMe: true, text: 'I’ll bring the speaker + something to share', time: 'Yesterday' },
    ],
  },
  {
    id: 'c-martin',
    kind: '1on1',
    personId: 'martin',
    unread: 0,
    updatedLabel: 'Yesterday',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'martin', text: 'playing two songs at the open mic saturday, need friendly faces front row 🙏', time: 'Wed' },
      { id: 'm2', fromMe: true, text: 'wouldn’t miss it. vermut’s on you after though', time: 'Wed' },
      { id: 'm3', fromMe: false, senderId: 'martin', text: 'deal 🤝', time: 'Yesterday' },
    ],
  },
  {
    id: 'c-crawl',
    kind: 'group',
    title: 'Malasaña crawl 🍻',
    subtitle: 'Pl. del Dos de Mayo',
    planId: 'mp-crawl',
    memberIds: ['marc', 'lluc', 'martin'],
    unread: 0,
    updatedLabel: 'Mon',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'marc', text: 'three bars, one neighbourhood, no cover charges. start at the plaza 21:00', time: 'Mon' },
      { id: 'm2', fromMe: false, senderId: 'lluc', text: 'see where the night takes us 😎', time: 'Mon' },
    ],
  },
  {
    id: 'c-eva',
    kind: '1on1',
    personId: 'eva',
    unread: 0,
    updatedLabel: 'Mon',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'eva', text: 'easy 5k through Retiro ending at Rita’s door so we earn the beers', time: 'Sun' },
      { id: 'm2', fromMe: true, text: 'all paces welcome right? I am not fast', time: 'Sun' },
      { id: 'm3', fromMe: false, senderId: 'eva', text: 'we regroup at every gate, promise 🏃‍♀️', time: 'Mon' },
    ],
  },
  {
    id: 'c-emma',
    kind: '1on1',
    personId: 'emma',
    unread: 0,
    updatedLabel: 'Sun',
    messages: [
      { id: 'm1', fromMe: false, senderId: 'emma', text: 'record shopping around Malasaña before the session — bring one record you’d play to a stranger', time: 'Sun' },
      { id: 'm2', fromMe: true, text: 'ooh I have the perfect one', time: 'Sun' },
    ],
  },
];

/** The other-side display name for a conversation (inbox title + thread header). */
export function conversationName(c: Conversation): string {
  if (c.kind === '1on1' && c.personId) {
    const p = PEOPLE[c.personId];
    return `${p.firstName} ${p.lastName}`;
  }
  return c.title ?? 'Group chat';
}

/** The last message's text, for the inbox preview line. */
export function lastMessage(c: Conversation): ChatMessage | null {
  return c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
}

/** Preview line: "You: …" / "Giulia: …" for groups, or the raw text for 1:1. */
export function previewLine(c: Conversation): string {
  const m = lastMessage(c);
  if (!m) return 'Say hi 👋';
  if (c.kind === '1on1') return m.text;
  const who = m.fromMe ? ME_NAME : senderFirstName(m);
  return `${who}: ${m.text}`;
}

/** A sender's first name (known Person, explicit senderName, or "You"). */
export function senderFirstName(m: ChatMessage): string {
  if (m.fromMe) return ME_NAME;
  if (m.senderId) return PEOPLE[m.senderId].firstName;
  return m.senderName ?? 'Someone';
}

/**
 * Spin up a transient group conversation from a plan the user just joined
 * (via "Enter groupchat"), when no seeded thread exists for it. Stable id so
 * messages sent this session accumulate under it.
 */
export function synthConversationForPlan(plan: PeerPlan): Conversation {
  const hostFirst = plan.host.split(' ')[0];
  return {
    id: `plan:${plan.id}`,
    kind: 'group',
    title: plan.title,
    subtitle: plan.address,
    planId: plan.id,
    memberIds: [],
    unread: 0,
    updatedLabel: 'Now',
    messages: [
      {
        id: 'seed',
        fromMe: false,
        senderName: hostFirst,
        text: `Welcome to the group! ${plan.when} — ${plan.goingNames} and +${Math.max(
          0,
          plan.goingCount - 2,
        )} others are in. Say hi 👋`,
        time: 'Now',
      },
    ],
  };
}
