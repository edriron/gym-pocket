import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductsTable } from "@/components/products/ProductsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShoppingBasket } from "lucide-react";
import { AddProductButton } from "./AddProductButton";
import { ImportProductsButton } from "./ImportProductsButton";

export const metadata = { title: "Products — Gym Pocket" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: products }, { data: profile }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("profiles").select("permission").eq("id", user!.id).single(),
  ]);

  const list = products ?? [];
  const isAdmin = (profile as any)?.permission === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Global product library with nutritional information per 100g."
        icon={ShoppingBasket}
        iconColor="amber"
        action={
          <div className="flex gap-2">
            <ImportProductsButton />
            <AddProductButton />
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          iconColor="amber"
          title="No products yet"
          description="Be the first to add a product with nutritional info."
          action={<AddProductButton />}
        />
      ) : (
        <ProductsTable products={list} currentUserId={user!.id} isAdmin={isAdmin} />
      )}
    </div>
  );
}
