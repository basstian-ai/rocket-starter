'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useMemo, useOptimistic } from 'react';

/**
 * Represents the state of product options and selected image.
 * It's a flexible object that can hold various product option keys (like 'color', 'size')
 * and an optional 'image' key for the selected image index.
 * @property {string} [image] - The index of the currently selected product image.
 * @property {string} [key] - Other dynamic keys representing product options (e.g., 'color': 'Blue').
 */
type ProductState = {
  [key: string]: string;
} & {
  image?: string;
};

/**
 * Defines the shape of the product context provided by {@link ProductProvider}.
 * @property {ProductState} state - The current state of product options and image selection.
 * @property {(name: string, value: string) => ProductState} updateOption - Function to update a product option.
 * @property {(index: string) => ProductState} updateImage - Function to update the selected image index.
 */
type ProductContextType = {
  state: ProductState;
  updateOption: (name: string, value: string) => ProductState;
  updateImage: (index: string) => ProductState;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

/**
 * Provides product state and update functions to its children components.
 * It initializes its state from URL search parameters and uses optimistic updates
 * for a responsive user experience.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child components that will consume the context.
 * @returns {JSX.Element} The ProductContext.Provider wrapping the children.
 */
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  const getInitialState = () => {
    const params: ProductState = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  };

  const [state, setOptimisticState] = useOptimistic(
    getInitialState(),
    (prevState: ProductState, update: ProductState) => ({
      ...prevState,
      ...update
    })
  );

  const updateOption = (name: string, value: string) => {
    const newState = { [name]: value };
    setOptimisticState(newState);
    return { ...state, ...newState };
  };

  const updateImage = (index: string) => {
    const newState = { image: index };
    setOptimisticState(newState);
    return { ...state, ...newState };
  };

  const value = useMemo(
    () => ({
      state,
      updateOption,
      updateImage
    }),
    [state]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

/**
 * Custom hook to access the product context.
 * It must be used within a {@link ProductProvider} component.
 * @returns {ProductContextType} The product context value, including state and update functions.
 * @throws {Error} If used outside of a ProductProvider.
 */
export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

/**
 * Custom hook that returns a function to update the URL search parameters.
 * This is used to reflect product option changes in the URL without a full page reload.
 * @returns {(state: ProductState) => void} A function that takes the new product state
 * and updates the URL's query string accordingly.
 */
export function useUpdateURL() {
  const router = useRouter();

  return (state: ProductState) => {
    const newParams = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
