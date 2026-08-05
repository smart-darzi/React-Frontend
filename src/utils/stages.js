// Single source of truth for the tailoring workflow and worker roles.
//
// Previously ViewOrders.jsx and WorkerPortal.jsx each hard-coded their own
// copy of STAGES (['Cutting','Sewing','Finishing','Designing']) — a made-up
// order that didn't correspond to any real worker role ("Designing" isn't
// a role anyone has, and "Finishing" was really Ironing). That's why the
// queue showed a workflow that made no sense next to the Workers list.
//
// The stages below now map 1:1 to the actual jobs a worker can have, in the
// real order a garment moves through the shop. Helper isn't tied to one
// stage — helpers can assist at any stage — so they aren't in STAGES, but
// they're still assignable everywhere.

export const STAGES = ['Cutting', 'Sewing', 'Embroidery', 'Ironing'];

// ── Master Tailor — a worker who takes an entire order start-to-finish
// themselves, instead of the order being split across a Cutter/Tailor/
// Embroidery/Ironing chain. They still move the order through the exact
// same Cutting -> Sewing -> Embroidery? -> Ironing stages as everyone else
// (see getEffectiveStages/isMasterTailorOrder below) — the only difference
// is nobody ever hands their orders off to a *different* worker along the
// way, and their orders carry a "Master Tailor" tag alongside the normal
// stage badge so their progress is still fully visible to the admin.
//
// FULL_ORDER_STAGE is kept only so any order saved with that literal stage
// value under an earlier version of this feature still renders sensibly
// (as plain text) instead of breaking — new orders never get this value.
export const FULL_ORDER_STAGE = 'Full Order';
export const MASTER_TAILOR_ROLE = 'Master Tailor / ماسٹر درزی';

// True if this worker's role is Master Tailor — used to auto-switch the
// Assign Worker popup into "Full Order" mode the moment the admin picks
// them, and to flag their orders distinctly on the Admin/Dashboard views.
export const isMasterTailorRole = (workerRole) => {
  if (!workerRole) return false;
  return workerRole.split(' /')[0].trim() === 'Master Tailor';
};

// Urdu labels for each stage — used anywhere a stage name is shown
// bilingually (e.g. the Dashboard's Order Flow pipeline cards).
export const STAGE_URDU_LABELS = {
  Cutting: 'کٹائی',
  Sewing: 'سلائی',
  Embroidery: 'کڑھائی',
  Ironing: 'استری',
  'Full Order': 'مکمل آرڈر',
};

// Roles offered on the Workers form — ordered to match the stage flow above,
// with Master Tailor (handles a whole order solo, separate from the stage
// chain), Helper (works across every stage), and Other listed at the end.
export const ROLES = [
  'Cutter / کٹر',
  'Tailor / درزی',
  'Embroidery / کڑھائی والا',
  'Ironing / استری والا',
  'Master Tailor / ماسٹر درزی',
  'Helper / مددگار',
  'Other / دیگر',
];

// Which role normally handles which stage — used to recommend/highlight the
// right worker when assigning a stage, without hard-restricting the choice
// (admin can still pick anyone, e.g. a Helper, for any stage).
const STAGE_ROLE = {
  Cutting: 'Cutter',
  Sewing: 'Tailor',
  Embroidery: 'Embroidery',
  Ironing: 'Ironing',
};

// True if this worker's role is the "natural" fit for the given stage, or
// if they're a Helper (helpers fit every stage) or a Master Tailor (someone
// who handles a whole order solo is just as capable at any single stage,
// so they're a good recommendation everywhere too — except inside
// FULL_ORDER_STAGE itself, where Master Tailor is the *only* exact fit).
export const isRecommendedForStage = (workerRole, stage) => {
  if (!workerRole || !stage) return false;
  const roleWord = workerRole.split(' /')[0].trim();
  if (stage === FULL_ORDER_STAGE) return roleWord === 'Master Tailor';
  if (roleWord === 'Helper' || roleWord === 'Master Tailor') return true;
  return roleWord === STAGE_ROLE[stage];
};

