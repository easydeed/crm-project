import { FEW_CLOSINGS } from '@/signup/closings-count'

/** Every sentence on the step-2 screen, in one place so the tests read the same words. */
export const START_COPY = {
  intro:
    "Add the homes you've sold, upload your own list of past clients, or both. For a home you sold, the monthly note goes to whoever lives there now, who may not be your client.",
  findTitle: 'Find my closings',
  idLabel: 'Your MLS agent ID',
  idHelp: "It's on your MLS profile page. Not sure? Use the next option.",
  uploadTitle: 'Upload a list',
  skip: 'Skip for now',
  searching: 'Searching your MLS.',
  /** Said plainly, at full contrast: the recipient of a listing-side sale is the buyer, not the agent's client. */
  listingSideNote:
    "The note goes to whoever lives there now. For a home you listed, that's usually the buyer, not the seller you represented. Your past clients come from your own list, which you can upload below.",
  /** Followed by fewLink, which points at the upload section. */
  fewNote: "That's fewer than we'd expect. Buyer-side sales usually aren't listed under your ID —",
  fewLink: 'add those here',
  nothing:
    "We couldn't find closings under that ID. That's common if you mostly represent buyers.",
  whereTitle: 'Where do I find my agent ID?',
  whereBody:
    'Sign in to your MLS and open your profile page. Your agent ID is listed there, usually near your name. It is not your DRE number.',
  noEmailLink: 'Add their emails',
} as const

export function foundLine(count: number) {
  return count === 1
    ? "We found 1 home you've sold. Untick it if you'd rather leave it out."
    : `We found ${count} homes you've sold. Untick any you'd rather leave out.`
}

export function isFew(count: number) {
  return count > 0 && count < FEW_CLOSINGS
}

export function confirmLabel(count: number) {
  return count === 1 ? 'Use this 1' : `Use these ${count}`
}

export function tickedLine(ticked: number, total: number) {
  return `${ticked} of ${total} ticked`
}

/** Plain about the limit: no email comes from the MLS, and nothing sends without one. */
export function addedLine(added: number) {
  const homes = added === 1 ? '1 home added.' : `${added} homes added.`
  return `${homes} We don't get email addresses from the MLS, so add those next — we can't send without one.`
}
