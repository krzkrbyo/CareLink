"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEMO_ELDER_ID } from "@/lib/demo-data/seed-ids";

export function AppointmentForm() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"cita" | "examen">("cita");
  const [datetime, setDatetime] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/caregiver/appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elderId: DEMO_ELDER_ID, title, type, startsAt: datetime }),
    });
    if (res.ok) {
      setMessage("Cita/examen guardado ✓");
      setTitle("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar cita o examen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            inputSize="lg"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            inputSize="lg"
            value={type}
            onChange={(e) => setType(e.target.value as "cita" | "examen")}
          >
            <option value="cita">Cita médica</option>
            <option value="examen">Examen</option>
          </Select>
          <Input
            type="datetime-local"
            inputSize="lg"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">Guardar</Button>
          {message && <p className="text-green-700">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
