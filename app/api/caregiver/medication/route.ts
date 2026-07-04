import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  elderId: z.string().uuid(),
  name: z.string(),
  time: z.string(),
  dose: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  schedule: z
    .object({
      times: z.array(z.string()),
      daysOfWeek: z.array(z.number().min(1).max(7)),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const supabase = createAdminClient();
  const startDate = body.startDate ?? new Date().toISOString().slice(0, 10);
  const schedule = body.schedule ?? {
    times: [body.time],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  };

  const { data, error } = await supabase
    .from("medications")
    .insert({
      elder_id: body.elderId,
      name: body.name,
      dose: body.dose,
      time: schedule.times[0] ?? body.time,
      scheduled_time: `${schedule.times[0] ?? body.time}:00`,
      frequency: `${schedule.times.length}x/día`,
      start_date: startDate,
      end_date: body.endDate ?? null,
      schedule,
      calendar_export_enabled: true,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, medication: data });
}
