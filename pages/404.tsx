import React from 'react';
import { Text, Title } from '@mantine/core';

export default function Custom404() {
  return (
    <>
      <Title ta="center" mt={100}>
        <Text inherit variant="gradient" component="span" gradient={{ from: 'pink', to: 'yellow' }}>
          404 - Page Not Found
        </Text>
      </Title>
    </>
  );
}
