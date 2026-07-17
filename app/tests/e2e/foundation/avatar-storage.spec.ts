import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";
import { FoundationScenario } from "../helpers/foundation";

test("avatar storage keeps public URLs while metadata stays owner-scoped", async () => {
  const scenario = new FoundationScenario();
  try {
    const organization = await scenario.createOrganization(false, "Avatar Circle");
    const member = await scenario.createMember(organization.id, "Avatar Owner");
    const otherMember = await scenario.createMember(organization.id, "Avatar Stranger");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("missing Supabase public configuration");

    const owner = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonymous = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const otherOwner = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await owner.auth.signInWithPassword({
      email: member.email,
      password: member.password,
    });
    expect(signInError).toBeNull();
    const { error: otherSignInError } = await otherOwner.auth.signInWithPassword({
      email: otherMember.email,
      password: otherMember.password,
    });
    expect(otherSignInError).toBeNull();

    const path = `${member.userId}/advisor-avatar.png`;
    scenario.trackAvatarPath(path);
    const firstUpload = await owner.storage.from("avatars").upload(
      path,
      new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
      { contentType: "image/png", upsert: false },
    );
    expect(firstUpload.error).toBeNull();

    const replacement = await owner.storage.from("avatars").upload(
      path,
      new Blob([new Uint8Array([4, 5, 6])], { type: "image/png" }),
      { contentType: "image/png", upsert: true },
    );
    expect(replacement.error).toBeNull();

    const ownerList = await owner.storage.from("avatars").list(member.userId);
    expect(ownerList.error).toBeNull();
    expect(ownerList.data?.some((object) => object.name === "advisor-avatar.png")).toBe(true);

    const anonymousList = await anonymous.storage.from("avatars").list(member.userId);
    expect(anonymousList.data?.some((object) => object.name === "advisor-avatar.png") ?? false).toBe(
      false,
    );

    const otherOwnerList = await otherOwner.storage.from("avatars").list(member.userId);
    expect(otherOwnerList.data?.some((object) => object.name === "advisor-avatar.png") ?? false).toBe(
      false,
    );

    const publicUrl = owner.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const publicResponse = await fetch(publicUrl, { cache: "no-store" });
    expect(publicResponse.ok).toBe(true);
    expect(new Uint8Array(await publicResponse.arrayBuffer())).toEqual(
      new Uint8Array([4, 5, 6]),
    );
  } finally {
    await scenario.destroy();
  }
});
