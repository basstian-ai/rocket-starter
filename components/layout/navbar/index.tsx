import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/bff';
import { Menu } from 'lib/bff/types';
import Link from 'next/link';
import { Suspense } from 'react';
import MobileMenu from './mobile-menu';
import Search, { SearchSkeleton } from './search';
import UserStatus from './user-status'; // Import the new component

const { SITE_NAME } = process.env;

export async function Navbar() {
  let menu: Menu[];

  try {
    menu = await getMenu('next-js-frontend-header-menu');
  } catch (e) {
    console.error('Failed to fetch menu in Navbar:', e);
    menu = [];
  }

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex w-full items-center">
        <div className="flex w-full md:w-1/3">
          <Link
            href="/"
            prefetch={true}
            className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6"
          >
            <LogoSquare />
            <div className="ml-2 flex-none text-sm font-medium uppercase md:hidden lg:block">
              {SITE_NAME}
            </div>
          </Link>
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              {/* Replace static Login link with UserStatus component */}
              <Suspense fallback={null}><UserStatus /></Suspense> 
            </ul>
          ) : (
            // If menu is empty, still show UserStatus
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
               <Suspense fallback={null}><UserStatus /></Suspense>
            </ul>
          )
          }
        </div>
        <div className="hidden justify-center md:flex md:w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex justify-end md:w-1/3">
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
