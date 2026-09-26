import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/types/db";
import { buildDigest, digestSubject, todayLabel, type ProspectWithComments } from "@/lib/digest";
import { renderDigestEmailHtml } from "@/lib/digestEmail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  const [{ data: contracts, error: contractsError }, { data: prospects, error: prospectsError }] =
    await Promise.all([
      supabase.from("contracts").select("*").order("end_date", { ascending: true }),
      supabase.from("prospects").select("*, prospect_comments(*)").order("created_at", { ascending: false }),
    ]);
  if (contractsError) {
    return NextResponse.json({ error: contractsError.message }, { status: 500 });
  }
  if (prospectsError) {
    return NextResponse.json({ error: prospectsError.message }, { status: 500 });
  }

  const dateLabel = todayLabel();
  const data = buildDigest(contracts ?? [], (prospects as ProspectWithComments[]) ?? []);
  const subject = digestSubject(data, dateLabel);
  const html = renderDigestEmailHtml(data, dateLabel);

  const recipients = (process.env.DIGEST_RECIPIENTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json({ subject, sent: false, reason: "No DIGEST_RECIPIENTS configured" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  const { error: sendError } = await resend.emails.send({
    from: process.env.DIGEST_FROM ?? "Lanes <digest@resend.dev>",
    to: recipients,
    subject,
    html,
  });
  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 });
  }

  return NextResponse.json({ subject, sent: true, recipients: recipients.length });
}
