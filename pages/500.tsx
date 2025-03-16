import React from 'react';
import { Text, Title } from '@mantine/core';

export default function Custom404() {
  return (
    <>
      <Title ta="center" mt={100}>
        <Text inherit variant="gradient" component="span" gradient={{ from: 'red', to: 'green' }}>
          500 - Server-side error occurred
        </Text>
      </Title>
    </>
  );
}