// Reverse lookup: given a worker's role, which stage do they normally work?
// Returns null for Helper/Other, since those aren't tied to one stage.
export const roleToStage = (workerRole) => {
  if (!workerRole) return null;
  const roleWord = workerRole.split(' /')[0].trim();
  const entry = Object.entries(STAGE_ROLE).find(([, role]) => role === roleWord);
  return entry ? entry[0] : null;
};

// An order only goes through Embroidery if the customer actually asked for
// embroidery on that order (formData.embroidery is 'Yes / ہاں' or 'No / کوئی
// نہیں'). Previously every order showed "Sewing Done → Move to Embroidery"
// regardless of that answer, so an order marked "Embroidery: No" would still
// sit in the Embroidery stage/queue. This derives the *effective* stage list
// per order, skipping Embroidery when it isn't wanted. Because this is
// computed from the order's current embroidery field every time (not stored),
// editing an order later (No -> Yes or Yes -> No) automatically changes what
// "next stage" means going forward.
//
// ✅ Master Tailor orders used to skip this entirely and collapse into one
// opaque "Full Order" stage — that hid real progress from both the worker
// and the admin ("kahan tak pahoncha hai?" had no answer). They now go
// through the exact same Cutting -> Sewing -> Embroidery? -> Ironing stages
// as any other order; see isMasterTailorOrder below for how the "same
// worker every stage, no hand-off" behavior is preserved instead.
export const getEffectiveStages = (order) => {
  const wantsEmbroidery = Boolean(order?.embroidery?.startsWith('Yes'));
  return wantsEmbroidery ? STAGES : STAGES.filter(s => s !== 'Embroidery');
};

// True if the worker currently assigned to this order is a Master Tailor —
// cross-references the order's assignedWorkerId against the workers list.
// Used purely as a display flag now (a "Master Tailor" tag alongside the
// normal stage badge) and to pre-select/lock the same worker for every
// stage hand-off in AssignWorkerModal, since a Master Tailor never gets
// swapped out for a different specialist at Sewing/Embroidery/Ironing.
export const isMasterTailorOrder = (order, workers) => {
  const w = workers?.find(w => w._id === order?.assignedWorkerId);
  return isMasterTailorRole(w?.role);
};

// ── Admin-facing status vocabulary ──────────────────────────────────────
// The backend/DB stores orderStatus as Pending / Active / Completed /
// Received By Customer (plus the wasReassigned flag). But that's not how
// the Admin actually thinks about a task moving through their hands:
//
//   1. Order comes in, Admin hasn't acted on it yet   -> Awaiting
//   2. Admin hands it to a worker                     -> Assigned
//   3. Worker's finished work isn't good enough, Admin
//      sends it back to be redone                     -> Re-Assign
//   4. Worker redoes it and Admin is happy this time   -> Approved
//   5. Customer has picked the finished item up        -> Delivered (final)
//
// This maps 1:1 onto the existing lifecycle so nothing about the DB schema
// or worker-facing flow has to change — it's purely a relabeling + one new
// boolean (wasReassigned) that remembers "this stage is being redone".
export const ADMIN_STATUSES = ['Awaiting', 'Assigned', 'Re-Assign', 'Approved', 'Delivered'];

export const ADMIN_STATUS_LABELS = {
  Awaiting: 'Awaiting / زیر التواء',
  Assigned: 'Assigned / تفویض شدہ',
  'Re-Assign': 'Re-Assign / دوبارہ تفویض',
  Approved: 'Approved / منظور شدہ',
  Delivered: 'Delivered / حوالے شدہ',
};

const ADMIN_STATUS_LABELS_EN = {
  Awaiting: 'Awaiting',
  Assigned: 'Assigned',
  'Re-Assign': 'Re-Assign',
  Approved: 'Approved',
  Delivered: 'Delivered',
};

const ADMIN_STATUS_LABELS_UR = {
  Awaiting: 'زیر التواء',
  Assigned: 'تفویض شدہ',
  'Re-Assign': 'دوبارہ تفویض',
  Approved: 'منظور شدہ',
  Delivered: 'حوالے شدہ',
};

// Tailwind color classes per admin status, shared by every admin screen so
// "Re-Assign" always reads as an alert color and "Delivered" always reads
// as the same final purple, no matter which page renders the badge.
export const ADMIN_STATUS_COLORS = {
  Awaiting: 'bg-amber-100 text-amber-600 border-amber-200',
  Assigned: 'bg-blue-100 text-blue-600 border-blue-200',
  'Re-Assign': 'bg-red-100 text-red-600 border-red-200',
  Approved: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  Delivered: 'bg-purple-100 text-purple-600 border-purple-200',
};

