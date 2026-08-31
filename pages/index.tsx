// import Image from 'next/image';
// import styles from '../styles/page.module.css';
import Head from 'next/head';
// import Script from 'next/script';

import Pomodoro from 'components/Pomodoro';

function HomePage() {
  return (
    <div className="App">
      <Head>
        <title>Pomodoro</title>
        {/* <meta content="width=device-width, initial-scale=1" name="viewport" /> */}
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=yes, viewport-fit=cover"
        />
        <meta name="description" content="⏲️" />
        <link rel="icon" href="/favicon.ico" />

        <meta name="application-name" content="Pomodoro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pomodoro" />
        <meta name="description" content="Pomdoro timer" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" /> */}
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icons/ios/180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/ios/152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/ios/167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/ios/180.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/ios/512.png" />
        <link rel="apple-touch-icon" sizes="1024x1024" href="/icons/ios/1024.png" />

        <link rel="icon" type="image/png" sizes="512x512" href="/icons/ios/512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/ios/192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/ios/32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/ios/16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourdomain.com" />
        <meta name="twitter:title" content="PWA App" />
        <meta name="twitter:description" content="Best PWA App in the world" />
        <meta name="twitter:image" content="https://yourdomain.com/icons/android-chrome-192x192.png" />
        <meta name="twitter:creator" content="@DavidWShadow" /> */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pomodoro" />
        <meta
          property="og:description"
          content="A performant pomodoro timer for the web"
        />
        <meta property="og:site_name" content="Pomodoro" />
        <meta property="og:url" content="https://pomodoro.jameslyons.design/" />
        <meta
          property="og:image"
          content="https://pomodoro.jameslyons.design/icons/ios/512.png"
        />
      </Head>
      {/* <Script src="/timer-worker.js" strategy="worker" /> */}
      <main role="main">
        <Pomodoro />
      </main>
    </div>
  );
}

export default HomePage;
