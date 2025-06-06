import React from 'react';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AppShell, Group, MantineProvider, Text } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import AutoTheme from '@/components/AutoTheme/AutoTheme';
import { HeaderComponent } from '@/components/Header/HeaderComponent';
import { theme } from '@/theme';

const startYear = 2025;
const currentYear = new Date().getFullYear();
const displayYear = startYear === currentYear ? `${startYear}` : `${startYear}-${currentYear}`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
      <Head>
        <title>整合包中心</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="shortcut icon" href="/favicon.svg" />
      </Head>
      <Notifications position="top-right" zIndex={2077} />
      <AutoTheme />
      <AppShell header={{ height: 60 }} padding="md">
        <HeaderComponent />
        <AppShell.Main>
          <Component {...pageProps} />
        </AppShell.Main>
        <AppShell.Footer>
          <Group justify="space-around" align="center" h={50}>
            <Text
              inherit
              variant="gradient"
              component="span"
              gradient={{ from: 'blue', to: 'pink' }}
            >
              © {displayYear} Birdy All rights reserved.
            </Text>
          </Group>
        </AppShell.Footer>
      </AppShell>
    </MantineProvider>
  );
}
