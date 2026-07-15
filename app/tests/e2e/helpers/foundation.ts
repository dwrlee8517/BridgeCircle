import * as crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../src/db/admin";
import type { Database } from "../../../src/db/database.types";
import { loadE2eEnv } from "./env";

export type FoundationMember = {
  userId: string;
  membershipId: string;
  email: string;
  password: string;
  name: string;
};

export class FoundationScenario {
  readonly admin: ReturnType<typeof createAdminClient>;
  readonly password = "foundation-suite-password-1";
  private readonly organizationIds: string[] = [];
  private readonly createdUserIds: string[] = [];
  private readonly extraMembershipIds: string[] = [];
  private readonly avatarPaths: string[] = [];

  constructor() {
    loadE2eEnv();
    this.admin = createAdminClient();
  }

  async createOrganization(requiresAdminApproval: boolean, label = "Circle") {
    const suffix = crypto.randomBytes(4).toString("hex");
    const { data, error } = await this.admin
      .from("organizations")
      .insert({
        name: `${label} ${suffix}`,
        slug: `foundation-${suffix}`,
        requires_admin_approval: requiresAdminApproval,
      })
      .select("id, name")
      .single();
    if (error) throw new Error(`createOrganization: ${error.message}`);
    this.organizationIds.push(data.id);
    return data;
  }

  async createInvite(
    organizationId: string,
    options: { status?: "pending" | "expired" | "revoked"; fullName?: string } = {},
  ) {
    const token = crypto.randomBytes(32).toString("base64url");
    const email = `foundation+${crypto.randomBytes(6).toString("hex")}@example.com`;
    const expiresAt =
      options.status === "expired"
        ? new Date(Date.now() - 60_000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const tokenHash = `\\x${crypto.createHash("sha256").update(token).digest("hex")}`;
    const { error } = await this.admin.from("invites").insert({
      organization_id: organizationId,
      email,
      email_normalized: email.toLowerCase(),
      token_hash: tokenHash,
      status: options.status ?? "pending",
      full_name: options.fullName ?? "Foundation Member",
      graduation_year: 2018,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw new Error(`createInvite: ${error.message}`);
    return { token, email };
  }

  async trackAcceptedUser(email: string) {
    const { data } = await this.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = data.users.find((candidate) => candidate.email === email);
    if (!user) throw new Error(`accepted Auth user not found for ${email}`);
    this.createdUserIds.push(user.id);
    return user.id;
  }

  async createAdministrator(organizationId: string) {
    const email = `foundation-admin+${crypto.randomBytes(5).toString("hex")}@example.com`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password: this.password,
      email_confirm: true,
      user_metadata: { full_name: "Foundation Admin" },
    });
    if (error || !data.user) throw new Error(`createAdministrator: ${error?.message}`);
    this.createdUserIds.push(data.user.id);

    const { data: membership, error: membershipError } = await this.admin
      .from("organization_memberships")
      .insert({
        user_id: data.user.id,
        organization_id: organizationId,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (membershipError) throw new Error(`createAdministrator membership: ${membershipError.message}`);
    await this.admin.from("profiles").insert({ user_id: data.user.id, display_name: "Foundation Admin" });
    await this.admin.from("organization_profiles").insert({
      organization_id: organizationId,
      organization_membership_id: membership.id,
      graduation_year: 2005,
    });
    const { error: roleError } = await this.admin.from("admin_role_assignments").insert({
      organization_id: organizationId,
      organization_membership_id: membership.id,
      role: "admin",
    });
    if (roleError) throw new Error(`createAdministrator role: ${roleError.message}`);
    return { email };
  }

  async createMember(
    organizationId: string,
    label = "Member",
  ): Promise<FoundationMember> {
    const suffix = crypto.randomBytes(5).toString("hex");
    const email = `foundation-member+${suffix}@example.com`;
    const name = `Foundation ${label}`;
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password: this.password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) throw new Error(`createMember: ${error?.message}`);
    this.createdUserIds.push(data.user.id);

    const { error: userError } = await this.admin
      .from("users")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", data.user.id);
    if (userError) throw new Error(`createMember user: ${userError.message}`);

    const { data: membership, error: membershipError } = await this.admin
      .from("organization_memberships")
      .insert({
        user_id: data.user.id,
        organization_id: organizationId,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (membershipError) throw new Error(`createMember membership: ${membershipError.message}`);

    const { error: profileError } = await this.admin.from("profiles").upsert({
      user_id: data.user.id,
      display_name: name,
    });
    if (profileError) throw new Error(`createMember profile: ${profileError.message}`);

    const { error: organizationProfileError } = await this.admin
      .from("organization_profiles")
      .insert({
        organization_id: organizationId,
        organization_membership_id: membership.id,
        graduation_year: 2018,
      });
    if (organizationProfileError) {
      throw new Error(`createMember organization profile: ${organizationProfileError.message}`);
    }

    return {
      userId: data.user.id,
      membershipId: membership.id,
      email,
      password: this.password,
      name,
    };
  }

  async approveMembership(email: string, password: string, membershipId: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("missing local Supabase public configuration");
    const member = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await member.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`approveMembership sign in: ${signInError.message}`);
    const { data, error } = await member
      .schema("api")
      .rpc("decide_membership", { p_membership_id: membershipId, p_decision: "approve" })
      .single();
    if (error || !data || data.result_code !== "approved") {
      throw new Error(`approveMembership: ${error?.message ?? data?.result_code ?? "no result"}`);
    }
  }

  async addMembershipForSeededUser(userId: string, organizationId: string) {
    const { data, error } = await this.admin
      .from("organization_memberships")
      .insert({
        user_id: userId,
        organization_id: organizationId,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(`addMembershipForSeededUser: ${error.message}`);
    this.extraMembershipIds.push(data.id);
    const { error: profileError } = await this.admin.from("organization_profiles").insert({
      organization_id: organizationId,
      organization_membership_id: data.id,
      graduation_year: 2018,
    });
    if (profileError) throw new Error(`addMembershipForSeededUser profile: ${profileError.message}`);
    return data.id;
  }

  async membershipForEmail(email: string, organizationId: string) {
    const userId = await this.trackAcceptedUser(email);
    const { data, error } = await this.admin
      .from("organization_memberships")
      .select("id, status")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();
    if (error) throw new Error(`membershipForEmail: ${error.message}`);
    return { ...data, userId };
  }

  trackAvatarPath(path: string) {
    this.avatarPaths.push(path);
  }

  async destroy() {
    if (this.avatarPaths.length > 0) {
      await this.admin.storage.from("avatars").remove(this.avatarPaths);
    }
    for (const membershipId of this.extraMembershipIds) {
      await this.admin.from("organization_memberships").delete().eq("id", membershipId);
    }
    for (const userId of [...new Set(this.createdUserIds)]) {
      await this.admin.auth.admin.deleteUser(userId);
    }
    for (const organizationId of this.organizationIds) {
      await this.admin.from("invites").delete().eq("organization_id", organizationId);
      await this.admin.from("organizations").delete().eq("id", organizationId);
    }
  }
}
