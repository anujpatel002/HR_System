'use client';

import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from '../store/store';
import '../styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body>
        <Provider store={store}>
          {children}
          <Toaster position="top-right" />
        </Provider>
      </body>
    </html>
  );
}