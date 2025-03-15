import React from 'react';
import { useRouter } from 'next/router';
import { Button, Container, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';


export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;

  const testNotification = () => {
    notifications.show({
      title: '测试通知',
      message: '如果你看到这条消息，说明通知功能正常工作！',
      color: 'blue',
      autoClose: 2000,
    });
  };

  return (
    <Container>
      <Title order={1}>博客文章</Title>
      <Text size="xl" mt="md">
        当前文章 ID: {id}
      </Text>
      <Button
        onClick={testNotification}
        mt="xl"
        variant="gradient"
        gradient={{ from: 'indigo', to: 'cyan' }}
      >
        测试通知功能
      </Button>
    </Container>
  );
}