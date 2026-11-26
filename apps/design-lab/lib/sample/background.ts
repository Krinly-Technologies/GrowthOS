import { DAY, HOUR, ist, LAB_NOW, MINUTE, startOfDay } from '../clock';
import type {
  Activity,
  Channel,
  LabData,
  Lead,
  MemberId,
  Payment,
  PaymentMethod,
  ServiceId,
  SourceId,
  Stage,
  StageMark,
} from '../domain';
import { STAGE_LABEL } from '../domain';
import { dayMonth } from '../format';
import { createRng } from './random';
import { LOST_REASONS, SERVICES, SOURCES } from './scenario';

// Background volume: 46 fictional leads from August to November, generated deterministically.
// They give the source table, journey and board realistic depth without creating attention
// items — every "needs you" item comes from the hand-written story leads.

const NAMES = [
  'Kavya Reddy',
  'Meera Apte',
  'Nikita Sharma',
  'Tanvi Desai',
  'Ishita Banerjee',
  'Lavanya Iyer',
  'Shruti Patil',
  'Pallavi Shetty',
  'Revathi Krishnan',
  'Swati Gupta',
  'Neha Agarwal',
  'Riya Bose',
  'Sanjana Das',
  'Megha Naidu',
  'Aditi Gowda',
  'Bhavna Kamath',
  'Charu Bhat',
  'Esha Fernandes',
  'Gauri D’Souza',
  'Hema Varghese',
  'Jyoti Mathew',
  'Keerthana Subramanian',
  'Nandini Venkatesh',
  'Padma Chatterjee',
  'Rashmi Mukherjee',
  'Sakshi Sinha',
  'Uma Verma',
  'Vandana Saxena',
  'Yamini Malhotra',
  'Zoya Rizvi',
  'Anjali Sethi',
  'Chitra Arora',
  'Damini Chauhan',
  'Farzana Ansari',
  'Geetika Jain',
  'Ira Mehta',
  'Juhi Parikh',
  'Mansi Trivedi',
  'Naina Pandey',
  'Oviya Senthil',
  'Prerna Tiwari',
  'Ruchi Yadav',
  'Sunaina Rathore',
  'Tejal Doshi',
  'Amrita Thomas',
  'Simran Gill',
  'Vaishnavi Hegde',
  'Mridula Nambiar',
  'Tanisha Grover',
  'Sowmya Raghavan',
  'Pavithra Gowda',
  'Nidhi Bhandari',
  'Archana Pillay',
  'Kirti Malviya',
  'Shreya Bhosale',
  'Ayesha Khatri',
  'Rhea Dsilva',
  'Deepika Ramanan',
  'Smitha Kini',
  'Varsha Iyengar',
];

const AREAS = [
  'Jayanagar',
  'JP Nagar',
  'BTM Layout',
  'Banashankari',
  'Basavanagudi',
  'Koramangala',
  'HSR Layout',
  'Bellandur',
  'Indiranagar',
  'Ulsoor',
  'Malleshwaram',
  'Rajajinagar',
  'Yelahanka',
  'Hebbal',
  'Electronic City',
  'Kanakapura Road',
  'Sarjapur Road',
  'Whitefield',
  'Marathahalli',
  'Vijayanagar',
];

const SOURCE_WEIGHTS: (readonly [SourceId, number])[] = [
  ['instagram_ads', 34],
  ['instagram', 15],
  ['google', 17],
  ['referral', 14],
  ['website', 9],
  ['walk_in', 6],
];

const SERVICE_WEIGHTS: (readonly [ServiceId, number])[] = [
  ['bridal_signature', 14],
  ['bridal_classic', 30],
  ['engagement', 15],
  ['pre_bridal', 12],
  ['party', 15],
  ['mehendi', 8],
  ['family', 6],
];

const BOOK_RATE: Record<SourceId, number> = {
  referral: 1.55,
  wedding_fair: 1.35,
  walk_in: 1.2,
  google: 1.05,
  website: 0.95,
  instagram: 0.9,
  instagram_ads: 0.72,
};

const MONTHS: {
  month: number;
  count: number;
  base: number;
  lastDay: number;
  season: [number, number];
}[] = [
  // season: the wedding window bridal enquiries from this month book into (Indian wedding season).
  { month: 8, count: 16, base: 0.52, lastDay: 31, season: [ist(2026, 10, 3), ist(2026, 12, 6)] },
  { month: 9, count: 18, base: 0.5, lastDay: 30, season: [ist(2026, 10, 24), ist(2027, 1, 10)] },
  { month: 10, count: 18, base: 0.42, lastDay: 31, season: [ist(2026, 11, 26), ist(2027, 2, 15)] },
  { month: 11, count: 8, base: 0.2, lastDay: 22, season: [ist(2027, 1, 5), ist(2027, 3, 15)] },
];

const BRIDAL: ServiceId[] = ['bridal_signature', 'bridal_classic', 'family', 'pre_bridal'];

