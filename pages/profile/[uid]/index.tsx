import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Grid, Group, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

export default function UserProfile() {
  const router = useRouter();
  const { uid } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!uid) {
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/user/${uid}`);
        const data = await response.json();

        if (data.code === 20000 && data.data) {
          setUser(data.data);
        } else {
          notifications.show({
            title: '获取用户信息失败',
            message: data.message || '用户不存在',
            color: 'red',
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        notifications.show({
          title: '错误',
          message: '网络错误，请稍后重试',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [uid]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Paper
          shadow="sm"
          p="xl"
          radius="md"
          style={{
            background:
              'linear-gradient(45deg, var(--mantine-color-blue-1), var(--mantine-color-cyan-1))',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack align="center" gap="md">
            <Text
              component={Title}
              order={2}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            >
              加载中...
            </Text>
            <Text size="sm" c="dimmed">
              正在获取用户信息
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Paper
          shadow="sm"
          p="xl"
          radius="md"
          style={{
            background:
              'linear-gradient(45deg, var(--mantine-color-red-1), var(--mantine-color-pink-1))',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack align="center" gap="md">
            <Text
              component={Title}
              order={2}
              variant="gradient"
              gradient={{ from: 'red', to: 'pink', deg: 45 }}
            >
              用户不存在
            </Text>
            <Text size="sm" c="dimmed">
              该用户可能已被删除或输入的地址有误
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Group align="flex-start" wrap="nowrap">
          <Stack gap="xs" style={{ flex: 1 }}></Stack>
        </Group>
      </Paper>

      <Tabs defaultValue="articles" mt="xl">
        <Tabs.List>
          <Tabs.Tab value="articles">文章</Tabs.Tab>
          <Tabs.Tab value="comments">评论</Tabs.Tab>
          <Tabs.Tab value="collections">收藏</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="articles" pt="md">
          <Grid></Grid>
        </Tabs.Panel>

        <Tabs.Panel value="comments" pt="md">
          <Stack></Stack>
        </Tabs.Panel>

        <Tabs.Panel value="collections" pt="md">
          <Grid></Grid>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}