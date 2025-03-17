import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Avatar, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';


// 用户数据接口
interface UserData {
  uid: number;
  username: string;
  email: string;
  phone: string | null;
  gender: number;
  avatar: string;
  status: number;
  token: string | null;
  createTime: string;
  updateTime: string;
}

export default function UserProfile() {
  const router = useRouter();
  const { uid } = router.query;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!uid) {
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/user/profile/${uid}`);
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

  // 加载中状态
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

  // 用户不存在状态
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

  // 获取头像URL
  const avatarUrl = user.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${BACKEND_URL}/photo/${user.avatar}`
    : null;

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Group align="flex-start" wrap="wrap" gap="xl">
          <Avatar src={avatarUrl} size={120} radius="md" alt={user.username} color="blue">
            {user.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>

          <Stack gap="md" style={{ flex: 1, minWidth: '250px' }}>
            <Group gap="apart" wrap="wrap">
              <Title order={2}>{user.username}</Title>
              <Text size="sm" c="dimmed">
                UID: {user.uid}
              </Text>
            </Group>

            <Stack gap="xs">
              <Text size="sm">
                <Text span fw={500} mr="xs">
                  邮箱：
                </Text>
                {user.email}
              </Text>

              <Text size="sm">
                <Text span fw={500} mr="xs">
                  性别：
                </Text>
                {user.gender === 1 ? '男' : user.gender === 2 ? '女' : '保密'}
              </Text>

              <Text size="sm">
                <Text span fw={500} mr="xs">
                  注册时间：
                </Text>
                {user.createTime}
              </Text>

              <Text size="sm">
                <Text span fw={500} mr="xs">
                  最后更新：
                </Text>
                {user.updateTime}
              </Text>
            </Stack>
          </Stack>
        </Group>
      </Paper>
    </Container>
  );
}