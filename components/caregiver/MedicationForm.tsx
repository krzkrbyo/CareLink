"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_ELDER_ID } from "@/lib/demo-data/seed-ids";

export function MedicationForm() {
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/caregiver/medication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elderId: DEMO_ELDER_ID, name, time }),
    });
    if (res.ok) {
      setMessage("Medicamento guardado ✓");
      setName("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar medicamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            inputSize="lg"
            placeholder="Nombre del medicamento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="time"
            inputSize="lg"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <Button type="submit" className="w-full">Guardar</Button>
          {message && <p className="text-green-700">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
