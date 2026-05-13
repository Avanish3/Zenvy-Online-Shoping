"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { getWishlistPriceAlertSeed } from "@/services/experienceService";
import { useUiStore } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types";

interface WishlistButtonProps {
  product: Product;
  className?: string;
  size?: number;
}

export function WishlistButton({
  product,
  className,
  size = 16,
}: WishlistButtonProps) {
  const addToast = useUiStore((state) => state.addToast);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const setPriceAlert = useWishlistStore((state) => state.setPriceAlert);
  const clearPriceAlert = useWishlistStore((state) => state.clearPriceAlert);

  return (
    <button
      className={clsx(
        "rounded-full p-2 shadow-sm transition hover:scale-105",
        isWishlisted ? "bg-zenvy-rose text-white" : "bg-white/90 text-zenvy-ink",
        className,
      )}
      onClick={() => {
        toggleWishlist(product);
        triggerHaptic(10);

        if (isWishlisted) {
          clearPriceAlert(product.id);
          addToast(`${product.name} removed from wishlist`);
          return;
        }

        setPriceAlert(product.id, getWishlistPriceAlertSeed(product.id));
        addToast(`${product.name} saved with a price-drop alert`);
      }}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={clsx("transition", isWishlisted && "fill-current")} size={size} />
    </button>
  );
}
