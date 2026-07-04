"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEMO_ELDER_ID } from "@/lib/demo-data/seed-ids";

export function FoodRuleForm() {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"prohibited" | "reduce" | "recommendation" | "allergen">("prohibited");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/caregiver/food-rule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elderId: DEMO_ELDER_ID, label, type }),
    });
    if (res.ok) {
      setMessage("Regla alimenticia guardada ✓");
      setLabel("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restricción o recomendación alimenticia</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            inputSize="lg"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="prohibited">Prohibido</option>
            <option value="reduce">Reducir</option>
            <option value="recommendation">Recomendación</option>
            <option value="allergen">Alérgeno</option>
          </Select>
          <Input
            inputSize="lg"
            placeholder="Ej: tortillas, sal, fruta"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">Guardar</Button>
          {message && <p className="text-green-700">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