// Derives the Admin-facing status from the raw order fields.
export const getAdminStatus = (order) => {
  if (!order) return 'Awaiting';
  switch (order.orderStatus) {
    case 'Pending':
      return 'Awaiting';
    case 'Active':
      return order.wasReassigned ? 'Re-Assign' : 'Assigned';
    case 'Completed':
      return 'Approved';
    case 'Received By Customer':
      return 'Delivered';
    default:
      return order.orderStatus || 'Awaiting';
  }
};

export const getAdminStatusLabel = (order, lang) => {
  const status = getAdminStatus(order);
  if (lang === 'en') return ADMIN_STATUS_LABELS_EN[status] || status;
  if (lang === 'ur') return ADMIN_STATUS_LABELS_UR[status] || status;
  return ADMIN_STATUS_LABELS[status] || status;
};

export const getAdminStatusColor = (order) =>
  ADMIN_STATUS_COLORS[getAdminStatus(order)] || 'bg-slate-100 text-slate-600 border-slate-200';

// ── Worker-facing status vocabulary (happy path) ────────────────────────
// The worker's own view of whatever stage they currently hold, independent
// of the order's orderStatus/workStage (which only the Admin controls):
//
//   1. Task just handed to the worker, hasn't started    -> Pending
//   2. Worker taps "Start Work"                          -> In-Progress
//   3. Worker finishes and self-checks before sending it  -> Completed-Review
//   4. Worker sends the finished work to the Admin         -> Completed
//      (this is what actually notifies the Admin — same mechanism the old
//      single "Mark Done" button used)
//
// Alternate path — work gets stuck partway through:
//   In-Progress -> Blocked (worker hit a snag: fabric khatam, machine kharab,
//   waiting on something) -> once resolved, worker moves straight on to
//   Completed-Review -> Completed, same as the happy path from there.
// Either path (happy or blocked) ends the same way: Admin Approves, then
// Delivered.
export const WORKER_STATUSES = ['Pending', 'In-Progress', 'Blocked', 'Completed-Review', 'Completed'];

export const WORKER_STATUS_LABELS = {
  Pending: 'Pending / زیر التواء',
  'In-Progress': 'In-Progress / جاری ہے',
  Blocked: 'Blocked / رکاوٹ',
  'Completed-Review': 'Completed-Review / تکمیل — جائزہ باقی',
  Completed: 'Completed / مکمل',
};

// English-only / Urdu-only variants — used by pages that have adopted the
// single-language toggle (see LanguageContext). WORKER_STATUS_LABELS above
// (both languages combined) stays as-is for any page that hasn't been
// converted yet, so nothing else breaks.
export const WORKER_STATUS_LABELS_EN = {
  Pending: 'Pending',
  'In-Progress': 'In-Progress',
  Blocked: 'Blocked',
  'Completed-Review': 'Completed-Review',
  Completed: 'Completed',
};

export const WORKER_STATUS_LABELS_UR = {
  Pending: 'زیر التواء',
  'In-Progress': 'جاری ہے',
  Blocked: 'رکاوٹ',
  'Completed-Review': 'تکمیل — جائزہ باقی',
  Completed: 'مکمل',
};

