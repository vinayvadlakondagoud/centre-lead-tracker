/**
 * Seed data — Centres, Owners, Leads, Follow-ups, Audit Logs
 * At least 20 realistic leads across multiple centres and statuses.
 */

exports.seed = async function (knex) {
  // Clear in order (foreign keys)
  await knex('status_audit_logs').del();
  await knex('archive_logs').del();
  await knex('followups').del();
  await knex('leads').del();
  await knex('owners').del();
  await knex('centres').del();

  // ── Centres ──────────────────────────────────────────────────────
  await knex('centres').insert([
    { name: 'Tickle Right - Andheri', city: 'Mumbai', address: '123 Link Road, Andheri West', phone: '+91 22 2674 1001' },
    { name: 'Tickle Right - Thane', city: 'Mumbai', address: '45 Ghodbunder Road, Thane West', phone: '+91 22 2589 2002' },
    { name: 'Tickle Right - Powai', city: 'Mumbai', address: '78 Powai Lake Road, Hiranandani', phone: '+91 22 2570 3003' },
    { name: 'Tickle Right - Baner', city: 'Pune', address: '22 Baner Road, near Reliance Mart', phone: '+91 20 2729 4004' },
    { name: 'Tickle Right - Kothrud', city: 'Pune', address: '56 Karve Road, Kothrud', phone: '+91 20 2546 5005' },
  ]);

  const centres = await knex('centres').select('id').orderBy('id');
  const centreIds = centres.map((c) => c.id);

  // ── Owners ──────────────────────────────────────────────────────
  await knex('owners').insert([
    { name: 'Priya Sharma', email: 'priya@tinkerright.com', phone: '9876540001', is_admin: true },
    { name: 'Rahul Desai', email: 'rahul@tinkerright.com', phone: '9876540002', is_admin: false },
    { name: 'Ananya Patel', email: 'ananya@tinkerright.com', phone: '9876540003', is_admin: false },
    { name: 'Vikram Joshi', email: 'vikram@tinkerright.com', phone: '9876540004', is_admin: false },
  ]);

  const owners = await knex('owners').select('id').orderBy('id');
  const ownerIds = owners.map((o) => o.id);

  // Helper to get a past/future date string
  const daysFromNow = (d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 19).replace('T', ' ');
  };
  const daysAgo = (d) => daysFromNow(-d);

  // ── Leads (25 total) ─────────────────────────────────────────────
  const leadsData = [
    {
      parent_name: 'Meera Nair', child_name: 'Aditya Nair', child_age: 6,
      phone: '+91 98765 43210', phone_normalized: '9876543210', email: 'meera.nair@gmail.com',
      centre_id: centreIds[0], source: 'Website', owner_id: ownerIds[0],
      status: 'New', next_followup_at: daysFromNow(1), notes: 'Interested in weekend batch',
    },
    {
      parent_name: 'Sanjay Gupta', child_name: 'Aanya Gupta', child_age: 8,
      phone: '9123456789', phone_normalized: '9123456789', email: 'sanjay.g@outlook.com',
      centre_id: centreIds[1], source: 'Referral', owner_id: ownerIds[1],
      status: 'Contacted', next_followup_at: daysFromNow(2), notes: 'Referred by Meera Nair',
    },
    {
      parent_name: 'Fatima Khan', child_name: 'Zayed Khan', child_age: 5,
      phone: '+91-87654-32109', phone_normalized: '8765432109', email: 'fatima.k@yahoo.com',
      centre_id: centreIds[2], source: 'Walk-in', owner_id: ownerIds[2],
      status: 'Demo Scheduled', next_followup_at: daysFromNow(3), notes: 'Demo on Saturday 10 AM',
    },
    {
      parent_name: 'Rajesh Iyer', child_name: 'Meena Iyer', child_age: 7,
      phone: '  7654321098', phone_normalized: '7654321098', email: 'rajesh.iyer@gmail.com',
      centre_id: centreIds[3], source: 'Social Media', owner_id: ownerIds[3],
      status: 'Demo Completed', next_followup_at: daysFromNow(-1), notes: 'Loved the demo, asking about fees',
    },
    {
      parent_name: 'Sunita Reddy', child_name: 'Kiran Reddy', child_age: 9,
      phone: '+916543210987', phone_normalized: '6543210987', email: 'sunita.reddy@hotmail.com',
      centre_id: centreIds[4], source: 'Website', owner_id: ownerIds[0],
      status: 'Converted', next_followup_at: null, notes: 'Enrolled in weekday batch. Payment done.',
    },
    {
      parent_name: 'Amit Deshmukh', child_name: 'Rohan Deshmukh', child_age: 6,
      phone: '9812345670', phone_normalized: '9812345670', email: 'amit.d@gmail.com',
      centre_id: centreIds[0], source: 'Referral', owner_id: ownerIds[1],
      status: 'Lost', next_followup_at: null, notes: 'Chose competitor — Brainywood',
    },
    {
      parent_name: 'Lakshmi Menon', child_name: 'Arjun Menon', child_age: 10,
      phone: '+91 90000 11111', phone_normalized: '9000011111', email: 'lakshmi.m@outlook.com',
      centre_id: centreIds[1], source: 'Walk-in', owner_id: ownerIds[2],
      status: 'New', next_followup_at: daysFromNow(0), notes: 'Walked in during evening. Wants trial class.',
    },
    {
      parent_name: 'Deepak Verma', child_name: 'Nisha Verma', child_age: 7,
      phone: '0112233445', phone_normalized: '0112233445', email: 'deepak.v@gmail.com',
      centre_id: centreIds[2], source: 'Website', owner_id: ownerIds[3],
      status: 'Contacted', next_followup_at: daysFromNow(-2), notes: 'Called twice, no response after first call',
    },
    {
      parent_name: 'Pooja Banerjee', child_name: 'Aritro Banerjee', child_age: 5,
      phone: '+91-77889-90011', phone_normalized: '7788990011', email: 'pooja.b@yahoo.com',
      centre_id: centreIds[3], source: 'Social Media', owner_id: ownerIds[0],
      status: 'New', next_followup_at: daysFromNow(1), notes: 'Responded to Instagram ad',
    },
    {
      parent_name: 'Vikash Singh', child_name: 'Tanvi Singh', child_age: 8,
      phone: '8877665544', phone_normalized: '8877665544', email: 'vikash.s@gmail.com',
      centre_id: centreIds[4], source: 'Referral', owner_id: ownerIds[1],
      status: 'Demo Scheduled', next_followup_at: daysFromNow(4), notes: 'Demo planned for next week',
    },
    {
      parent_name: 'Neha Kapoor', child_name: 'Rishabh Kapoor', child_age: 6,
      phone: '+91 99887 76655', phone_normalized: '9988776655', email: 'neha.k@hotmail.com',
      centre_id: centreIds[0], source: 'Walk-in', owner_id: ownerIds[2],
      status: 'Contacted', next_followup_at: daysFromNow(1), notes: 'Interested in STEM program',
    },
    {
      parent_name: 'Suresh Pillai', child_name: 'Devika Pillai', child_age: 9,
      phone: '9112233445', phone_normalized: '9112233445', email: 'suresh.p@gmail.com',
      centre_id: centreIds[1], source: 'Website', owner_id: ownerIds[3],
      status: 'Demo Completed', next_followup_at: daysFromNow(-3), notes: 'Parent liked demo but wants to discuss with spouse',
    },
    {
      parent_name: 'Anjali Rao', child_name: 'Karthik Rao', child_age: 7,
      phone: '+91-66778-89900', phone_normalized: '6677889900', email: 'anjali.rao@outlook.com',
      centre_id: centreIds[2], source: 'Referral', owner_id: ownerIds[0],
      status: 'New', next_followup_at: daysFromNow(2), notes: 'Referred by Lakshmi Menon',
    },
    {
      parent_name: 'Mohammed Farhan', child_name: 'Ayesha Farhan', child_age: 5,
      phone: '8445566778', phone_normalized: '8445566778', email: 'farhan.m@yahoo.com',
      centre_id: centreIds[3], source: 'Social Media', owner_id: ownerIds[1],
      status: 'Converted', next_followup_at: null, notes: 'Enrolled for summer camp. Very happy.',
    },
    {
      parent_name: 'Kavita Joshi', child_name: 'Adwait Joshi', child_age: 10,
      phone: '+91 73344 55667', phone_normalized: '7334455667', email: 'kavita.j@gmail.com',
      centre_id: centreIds[4], source: 'Walk-in', owner_id: ownerIds[2],
      status: 'Lost', next_followup_at: null, notes: 'Budget constraints — may revisit in 6 months',
    },
    {
      parent_name: 'Ramesh Nambiar', child_name: 'Sneha Nambiar', child_age: 8,
      phone: '0987123456', phone_normalized: '0987123456', email: 'ramesh.n@gmail.com',
      centre_id: centreIds[0], source: 'Website', owner_id: ownerIds[3],
      status: 'Contacted', next_followup_at: daysFromNow(0), notes: 'Emailed brochure, waiting for response',
    },
    {
      parent_name: 'Shruti Agarwal', child_name: 'Manav Agarwal', child_age: 6,
      phone: '+91-82233-44556', phone_normalized: '8223344556', email: 'shruti.a@hotmail.com',
      centre_id: centreIds[1], source: 'Referral', owner_id: ownerIds[0],
      status: 'New', next_followup_at: daysFromNow(3), notes: 'From Delhi, relocating to Mumbai next month',
    },
    {
      parent_name: 'Arvind Menon', child_name: 'Diya Menon', child_age: 7,
      phone: '9556677889', phone_normalized: '9556677889', email: 'arvind.m@outlook.com',
      centre_id: centreIds[2], source: 'Social Media', owner_id: ownerIds[1],
      status: 'Demo Scheduled', next_followup_at: daysFromNow(5), notes: 'Demo booked for 10:30 AM',
    },
    {
      parent_name: 'Pallavi Deshpande', child_name: 'Omkar Deshpande', child_age: 9,
      phone: '+91 70011 22334', phone_normalized: '7001122334', email: 'pallavi.d@gmail.com',
      centre_id: centreIds[3], source: 'Walk-in', owner_id: ownerIds[2],
      status: 'Converted', next_followup_at: null, notes: 'Full year enrollment. Paid in advance.',
    },
    {
      parent_name: 'Ganesh Kulkarni', child_name: 'Samar Kulkarni', child_age: 5,
      phone: '8112233445', phone_normalized: '8112233445', email: 'ganesh.k@yahoo.com',
      centre_id: centreIds[4], source: 'Website', owner_id: ownerIds[3],
      status: 'Contacted', next_followup_at: daysFromNow(-1), notes: 'Sent pricing details',
    },
    {
      parent_name: 'Rekha Bhat', child_name: 'Nikhil Bhat', child_age: 8,
      phone: '+91-90088-77665', phone_normalized: '9008877665', email: 'rekha.b@gmail.com',
      centre_id: centreIds[0], source: 'Referral', owner_id: ownerIds[1],
      status: 'New', next_followup_at: daysFromNow(1), notes: 'Friend recommended the coding program',
    },
    {
      parent_name: 'Sunil Kadam', child_name: 'Prachi Kadam', child_age: 6,
      phone: '7665544332', phone_normalized: '7665544332', email: 'sunil.k@outlook.com',
      centre_id: centreIds[1], source: 'Social Media', owner_id: ownerIds[2],
      status: 'Demo Completed', next_followup_at: daysFromNow(-5), notes: 'Great engagement during demo. Follow up for decision.',
    },
    {
      parent_name: 'Divya Iyengar', child_name: 'Rahul Iyengar', child_age: 10,
      phone: '+91 85544 33221', phone_normalized: '8554433221', email: 'divya.i@hotmail.com',
      centre_id: centreIds[2], source: 'Walk-in', owner_id: ownerIds[0],
      status: 'Lost', next_followup_at: null, notes: 'Moved to another city',
    },
    {
      parent_name: 'Karthik Shetty', child_name: 'Isha Shetty', child_age: 7,
      phone: '9443322110', phone_normalized: '9443322110', email: 'karthik.s@gmail.com',
      centre_id: centreIds[3], source: 'Website', owner_id: ownerIds[3],
      status: 'New', next_followup_at: daysFromNow(2), notes: 'Filled enquiry form on website',
    },
    {
      parent_name: 'Asha Kulkarni', child_name: 'Pranav Kulkarni', child_age: 5,
      phone: '+91-83322-11009', phone_normalized: '8332211009', email: 'asha.k@outlook.com',
      centre_id: centreIds[4], source: 'Referral', owner_id: ownerIds[1],
      status: 'Contacted', next_followup_at: daysFromNow(1), notes: 'Called, spoke to husband. Both interested.',
    },
  ];

  await knex('leads').insert(leadsData);

  const leads = await knex('leads').select('id').orderBy('id');
  const leadIds = leads.map((l) => l.id);

  // ── Follow-ups (for contacted+ leads) ────────────────────────────
  const followupsData = [
    // Lead 2 (Sanjay — Contacted)
    { lead_id: leadIds[1], followed_up_at: daysAgo(3), channel: 'Phone', outcome: 'Reached', notes: 'Spoke with Sanjay. He wants weekend batch info.', next_followup_at: daysFromNow(2) },
    // Lead 4 (Rajesh — Demo Completed)
    { lead_id: leadIds[3], followed_up_at: daysAgo(5), channel: 'Phone', outcome: 'Reached', notes: 'Scheduled demo for Saturday.', next_followup_at: daysAgo(2) },
    { lead_id: leadIds[3], followed_up_at: daysAgo(2), channel: 'In-Person', outcome: 'Interested', notes: 'Demo went well. Child enjoyed coding activity.', next_followup_at: daysFromNow(-1) },
    // Lead 5 (Sunita — Converted)
    { lead_id: leadIds[4], followed_up_at: daysAgo(10), channel: 'Phone', outcome: 'Reached', notes: 'Discussed pricing and batch timing.', next_followup_at: daysAgo(7) },
    { lead_id: leadIds[4], followed_up_at: daysAgo(7), channel: 'WhatsApp', outcome: 'Interested', notes: 'Sent fee structure. Confirmed enrollment.', next_followup_at: daysAgo(5) },
    { lead_id: leadIds[4], followed_up_at: daysAgo(5), channel: 'In-Person', outcome: 'Reached', notes: 'Payment completed. Enrolled for weekday batch.', next_followup_at: null },
    // Lead 7 (Lakshmi — New, overdue)
    { lead_id: leadIds[6], followed_up_at: daysAgo(1), channel: 'In-Person', outcome: 'Reached', notes: 'Walk-in enquiry. Took her contact. Will call tomorrow.', next_followup_at: daysFromNow(0) },
    // Lead 8 (Deepak — Contacted, overdue)
    { lead_id: leadIds[7], followed_up_at: daysAgo(4), channel: 'Phone', outcome: 'No Response', notes: 'Called twice. No response.', next_followup_at: daysFromNow(-2) },
    { lead_id: leadIds[7], followed_up_at: daysAgo(2), channel: 'Email', outcome: 'Reached', notes: 'Sent follow-up email with brochure.', next_followup_at: daysFromNow(-2) },
    // Lead 11 (Neha — Contacted)
    { lead_id: leadIds[10], followed_up_at: daysAgo(1), channel: 'Phone', outcome: 'Reached', notes: 'Discussed STEM program. Parent interested.', next_followup_at: daysFromNow(1) },
    // Lead 12 (Suresh — Demo Completed, overdue)
    { lead_id: leadIds[11], followed_up_at: daysAgo(4), channel: 'Phone', outcome: 'Reached', notes: 'Demo done. Parent liked it.', next_followup_at: daysAgo(3) },
    // Lead 16 (Ramesh — Contacted, today)
    { lead_id: leadIds[15], followed_up_at: daysAgo(1), channel: 'Email', outcome: 'Reached', notes: 'Emailed brochure and pricing.', next_followup_at: daysFromNow(0) },
    // Lead 20 (Ganesh — Contacted, overdue)
    { lead_id: leadIds[19], followed_up_at: daysAgo(2), channel: 'Phone', outcome: 'Reached', notes: 'Spoke briefly. Sent pricing.', next_followup_at: daysFromNow(-1) },
    // Lead 22 (Sunil — Demo Completed, overdue)
    { lead_id: leadIds[21], followed_up_at: daysAgo(6), channel: 'Phone', outcome: 'Reached', notes: 'Great demo. Child loved it.', next_followup_at: daysAgo(5) },
    { lead_id: leadIds[21], followed_up_at: daysAgo(5), channel: 'WhatsApp', outcome: 'Rescheduled', notes: 'Parent needs time to decide. Will follow up next week.', next_followup_at: daysFromNow(-5) },
    // Lead 25 (Asha — Contacted)
    { lead_id: leadIds[24], followed_up_at: daysAgo(1), channel: 'Phone', outcome: 'Reached', notes: 'Spoke to both parents. Both interested.', next_followup_at: daysFromNow(1) },
  ];

  await knex('followups').insert(followupsData);

  // ── Status Audit Logs ────────────────────────────────────────────
  const auditData = [
    // Lead 6 (Priyanka — Converted)
    { lead_id: leadIds[5], old_status: null, new_status: 'New', changed_by: 'system', reason: 'Lead created' },
    { lead_id: leadIds[5], old_status: 'New', new_status: 'Contacted', changed_by: 'system', reason: 'Auto-advance: followup outcome "Interested"' },
    { lead_id: leadIds[5], old_status: 'Contacted', new_status: 'Demo Scheduled', changed_by: 'owner:2', reason: 'Demo booked for Saturday' },
    { lead_id: leadIds[5], old_status: 'Demo Scheduled', new_status: 'Demo Completed', changed_by: 'owner:2', reason: null },
    { lead_id: leadIds[5], old_status: 'Demo Completed', new_status: 'Converted', changed_by: 'owner:2', reason: 'Parent signed up for 6-month plan' },
    // Lead 7 (Amit — Lost)
    { lead_id: leadIds[6], old_status: null, new_status: 'New', changed_by: 'system', reason: 'Lead created' },
    { lead_id: leadIds[6], old_status: 'New', new_status: 'Contacted', changed_by: 'system', reason: 'Auto-advance: followup outcome "Connected"' },
    { lead_id: leadIds[6], old_status: 'Contacted', new_status: 'Lost', changed_by: 'owner:3', reason: 'Chose competitor near home' },
    // Lead 10 (Sanjay — Converted)
    { lead_id: leadIds[9], old_status: null, new_status: 'New', changed_by: 'system', reason: 'Lead created' },
    { lead_id: leadIds[9], old_status: 'New', new_status: 'Contacted', changed_by: 'system', reason: 'Auto-advance: followup outcome "Interested"' },
    { lead_id: leadIds[9], old_status: 'Contacted', new_status: 'Demo Scheduled', changed_by: 'owner:4', reason: null },
    { lead_id: leadIds[9], old_status: 'Demo Scheduled', new_status: 'Demo Completed', changed_by: 'owner:4', reason: null },
    { lead_id: leadIds[9], old_status: 'Demo Completed', new_status: 'Converted', changed_by: 'owner:4', reason: 'Enrolled for summer batch' },
    // Admin override example
    { lead_id: leadIds[11], old_status: 'Demo Completed', new_status: 'Contacted', changed_by: 'admin', reason: 'Admin status override — parent requested re-evaluation' },
  ];

  await knex('status_audit_logs').insert(auditData);
};
