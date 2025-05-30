// components/layout/simple-login-footer.tsx
export default function SimpleLoginFooter() {
  return (
    <footer className="p-4 mt-8 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 dark:text-gray-400">
      <p>&copy; {new Date().getFullYear()} Your Store. All rights reserved.</p>
      <p>This is a simplified footer for specific pages.</p>
    </footer>
  );
}
