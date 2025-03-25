import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconArticle, IconCalendar, IconChevronRight, IconMail, IconPackage, IconUser, IconUsers } from '@tabler/icons-react';
import { Avatar, Badge, Box, Card, Container, Flex, Grid, Group, Loader, Paper, rem, RingProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
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
  // 添加统计数据
  stats?: {
    articleCount: number;
    modpackCount: number;
    followersCount: number;
    followingCount: number;
  };
}

// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  path?: string;
  noclick?: boolean; // 添加 noclick 属性
}

function StatsCard({ title, value, icon, color, path, noclick }: StatsCardProps) {
  const router = useRouter();

  return (
    <Card
      withBorder
      p="md"
      radius="md"
      shadow="sm"
      onClick={() => {
        if (path && !noclick) {
          router.push(path);
        }
      }}
      style={{ cursor: path && !noclick ? 'pointer' : 'default' }}
    >
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="xs" c="dimmed" fw={700}>
            {title}
          </Text>
          <Title order={3} fw={700} mt={5}>
            {value.toLocaleString()}
          </Title>
        </Box>
        <Box
          style={{
            width: rem(42),
            height: rem(42),
            borderRadius: rem(8),
            backgroundColor: `var(--mantine-color-${color}-light)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Group>
      {path && !noclick && (
        <Group mt="md" justify="flex-end">
          <Text size="xs" c="dimmed">
            查看详情
          </Text>
          <IconChevronRight style={{ width: rem(14), height: rem(14) }} />
        </Group>
      )}
    </Card>
  );
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
        const loginToken = localStorage.getItem('loginToken');
        const response = await fetch(`${BACKEND_URL}/user/profile/${uid}`, {
          headers: {
            loginToken: loginToken || '',
          },
        });
        const data = await response.json();

        if (data.code === 20000 && data.data) {
          // 模拟统计数据，实际应从后端获取
          const userData = {
            ...data.data,
          };
          setUser(userData);
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
        <Flex justify="center" align="center" h={400}>
          <Loader size="lg" />
        </Flex>
      </Container>
    );
  }

  // 用户不存在状态
  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Paper
          withBorder
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container size="lg" py="xl">
      {/* 用户基本信息卡片 */}
      <Paper
        withBorder
        p="xl"
        radius="md"
        mb="xl"
        style={{
          background: 'var(--mantine-color-body)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Flex direction="column" align="center" gap="md">
              <Avatar
                src={avatarUrl}
                size={150}
                radius="md"
                alt={user.username}
                color="blue"
                style={{ border: '4px solid var(--mantine-color-blue-2)' }}
              >
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Title order={2} ta="center">
                {user.username}
              </Title>
              <Badge size="lg">UID: {user.uid}</Badge>
            </Flex>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Stack gap="md" h="100%" justify="center">
              <Group gap="md" align="center">
                <IconMail size={20} color="var(--mantine-color-blue-6)" />
                <Text fw={500}>邮箱：</Text>
                <Text>{user.email}</Text>
              </Group>

              <Group gap="md" align="center">
                <IconUser size={20} color="var(--mantine-color-blue-6)" />
                <Text fw={500}>性别：</Text>
                <Text>{user.gender === 1 ? '男' : user.gender === 2 ? '女' : '保密'}</Text>
              </Group>

              <Group gap="md" align="center">
                <IconCalendar size={20} color="var(--mantine-color-blue-6)" />
                <Text fw={500}>注册时间：</Text>
                <Text>{formatDate(user.createTime)}</Text>
              </Group>

              <Group gap="md" align="center">
                <IconCalendar size={20} color="var(--mantine-color-blue-6)" />
                <Text fw={500}>最后更新：</Text>
                <Text>{formatDate(user.updateTime)}</Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* 用户统计数据 */}
      <Title order={3} mb="md">
        用户数据统计
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <StatsCard
          title="文章数量"
          value={user.stats?.articleCount || 0}
          icon={<IconArticle size={24} color="var(--mantine-color-violet-6)" />}
          color="violet"
          path={`/profile/${user.uid}/articles`}
          noclick={true}
        />
        <StatsCard
          title="整合包数量"
          value={user.stats?.modpackCount || 0}
          icon={<IconPackage size={24} color="var(--mantine-color-green-6)" />}
          color="green"
          path={`/profile/${user.uid}/modpacks`}
          noclick={true}
        />
        <StatsCard
          title="关注者"
          value={user.stats?.followersCount || 0}
          icon={<IconUsers size={24} color="var(--mantine-color-blue-6)" />}
          color="blue"
          path={`/profile/${user.uid}/followers`}
          noclick={true}
        />
        <StatsCard
          title="正在关注"
          value={user.stats?.followingCount || 0}
          icon={<IconUser size={24} color="var(--mantine-color-cyan-6)" />}
          color="cyan"
          path={`/profile/${user.uid}/following`}
          noclick={true}
        />
      </SimpleGrid>

      {/* 内容分布 */}
      <Grid mb={60}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">
              内容分布
            </Title>
            <Flex direction="column" align="center" justify="center">
              <RingProgress
                size={180}
                thickness={20}
                roundCaps
                sections={[
                  {
                    value:
                      ((user.stats?.articleCount || 0) /
                        ((user.stats?.articleCount || 0) + (user.stats?.modpackCount || 0))) *
                        100 || 0,
                    color: 'violet',
                  },
                  {
                    value:
                      ((user.stats?.modpackCount || 0) /
                        ((user.stats?.articleCount || 0) + (user.stats?.modpackCount || 0))) *
                        100 || 0,
                    color: 'green',
                  },
                ]}
                label={
                  <Text ta="center" size="sm" fw={700}>
                    内容比例
                  </Text>
                }
              />
              <Stack mt="md" gap="xs">
                <Group gap="xs">
                  <Box w={12} h={12} bg="violet" style={{ borderRadius: '50%' }} />
                  <Text size="sm">文章 ({user.stats?.articleCount || 0})</Text>
                </Group>
                <Group gap="xs">
                  <Box w={12} h={12} bg="green" style={{ borderRadius: '50%' }} />
                  <Text size="sm">整合包 ({user.stats?.modpackCount || 0})</Text>
                </Group>
              </Stack>
            </Flex>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">
              社交网络
            </Title>
            <Flex direction="column" align="center" justify="center">
              <RingProgress
                size={180}
                thickness={20}
                roundCaps
                sections={[
                  {
                    value:
                      ((user.stats?.followersCount || 0) /
                        ((user.stats?.followersCount || 0) + (user.stats?.followingCount || 0))) *
                        100 || 0,
                    color: 'blue',
                  },
                  {
                    value:
                      ((user.stats?.followingCount || 0) /
                        ((user.stats?.followersCount || 0) + (user.stats?.followingCount || 0))) *
                        100 || 0,
                    color: 'cyan',
                  },
                ]}
                label={
                  <Text ta="center" size="sm" fw={700}>
                    社交比例
                  </Text>
                }
              />
              <Stack mt="md" gap="xs">
                <Group gap="xs">
                  <Box w={12} h={12} bg="blue" style={{ borderRadius: '50%' }} />
                  <Text size="sm">关注者 ({user.stats?.followersCount || 0})</Text>
                </Group>
                <Group gap="xs">
                  <Box w={12} h={12} bg="cyan" style={{ borderRadius: '50%' }} />
                  <Text size="sm">正在关注 ({user.stats?.followingCount || 0})</Text>
                </Group>
              </Stack>
            </Flex>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
