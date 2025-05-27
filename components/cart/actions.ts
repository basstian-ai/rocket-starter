'use server';

import { TAGS } from 'lib/constants';
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart
} from 'lib/bff';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Adds an item to the cart.
 * This server action calls the BFF `addToCart` function and revalidates the cart tag.
 * @param prevState The previous state, used by useFormState. Not directly used in this action but required by the hook.
 * @param selectedVariantId The ID of the product variant to add to the cart.
 * @returns {Promise<string | undefined>} An error message string if adding the item fails (e.g., variant ID is missing, BFF error), otherwise undefined.
 */
export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return 'Error adding item to cart';
  }

  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    revalidateTag(TAGS.cart);
  } catch (e) {
    return 'Error adding item to cart';
  }
}

/**
 * Removes an item from the cart.
 * This server action fetches the cart, finds the line item by merchandise ID,
 * calls the BFF `removeFromCart` function, and revalidates the cart tag.
 * @param prevState The previous state, used by useFormState. Not directly used in this action.
 * @param merchandiseId The merchandise ID of the item to remove from the cart.
 * @returns {Promise<string | undefined>} An error message string if removing the item fails (e.g., cart not found, item not in cart, BFF error), otherwise undefined.
 */
export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItemEdge = cart.lines.edges.find(
      (edge) => edge.node.merchandise.id === merchandiseId
    );
    const lineItem = lineItemEdge?.node;

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      revalidateTag(TAGS.cart);
    } else {
      return 'Item not found in cart';
    }
  } catch (e) {
    return 'Error removing item from cart';
  }
}

/**
 * Updates the quantity of an item in the cart.
 * If the quantity is 0, the item is removed. If the item doesn't exist and quantity > 0, it's added.
 * This server action calls BFF `updateCart`, `removeFromCart`, or `addToCart` and revalidates the cart tag.
 * @param prevState The previous state, used by useFormState. Not directly used in this action.
 * @param payload An object containing the merchandiseId and the new quantity.
 * @param {string} payload.merchandiseId The merchandise ID of the item to update.
 * @param {number} payload.quantity The new quantity for the item.
 * @returns {Promise<string | undefined>} An error message string if updating fails (e.g., cart not found, BFF error), otherwise undefined.
 */
export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItemEdge = cart.lines.edges.find(
      (edge) => edge.node.merchandise.id === merchandiseId
    );
    const lineItem = lineItemEdge?.node;

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity
          }
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return 'Error updating item quantity';
  }
}

/**
 * Redirects the user to the checkout URL from the cart.
 * This server action fetches the cart and then performs a redirect.
 * It has no return value as `redirect` is a terminal operation.
 * Important: This function will throw a NEXT_REDIRECT error, which is handled by Next.js.
 */
export async function redirectToCheckout() {
  let cart = await getCart();
  redirect(cart!.checkoutUrl);
}

/**
 * Creates a new cart and sets the cart ID as a cookie.
 * This server action calls the BFF `createCart` function and uses `cookies()` to set the 'cartId'.
 * It has no return value.
 */
export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set('cartId', cart.id!);
}
