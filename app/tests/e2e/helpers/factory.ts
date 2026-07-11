import * as crypto from "node:crypto";
import { createAdminClient } from "../../../src/db/admin";
import { loadE2eEnv } from "./env";

export type AdminClient = ReturnType<typeof createAdminClient>;

export type SeededMember = {
  userId: string;
  membershipId: string;
  email: string;
  password: string;
  name: string;
  graduationYear: number;
};

export type MemberOverrides = {
  name?: string;
  graduationYear?: number;
  city?: string;
  currentEmployer?: string;
  currentTitle?: string;
  university?: string;
  major?: string;
  linkedinUrl?: string;
  bio?: string;
  skills?: string[];
  careerHistory?: Array<{
    employer: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }>;
  educationHistory?: Array<{
    school: string;
    degree: string | null;
    field: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  openToHelp?: boolean;
  helperTopics?: string[];
  maxPendingRequests?: number;
  pausedAt?: string;
  adminRole?: "super_admin" | "admin" | "event_moderator" | "ambassador";
  onboardingCompleted?: boolean;
};

// One TestScenario per spec file: everything it seeds carries a unique run id,
// and destroy() removes it all (auth-user deletes cascade to member-owned rows,
// the org delete cascades to events/invites/announcements).
export class TestScenario {
  readonly runId: string;
  readonly admin: AdminClient;
  readonly password = "integ-suite-password-1";
  orgId = "";
  orgName = "";
  orgSlug = "";
  private seededUserIds: string[] = [];

  constructor(scenarioName: string) {
    loadE2eEnv();
    this.runId = `${scenarioName}-${crypto.randomBytes(4).toString("hex")}`;
    this.admin = createAdminClient();
  }

  // Resend's delivered@resend.dev sink accepts +labels, so notification emails
  // triggered by test actions never bounce against a real domain.
  emailFor(role: string): string {
    return `delivered+test_${this.runId}_${role}@resend.dev`;
  }

  async createOrg(): Promise<string> {
    this.orgName = `Integ Test Org ${this.runId}`;
    this.orgSlug = `test-org-${this.runId}`;
    const { data, error } = await this.admin
      .from("organizations")
      .insert({ name: this.orgName, slug: this.orgSlug })
      .select("id")
      .single();
    if (error) throw new Error(`createOrg failed: ${error.message}`);
    this.orgId = data.id;
    return this.orgId;
  }

  async createMember(role: string, overrides: MemberOverrides = {}): Promise<SeededMember> {
    if (!this.orgId) await this.createOrg();
    const email = this.emailFor(role);
    const name = overrides.name ?? `Test ${role.charAt(0).toUpperCase()}${role.slice(1)} ${this.runId.slice(-4)}`;
    const graduationYear = overrides.graduationYear ?? 2015;

    const { data: created, error: createErr } = await this.admin.auth.admin.createUser({
      email,
      password: this.password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr || !created.user) {
      throw new Error(`auth.admin.createUser(${email}) failed: ${createErr?.message}`);
    }
    const userId = created.user.id;
    this.seededUserIds.push(userId);

    if (overrides.onboardingCompleted !== false) {
      const { error } = await this.admin
        .from("users")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw new Error(`marking onboarding complete failed: ${error.message}`);
    }

    const { error: baseErr } = await this.admin.from("base_profiles").insert({
      user_id: userId,
      name,
      city: overrides.city ?? "Los Angeles",
      current_employer: overrides.currentEmployer ?? "Integ Test Co",
      current_title: overrides.currentTitle ?? "Engineer",
      university: overrides.university ?? "Test University",
      major: overrides.major ?? "Computer Science",
      linkedin_url: overrides.linkedinUrl ?? null,
      skills: overrides.skills ?? null,
      career_history: overrides.careerHistory ?? null,
      education_history: overrides.educationHistory ?? null,
    });
    if (baseErr) throw new Error(`base_profiles insert failed: ${baseErr.message}`);

    const { data: membership, error: memberErr } = await this.admin
      .from("organization_memberships")
      .insert({
        user_id: userId,
        organization_id: this.orgId,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (memberErr) throw new Error(`organization_memberships insert failed: ${memberErr.message}`);
    const membershipId = membership.id;

    const { error: orgProfileErr } = await this.admin.from("organization_profiles").insert({
      organization_membership_id: membershipId,
      graduation_year: graduationYear,
      bio: overrides.bio ?? null,
      open_to_mentor: overrides.openToHelp ?? false,
      mentoring_topics: overrides.helperTopics ?? null,
    });
    if (orgProfileErr) throw new Error(`organization_profiles insert failed: ${orgProfileErr.message}`);

    if (overrides.openToHelp) {
      const { error: helperErr } = await this.admin.from("helper_preferences").insert({
        organization_membership_id: membershipId,
        open_to_advice: true,
        open_to_mentorship: true,
        topics: overrides.helperTopics ?? ["careers"],
        max_pending_requests: overrides.maxPendingRequests ?? 10,
        paused_at: overrides.pausedAt ?? null,
      });
      if (helperErr) throw new Error(`helper_preferences insert failed: ${helperErr.message}`);
    }

    if (overrides.adminRole) {
      const { error: roleErr } = await this.admin.from("admin_role_assignments").insert({
        user_id: userId,
        organization_id: this.orgId,
        role: overrides.adminRole,
      });
      if (roleErr) throw new Error(`admin_role_assignments insert failed: ${roleErr.message}`);
    }

    return { userId, membershipId, email, password: this.password, name, graduationYear };
  }

  async createInvite(opts: {
    email?: string;
    fullName?: string;
    graduationYear?: number;
    expiresInDays?: number;
    status?: "pending" | "accepted" | "expired" | "revoked";
  } = {}): Promise<{ token: string; email: string }> {
    if (!this.orgId) await this.createOrg();
    const token = crypto.randomBytes(32).toString("base64url");
    const email = opts.email ?? this.emailFor(`invitee-${crypto.randomBytes(3).toString("hex")}`);
    const expiresAt = new Date(Date.now() + (opts.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);
    const { error } = await this.admin.from("invites").insert({
      organization_id: this.orgId,
      email,
      token,
      status: opts.status ?? "pending",
      full_name: opts.fullName ?? `Test Invitee ${this.runId.slice(-4)}`,
      graduation_year: opts.graduationYear ?? 2020,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw new Error(`invites insert failed: ${error.message}`);
    return { token, email };
  }

  trackUser(userId: string) {
    this.seededUserIds.push(userId);
  }

  async createFriendship(userId1: string, userId2: string): Promise<void> {
    const [a, b] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    const { error } = await this.admin.from("friendships").insert({ user_a_id: a, user_b_id: b });
    if (error) throw new Error(`friendships insert failed: ${error.message}`);
  }

  async createFriendRequest(
    senderId: string,
    receiverId: string,
    message?: string,
  ): Promise<string> {
    const { data, error } = await this.admin
      .from("friend_requests")
      .insert({ sender_id: senderId, receiver_id: receiverId, message: message ?? null })
      .select("id")
      .single();
    if (error) throw new Error(`friend_requests insert failed: ${error.message}`);
    return data.id;
  }

  async createAsk(opts: {
    askerId: string;
    helperId: string;
    helpNeeded: string;
    status?: "pending" | "accepted" | "declined" | "expired";
  }): Promise<string> {
    const { data, error } = await this.admin
      .from("asks")
      .insert({
        organization_id: this.orgId,
        asker_id: opts.askerId,
        helper_id: opts.helperId,
        ask_type: "advice",
        help_needed: opts.helpNeeded,
        status: opts.status ?? "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(`asks insert failed: ${error.message}`);
    return data.id;
  }

  async createEvent(opts: {
    title: string;
    startsInDays?: number;
    location?: string;
    description?: string;
    capacity?: number;
    published?: boolean;
    createdBy?: string;
  }): Promise<string> {
    if (!this.orgId) await this.createOrg();
    const startsAt = new Date(Date.now() + (opts.startsInDays ?? 7) * 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const { data, error } = await this.admin
      .from("events")
      .insert({
        organization_id: this.orgId,
        title: opts.title,
        description: opts.description ?? null,
        location: opts.location ?? null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: opts.capacity ?? null,
        published_at: opts.published === false ? null : new Date().toISOString(),
        created_by: opts.createdBy ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`events insert failed: ${error.message}`);
    return data.id;
  }

  async createAnnouncement(opts: {
    title: string;
    body?: string;
    published?: boolean;
    createdBy?: string;
  }): Promise<string> {
    if (!this.orgId) await this.createOrg();
    const { data, error } = await this.admin
      .from("announcements")
      .insert({
        organization_id: this.orgId,
        title: opts.title,
        body: opts.body ?? null,
        published_at: opts.published === false ? null : new Date().toISOString(),
        created_by: opts.createdBy ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`announcements insert failed: ${error.message}`);
    return data.id;
  }

  async destroy(): Promise<void> {
    for (const userId of this.seededUserIds) {
      const { error } = await this.admin.auth.admin.deleteUser(userId);
      if (error) console.warn(`cleanup: deleteUser(${userId}) failed: ${error.message}`);
    }
    this.seededUserIds = [];
    if (this.orgId) {
      const { error } = await this.admin.from("organizations").delete().eq("id", this.orgId);
      if (error) console.warn(`cleanup: delete org ${this.orgId} failed: ${error.message}`);
      this.orgId = "";
    }
  }
}
