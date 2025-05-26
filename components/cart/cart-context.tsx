'use client';

import type {
  Cart,
  CartItem,
  Edge, // Added Edge import
  Product,
  ProductVariant
} from 'lib/bff/types';
import React, {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic
} from 'react';

type UpdateType = 'plus' | 'minus' | 'delete';

type CartAction =
  | {
      type: 'UPDATE_ITEM';
      payload: { merchandiseId: string; updateType: UpdateType };
    }
  | {
      type: 'ADD_ITEM';
      payload: { variant: ProductVariant; product: Product };
    };

type CartContextType = {
  cartPromise: Promise<Cart | undefined>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

function updateCartItem(
  item: CartItem,
  updateType: UpdateType
): CartItem | null {
  if (updateType === 'delete') return null;

  const newQuantity =
    updateType === 'plus' ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString()
  );

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount
      }
    }
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, variant.price.amount);

  return {
    id: existingItem?.id,
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode
      }
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage
      }
    }
  };
}

function updateCartTotals(
  lines: CartItem[]
): Pick<Cart, 'totalQuantity' | 'cost'> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0
  );
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? 'USD';

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalTaxAmount: { amount: '0', currencyCode }
    }
  };
}

function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: '',
    totalQuantity: 0,
    lines: { edges: [] },
    cost: {
      subtotalAmount: { amount: '0', currencyCode: 'USD' },
      totalAmount: { amount: '0', currencyCode: 'USD' },
      totalTaxAmount: { amount: '0', currencyCode: 'USD' }
    }
  };
}

function cartReducer(state: Cart | undefined, action: CartAction): Cart {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case 'UPDATE_ITEM': {
      const { merchandiseId, updateType } = action.payload;
      const updatedLineEdges = currentCart.lines.edges
        .map((edge) => {
          if (edge.node.merchandise.id === merchandiseId) {
            const updatedNode = updateCartItem(edge.node, updateType);
            // If updatedNode is null, it means the item's quantity became 0 and should be removed.
            return updatedNode ? { ...edge, node: updatedNode } : null;
          }
          return edge;
        })
        .filter(Boolean) as Edge<CartItem>[]; // Filter out nulls (removed items)

      const updatedLinesNodes = updatedLineEdges.map(edge => edge.node);

      if (updatedLinesNodes.length === 0) {
        return {
          ...currentCart,
          lines: { edges: [] }, // Ensure lines is a Connection object
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            totalAmount: { ...currentCart.cost.totalAmount, amount: '0' }
          }
        };
      }

      return {
        ...currentCart,
        ...updateCartTotals(updatedLinesNodes),
        lines: { edges: updatedLineEdges } // Reconstruct Connection object
      };
    }
    case 'ADD_ITEM': {
      const { variant, product } = action.payload;
      const existingItemEdge = currentCart.lines.edges.find(
        (edge) => edge.node.merchandise.id === variant.id
      );
      const existingItem = existingItemEdge?.node;
      const updatedItem = createOrUpdateCartItem(
        existingItem, // This can be undefined
        variant,
        product
      );

      let newEdges: Edge<CartItem>[];
      if (existingItemEdge) {
        // Update existing item
        newEdges = currentCart.lines.edges.map((edge) =>
          edge.node.merchandise.id === variant.id ? { ...edge, node: updatedItem } : edge
        );
      } else {
        // Add new item as a new edge
        // We need a proper Edge<CartItem> structure.
        // Assuming CartItem's id might be undefined initially if it's a new item.
        // The `createOrUpdateCartItem` function should handle setting the ID if it exists or is new.
        // For a new edge, we might need to create a new ID or ensure the structure is correct.
        // For simplicity, let's assume updatedItem is a complete CartItem.
        // A proper Edge would have a 'cursor' or similar, but not strictly necessary for client-side optimistic updates if not used.
        newEdges = [...currentCart.lines.edges, { node: updatedItem }];
      }
      
      const newNodes = newEdges.map(edge => edge.node);

      return {
        ...currentCart,
        ...updateCartTotals(newNodes),
        lines: { edges: newEdges }
      };
    }
    default:
      return currentCart;
  }
}

export function CartProvider({
  children,
  cartPromise
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  return (
    <CartContext.Provider value={{ cartPromise }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const initialCart = use(context.cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    cartReducer
  );

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: 'UPDATE_ITEM',
      payload: { merchandiseId, updateType }
    });
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: 'ADD_ITEM', payload: { variant, product } });
  };

  return useMemo(
    () => ({
      cart: optimisticCart,
      updateCartItem,
      addCartItem
    }),
    [optimisticCart]
  );
}