export const WORKER_STATUS_COLORS = {
  Pending: 'bg-slate-100 text-slate-600 border-slate-200',
  'In-Progress': 'bg-blue-100 text-blue-600 border-blue-200',
  Blocked: 'bg-red-100 text-red-600 border-red-200',
  'Completed-Review': 'bg-amber-100 text-amber-600 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

export const getWorkerStatus = (order) => order?.workerStatus || 'Pending';

// `lang` is optional: pass 'en' or 'ur' from a page that's on the language
// toggle to get just that language; omit it to get the old combined
// "English / Urdu" string (unconverted pages keep working unchanged).
export const getWorkerStatusLabel = (order, lang) => {
  const status = getWorkerStatus(order);
  if (lang === 'en') return WORKER_STATUS_LABELS_EN[status] || status;
  if (lang === 'ur') return WORKER_STATUS_LABELS_UR[status] || status;
  return WORKER_STATUS_LABELS[status] || status;
};

export const getWorkerStatusColor = (order) =>
  WORKER_STATUS_COLORS[getWorkerStatus(order)] || 'bg-slate-100 text-slate-600 border-slate-200';

// True if this order's workerStatus counts as "actively being worked" —
// i.e. it isn't free for a new task to be started, and isn't yet sitting
// with the Admin for approval. Used to enforce "one order at a time" per
// worker: while any one of a worker's orders is In-Progress / Blocked /
// Completed-Review, every *other* order of theirs must stay un-startable.
export const isWorkerStatusActive = (order) =>
  ['In-Progress', 'Blocked', 'Completed-Review'].includes(getWorkerStatus(order));

// Given the worker's current status, what's the next one in the happy
// path? Returns null once "Completed" (nothing further the worker can do —
// it's with the Admin now).
export const getNextWorkerStatus = (order) => {
  const idx = WORKER_STATUSES.indexOf(getWorkerStatus(order));
  if (idx === -1 || idx === WORKER_STATUSES.length - 1) return null;
  return WORKER_STATUSES[idx + 1];
};

// Build a worker's real work history from every order's stageHistory log,
// instead of relying on the order's *current* assignedWorkerId. An order
// only stores one assignedWorkerId at a time, so once e.g. a Cutter finishes
// Cutting and the order moves on to a Tailor for Sewing, the Cutter's name is
// overwritten — they'd show "0 completed" forever even though they did real
// work. stageHistory keeps every stage+worker pair, so we use that instead.
export const getWorkerHistory = (orders, workerId) => {
  if (!workerId) return [];
  const id = workerId.toString();
  const entries = [];
  orders.forEach(order => {
    const log = order.stageHistory || [];
    log.forEach((entry, i) => {
      // An entry means "this worker was assigned to do `entry.stage`". It
      // only counts as *finished* once a later entry exists for the same
      // order (the order moved on to the next stage or to Done) — the very
      // last entry in the log is whatever is still in progress right now.
      const isFinished = i < log.length - 1;
      if (isFinished && entry.workerId?.toString() === id) {
        entries.push({ order, stage: entry.stage, at: entry.at });
      }
    });
  });
  return entries.sort((a, b) => new Date(b.at) - new Date(a.at));
};

// ── Customer-facing status vocabulary (simplified) ──────────────────────
// The customer doesn't need (and shouldn't see) the Admin's internal
// workflow (Awaiting/Assigned/Re-Assign/Approved/Delivered) or the raw
// backend orderStatus values (Pending/Active/Completed/Received By
// Customer — 4 values, one of which, "Re-Assign", would even look alarming
// to a customer for something that's a totally normal part of quality
// control). All a customer actually needs to know is: has the shop started
// yet, is it being made, or is it done — exactly 3 states:
//   1. Pending     — shop has the order, hasn't started yet
//   2. In Progress — currently being worked on, any stage
//   3. Completed   — Completed or Received By Customer: the item is
//      finished, whether it's still waiting at the shop for pickup or
//      already picked up — either way there's nothing left to "track".
export const CUSTOMER_STATUSES = ['Pending', 'In Progress', 'Completed'];

export const CUSTOMER_STATUS_LABELS = {
  Pending: 'Pending',
  'In Progress': 'In Progress',
  Completed: 'Completed',
};

export const CUSTOMER_STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-600 border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-600 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

export const getCustomerStatus = (order) => {
  if (!order) return 'Pending';
  switch (order.orderStatus) {
    case 'Pending':
      return 'Pending';
    case 'Active':
    case 'In Progress':
      return 'In Progress';
    case 'Completed':
    case 'Received By Customer':
      return 'Completed';
    default:
      return 'Pending';
  }
};

export const getCustomerStatusLabel = (order) =>
  CUSTOMER_STATUS_LABELS[getCustomerStatus(order)] || getCustomerStatus(order);

export const getCustomerStatusColor = (order) =>
  CUSTOMER_STATUS_COLORS[getCustomerStatus(order)] || 'bg-slate-100 text-slate-600 border-slate-200';
