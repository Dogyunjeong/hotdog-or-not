import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export default App;

const getErrorMessage = (error: unknown) => {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return 'We could not find this page.';
  }
  return 'Something went wrong. Please try again in a moment.';
};

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Oops</h1>
      <p className="mt-2 text-neutral-600">{getErrorMessage(error)}</p>
    </main>
  );
};
