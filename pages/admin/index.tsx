import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconAlertCircle, IconArrowDownRight, IconArrowUpRight, IconArticle, IconChartBar, IconChevronRight, IconEye, IconMessage, IconPackage, IconUsers } from '@tabler/icons-react';
import useSWR from 'swr';
import { ActionIcon, Badge, Box, Card, Container, Flex, Grid, Group, Loader, Paper, rem, RingProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';


interface UserVO {
  uid: number;
  username: string;
  email: string;
  phone: string;
  gender: number;
  avatar: string;
  status: number;
  token: string;
  createTime: Date;
  updateTime: Date;
  group: Permission;
}

interface Permission {
  id: number;
  uid: number;
  permission: string;
  expiry: number;
  createTime: string;
  updateTime: string;
}

// 统计数据类型
interface WeeklyStats {
  date: string;
  users: number;
  articles: number;
  modpacks: number;
  comments: number;
}

interface StatsData {
  userCount: number;
  articleCount: number;
  modpackCount: number;
  commentCount: number;
  viewCount: number;
  newUserCount: number;
  newArticleCount: number;
  newModpackCount: number;
  pendingModpackCount: number;
  reportedCommentCount: number;
  weeklyStats: WeeklyStats[];
}

// 获取统计数据的fetcher函数
const fetcher = async (url: string) => {
  const loginToken = localStorage.getItem('loginToken');
  const response = await fetch(url, {
    headers: {
      loginToken: loginToken || '',
    },
  });

  if (!response.ok) {
    throw new Error('获取统计数据失败');
  }

  return response.json();
};

// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  path?: string;
  increase?: number;
  noclick?: boolean;
}