function eventLabelFor(service: ServiceId, pickParty: () => string): string {
  if (service === 'engagement') return 'Engagement';
  if (service === 'party') return pickParty();
  if (service === 'mehendi') return 'Mehendi';
  return 'Wedding';
}

function enquiryText(service: ServiceId, eventLabel: string, eventDate: number): string {
  const date = dayMonth(eventDate);
  switch (service) {
    case 'engagement':
      return `Asked about an engagement look for ${date}.`;
    case 'pre_bridal':
      return 'Asked about pre-bridal skin and hair sessions before the wedding.';
    case 'party':
      return `Asked about party makeup for a ${eventLabel.toLowerCase()} on ${date}.`;
    case 'mehendi':
      return `Asked about hair and makeup for a mehendi function on ${date}.`;
    case 'family':
      return `Asked about a family package for a wedding on ${date}.`;
    default:
      return `Asked about bridal makeup for a wedding on ${date}.`;
  }
}

/** Seed chosen by scanning seeds for a natural narrative (see Phase 02A notes). */
export const BACKGROUND_SEED = 3;

export function buildBackground(seed = BACKGROUND_SEED): LabData {
  const rng = createRng(seed);
  const data: LabData = { leads: [], activities: [], payments: [], bookings: [] };
  let nameIndex = 0;
  let fairLeft = 3;

  for (const plan of MONTHS) {
    for (let i = 0; i < plan.count; i++) {
      const name = NAMES[nameIndex] ?? `Customer ${nameIndex + 1}`;
      const id = `ld-bg${nameIndex.toString().padStart(2, '0')}`;
      nameIndex++;

      const isFair = plan.month === 11 && fairLeft > 0;
      if (isFair) fairLeft--;
      const source: SourceId = isFair ? 'wedding_fair' : rng.weighted(SOURCE_WEIGHTS);
      const day = isFair ? rng.pick([8, 9]) : rng.int(1, plan.lastDay);
      const createdAt = ist(
        2026,
        plan.month,
        day,
        rng.int(9, 20),
        rng.pick([0, 10, 20, 30, 40, 50]),
      );
      const service = rng.weighted(SERVICE_WEIGHTS);
      const info = SERVICES[service];
      const value =
        service === 'party'
          ? 6500
          : Math.round((info.price * (0.9 + rng.next() * 0.28)) / 500) * 500;
      const eventLabel = eventLabelFor(service, () =>
        rng.pick(['Sangeet', 'Reception', 'Cocktail']),
      );
      const [seasonStart, seasonEnd] = plan.season;
      const inSeason = Math.max(seasonStart, createdAt + 35 * DAY);
      const eventDate = BRIDAL.includes(service)
        ? inSeason +
          rng.int(0, Math.max(1, Math.round((seasonEnd - inSeason) / DAY))) * DAY +
          rng.int(10, 18) * HOUR
        : createdAt + rng.int(8, 40) * DAY + rng.int(0, 8) * HOUR;
      const owner: MemberId = BRIDAL.includes(service)
        ? rng.chance(0.15)
          ? 'farah'
          : 'rohan'
        : 'divya';
      const channel: Channel = SOURCES[source].channel;

      // Outcome
      const pBooked = Math.min(0.8, plan.base * BOOK_RATE[source]);
      let booked = rng.chance(pBooked);
      let bookedAt = createdAt + rng.int(3, 16) * DAY + rng.int(1, 8) * HOUR;
      if (booked && bookedAt > LAB_NOW - 2 * DAY) booked = false;
      let finalStage: Stage;
      if (booked) finalStage = 'booked';
      else if (plan.month <= 9) finalStage = 'lost';
      else if (plan.month === 10)
        finalStage = rng.chance(0.55) ? 'lost' : rng.pick<Stage>(['contacted', 'interested']);
      else finalStage = rng.chance(0.15) ? 'lost' : rng.chance(0.55) ? 'contacted' : 'interested';

      const contactedAt = createdAt + rng.int(20, 180) * MINUTE;
      const history: StageMark[] = [
        { stage: 'new', at: createdAt },
        { stage: 'contacted', at: contactedAt },
      ];
      const reachedInterested =
        finalStage === 'interested' ||
        finalStage === 'booked' ||
        (finalStage === 'lost' && rng.chance(0.45));
      let interestedAt = createdAt + rng.int(2, 6) * DAY;
      if (finalStage === 'booked') {
        bookedAt = Math.max(bookedAt, contactedAt + 2 * DAY);
        interestedAt = Math.min(interestedAt, bookedAt - DAY);
      }
      interestedAt = Math.min(interestedAt, LAB_NOW - 2 * DAY);
      if (reachedInterested) history.push({ stage: 'interested', at: interestedAt });
      let lostReason: string | undefined;
      if (finalStage === 'booked') history.push({ stage: 'booked', at: bookedAt });
      if (finalStage === 'lost') {
        const lostAt = Math.min(createdAt + rng.int(6, 25) * DAY, LAB_NOW - DAY);
        history.push({
          stage: 'lost',
          at: Math.max(lostAt, (history[history.length - 1]?.at ?? createdAt) + HOUR),
        });
        lostReason = rng.pick(LOST_REASONS);
      }

      const lead: Lead = {
        id,
        name,
        phone: `+91 9${rng.int(1000, 9999).toString()} ••${rng.int(100, 999).toString()}`,
        area: rng.pick(AREAS),
        service,
        eventLabel,
        eventDate,
        value,
        stage: finalStage,
        history,
        source,
        owner,
        createdAt,
        ...(source === 'wedding_fair'
          ? { sourceDetail: 'Met at the wedding fair stall, 8–9 Nov' }
          : {}),
        ...(lostReason ? { lostReason } : {}),
      };
      if (
        (finalStage === 'contacted' || finalStage === 'interested') &&
        eventDate < LAB_NOW + 3 * DAY
      ) {
        // Deterministic (no rng call) so the seeded sequence for later leads is unchanged.
        lead.eventDate = startOfDay(LAB_NOW) + (12 + ((nameIndex * 7) % 29)) * DAY + 11 * HOUR;
      }
      if (finalStage === 'contacted' || finalStage === 'interested') {
        const labels =
          finalStage === 'contacted'
            ? ['Share trial slots', 'Check the event date', 'Send package options']
            : ['Follow up after the trial', 'Send the quotation', 'Confirm the trial date'];
        lead.next = {
          kind: 'follow_up',
          label: rng.pick(labels),
          due: LAB_NOW + rng.int(1, 9) * DAY + rng.int(0, 6) * HOUR,
        };
      }
      data.leads.push(lead);

      // Activities
      const acts: Activity[] = [
        {
          id: `${id}-a0`,
          leadId: id,
          at: createdAt,
          kind: channel === 'visit' ? 'visit' : 'enquiry',
          by: 'customer',
          channel,
          text: enquiryText(service, eventLabel, eventDate),
        },
        {
          id: `${id}-a1`,
          leadId: id,
          at: contactedAt,
          kind: 'message_out',
          by: owner,
          channel: channel === 'instagram' ? 'instagram' : 'whatsapp',
          text: `Shared ${info.label.toLowerCase()} details and prices.`,
        },
      ];
      if (reachedInterested && BRIDAL.includes(service) && finalStage !== 'contacted') {
        acts.push({
          id: `${id}-a2`,
          leadId: id,
          at: interestedAt + 3 * HOUR,
          kind: 'quotation',
          by: owner,
          text: `Quotation sent: ${info.label}`,
          amount: value,
        });
      }
      history.slice(1).forEach((mark, k) => {
        const prev = history[k];
        acts.push({
          id: `${id}-s${k}`,
          leadId: id,
          at: mark.at,
          kind: 'stage',
          by: owner,
          text:
            mark.stage === 'lost'
              ? `Marked lost — ${lostReason ?? 'no reason given'}`
              : mark.stage === 'booked'
                ? 'Booked'
                : `Moved to ${STAGE_LABEL[mark.stage]}`,
          ...(prev ? { from: prev.stage } : {}),
          to: mark.stage,
        });
      });
      data.activities.push(...acts);

      // Payments for booked leads
      if (finalStage === 'booked') {
        const method = (): PaymentMethod =>
          rng.weighted([
            ['UPI', 62],
            ['Bank transfer', 24],
            ['Card', 9],
            ['Cash', 5],
          ] as const);
        const ref = (m: PaymentMethod) =>
          m === 'Cash'
            ? 'Paid at the studio'
            : `${m === 'UPI' ? 'UPI' : m === 'Card' ? 'Card' : 'NEFT'} ••${rng.int(1000, 9999).toString()}`;
        const add = (amount: number, at: number, kind: Payment['kind']) => {
          if (at > LAB_NOW - 2 * HOUR) return;
          const m = method();
          const verifiedAt = Math.min(at + rng.int(3, 26) * HOUR, LAB_NOW - 90 * MINUTE);
          data.payments.push({
            id: `${id}-p${data.payments.filter((p) => p.leadId === id).length.toString()}`,
            leadId: id,
            amount,
            method: m,
            reference: ref(m),
            kind,
            recordedAt: at,
            recordedBy: rng.chance(0.7) ? 'divya' : owner,
            status: 'verified',
            verifiedAt,
          });
        };
        const eventPaid = eventDate + 3 * HOUR;
        if (BRIDAL.includes(service)) {
          const advance = Math.round((value * 0.3) / 1000) * 1000;
          add(advance, bookedAt + rng.int(0, 5) * HOUR, 'Advance');
          add(value - advance, eventPaid, 'Balance');
        } else if (service === 'party') {
          add(value, eventPaid, 'Full payment');
        } else {
          add(5000, bookedAt + rng.int(0, 5) * HOUR, 'Advance');
          add(value - 5000, eventPaid, 'Balance');
        }
      }
    }
  }
  return data;
}
