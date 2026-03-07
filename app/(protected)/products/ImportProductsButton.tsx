"use client";

import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importProducts } from "@/app/(protected)/products/actions";

export function ImportProductsButton() {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const result = await importProducts(json);

      if (result?.error) toast.error(result.error);
      else toast.success(`Imported ${json.length} products`);
    } catch (err) {
      toast.error("Invalid JSON file");
    }
  }

  return (
    <>
      <input
        type="file"
        accept="application/json"
        hidden
        id="import-products"
        onChange={handleFile}
      />

      <Button
        variant="secondary"
        onClick={() => document.getElementById("import-products")?.click()}
        className="gap-2"
      >
        <Upload className="size-4" />
        Import JSON
      </Button>
    </>
  );
}