function StatsCard({ title, value, icon, color, path, increase, noclick }: StatsCardProps) {
  const router = useRouter();

  return (
    <Card
      withBorder
      p="md"
      radius="md"
      shadow="sm"
      onClick={() => {
        if (path) {
          router.push(path);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="xs" c="dimmed" fw={700}>
            {title}
          </Text>
          <Title order={3} fw={700} mt={5}>
            {value.toLocaleString()}
          </Title>
          {increase !== undefined && (
            <Group gap={5} mt={5}>
              {increase >= 0 ? (
                <IconArrowUpRight style={{ width: rem(16), height: rem(16) }} color="teal" />
              ) : (
                <IconArrowDownRight style={{ width: rem(16), height: rem(16) }} color="red" />
              )}
              <Text size="xs" c={increase >= 0 ? 'teal' : 'red'} fw={500}>
                {Math.abs(increase)}% 较上周
              </Text>
            </Group>
          )}
        </Box>
        <ActionIcon variant="light" radius="md" size="xl" color={color}>
          {icon}
        </ActionIcon>
      </Group>
      {!noclick && (
        <Group mt="md" justify="flex-end">
          <Text size="xs" c="dimmed">
            点击查看详情
          </Text>
          <IconChevronRight style={{ width: rem(14), height: rem(14) }} />
        </Group>
      )}
    </Card>
  );
}

// 警告卡片组件
interface AlertCardProps {
  title: string;
  value: number;
  description: string;
  color: string;
  path?: string;
  noclick?: boolean;
}

function AlertCard({ title, value, description, color, path, noclick }: AlertCardProps) {
  const router = useRouter();

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      onClick={() => {
        if (path) {
          router.push(path);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between">
        <Box>
          <Text fw={700} size="lg">
            {title}
          </Text>
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        </Box>
        <Badge color={color} size="xl" radius="sm" variant="filled">
          {value}
        </Badge>
      </Group>
    </Paper>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查用户是否登录以及是否有管理员权限
  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        const loginToken = localStorage.getItem('loginToken');

        if (!loginToken) {
          // 未登录，重定向到登录页
          notifications.show({
            title: '需要登录',
            message: '请先登录后再访问管理页面',
            color: 'red',
          });
          router.push('/login');
          return;
        }

        // 获取用户信息
        const response = await fetch(`${BACKEND_URL}/user/token`, {
          method: 'POST',
          headers: {
            loginToken,
          },
        });

        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }

        const data = await response.json();

        if (data.code !== 20000 || !data.data) {
          throw new Error(data.message || '获取用户信息失败');
        }

        // 检查用户是否有管理员权限
        const userInfo = data.data;
        const hasAdminRole =
          userInfo.group.permission === '*' || userInfo.group.permission?.includes('admin');

        if (!hasAdminRole) {
          notifications.show({
            title: '权限不足',
            message: '您没有管理员权限',
            color: 'red',
          });
          router.push('/');
          return;
        }

        setIsAdmin(true);
        setIsLoading(false);
      } catch (error) {
        console.error('权限检查失败:', error);
        notifications.show({
          title: '权限检查失败',
          message: error instanceof Error ? error.message : '未知错误',
          color: 'red',
        });
        router.push('/');
      }
    };

    checkAdminPermission();
  }, [router]);

  const {
    data,
    error,
    isLoading: statsLoading,
  } = useSWR<{ code: number; message: string; data: StatsData }>(
    isAdmin ? `${BACKEND_URL}/admin/stats` : null,
    fetcher
  );

  // 模拟数据（实际应用中应使用后端返回的数据）
  const statsData: StatsData = data?.data || {
    userCount: 0,
    articleCount: 0,
    modpackCount: 0,
    commentCount: 0,
    viewCount: 0,
    newUserCount: 0,
    newArticleCount: 0,
    newModpackCount: 0,
    pendingModpackCount: 0,
    reportedCommentCount: 0,
    weeklyStats: [],
  };

  // 加载中状态
  if (isLoading || statsLoading) {
    return (
      <Container size="lg" py="xl">
        <Flex justify="center" align="center" h={400}>
          <Loader size="lg" />
        </Flex>
      </Container>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconAlertCircle color="red" size={24} />
            <Text fw={500} size="lg">
              获取数据失败
            </Text>
          </Group>
          <Text mt="sm">请检查网络连接或权限设置后重试</Text>
        </Paper>
      </Container>
    );
  }

  // 如果没有管理员权限，不渲染内容（实际上会被重定向）
  if (!isAdmin) {
    return null;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">
        管理员仪表盘
      </Title>

      {/* 主要统计数据 */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} mb="xl">
        <StatsCard
          title="用户总数"
          value={statsData.userCount}
          icon={<IconUsers size={24} />}
          color="blue"
          path="/admin/user"
        />
        <StatsCard
          title="文章总数"
          value={statsData.articleCount}
          icon={<IconArticle size={24} />}
          color="violet"
          path="/admin/article"
        />
        <StatsCard
          title="整合包总数"
          value={statsData.modpackCount}
          icon={<IconPackage size={24} />}
          color="green"
          path="/admin/modpack"
        />
        <StatsCard
          title="评论总数"
          value={statsData.commentCount}
          icon={<IconMessage size={24} />}
          color="orange"
          path="/admin/comment"
        />
        <StatsCard
          title="总浏览量"
          value={statsData.viewCount}
          icon={<IconEye size={24} />}
          color="cyan"
          noclick={true}
        />
      </SimpleGrid>

      {/* 需要注意的事项 */}
      <Title order={4} mb="md">
        需要注意
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
        <AlertCard
          title="待审核整合包"
          value={statsData.pendingModpackCount}
          description="有整合包等待您的审核"
          color="yellow"
          path="/admin/modpack?status=pending"
        />
        <AlertCard
          title="被举报的评论"
          value={statsData.reportedCommentCount}
          description="有评论被用户举报，需要审核"
          color="red"
          path="/admin/comment?status=reported"
        />
      </SimpleGrid>

      {/* 活跃度统计 */}
      <Grid mb={100}>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">
              本周活跃度
            </Title>
            <Box
              h={250}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconChartBar size={48} opacity={0.3} />
              <Text ml="md" c="dimmed">
                图表数据加载中...
              </Text>
            </Box>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
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
                      (statsData.articleCount / (statsData.articleCount + statsData.modpackCount)) *
                      100,
                    color: 'violet',
                  },
                  {
                    value:
                      (statsData.modpackCount / (statsData.articleCount + statsData.modpackCount)) *
                      100,
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
                  <Text size="sm">文章 ({statsData.articleCount})</Text>
                </Group>
                <Group gap="xs">
                  <Box w={12} h={12} bg="green" style={{ borderRadius: '50%' }} />
                  <Text size="sm">整合包 ({statsData.modpackCount})</Text>
                </Group>
              </Stack>
            </Flex>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}