"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Footer from 'components/layout/footer'; // Added Footer import

interface Product {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  discountedPrice: number; // This is often per unit after discount
  thumbnail: string;
}

interface Order { // Corresponds to a "Cart" from dummyjson
  id: number;
  products: Product[];
  total: number; // Original total for the cart
  discountedTotal: number; // Final total for the cart after all discounts
  userId: number;
  totalProducts: number; // Number of unique product types
  totalQuantity: number; // Total number of items
}

interface OrdersResponse {
  carts: Order[];
  total: number; // Total number of carts available for the user
  skip: number;
  limit: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/login');
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/orders?userId=${storedUserId}`);
        
        if (response.ok) {
          const data: OrdersResponse = await response.json();
          if (data.carts && data.carts.length > 0) {
            setOrders(data.carts);
          } else {
            // API call was successful, but no orders were found
            setOrders([]); // Ensure orders is empty
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to load order history.');
           if (response.status === 401 || response.status === 404) { // 404 might mean no orders or user not found
             // Potentially redirect or offer a way to retry
           }
        }
      } catch (err) {
        console.error('Orders fetch error:', err);
        setError('An unexpected error occurred. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-red-600 dark:text-red-500">Error Loading Orders</h2>
          <p className="mb-6 text-gray-700 dark:text-gray-300">{error}</p>
          <div className="space-x-4">
            <Link href="/account">
              <span className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
                Back to Account
              </span>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="mb-8 border-b border-gray-300 pb-4 text-center text-3xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
          Order History
        </h1>
        {orders.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800">
            <p className="mb-4 text-xl text-gray-700 dark:text-gray-300">You have no orders yet.</p>
            <Link href="/">
              <span className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-center text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
                Start Shopping
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
                <div className="bg-gray-50 p-4 dark:bg-gray-700 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Order ID: <span className="font-normal">{order.id}</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      User ID: {order.userId}
                    </p>
                  </div>
                  <div className="mt-3 text-sm sm:mt-0 sm:text-right">
                    <p className="text-gray-600 dark:text-gray-300">
                      Items: <span className="font-medium text-gray-800 dark:text-gray-100">{order.totalQuantity}</span> | 
                      Products: <span className="font-medium text-gray-800 dark:text-gray-100">{order.totalProducts}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Original Total: <span className="font-medium text-red-500 line-through">${order.total.toFixed(2)}</span>
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      Final Total: ${order.discountedTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="mb-3 text-lg font-medium text-gray-700 dark:text-gray-200">Products in this Order:</h3>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.products.map((product) => (
                      <li key={product.id} className="flex flex-col py-4 sm:flex-row sm:items-center sm:space-x-4">
                        {product.thumbnail && (
                          <div className="mb-3 h-24 w-full flex-shrink-0 sm:mb-0 sm:h-20 sm:w-20">
                            <Image 
                              src={product.thumbnail} 
                              alt={product.title} 
                              width={80} 
                              height={80} 
                              className="h-full w-full rounded-md object-cover" 
                            />
                          </div>
                        )}
                        <div className="flex-grow text-sm">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{product.title}</p>
                          <p className="text-gray-500 dark:text-gray-400">Quantity: {product.quantity}</p>
                          <p className="text-gray-500 dark:text-gray-400">Unit Price: ${product.price.toFixed(2)}</p>
                        </div>
                        <div className="mt-2 text-sm sm:mt-0 sm:text-right">
                          {product.discountPercentage > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400">
                              Discount: {product.discountPercentage.toFixed(2)}%
                            </p>
                          )}
                           <p className="font-semibold text-gray-800 dark:text-gray-100">
                            Item Total: ${ (product.price * product.quantity * (1 - product.discountPercentage/100)).toFixed(2) } 
                            {/* DummyJSON `discountedPrice` is per unit price after discount, not total for quantity */}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer /> {/* Added Footer component */}
    </div>
  );
}
