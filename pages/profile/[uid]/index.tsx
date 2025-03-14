import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Avatar,
  Container,
  Group,
  Paper,
  Text,
  Title,
  Stack,
  Grid,
  Card,
  Badge,
  Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

export default function UserProfile() {
  const router = useRouter();
  const { uid } = router.query;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!uid) {return;}

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
            background: 'linear-gradient(45deg, var(--mantine-color-blue-1), var(--mantine-color-cyan-1))',
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
            <Text size="sm" c="dimmed">正在获取用户信息</Text>
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
            background: 'linear-gradient(45deg, var(--mantine-color-red-1), var(--mantine-color-pink-1))',
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
            <Text size="sm" c="dimmed">该用户可能已被删除或输入的地址有误</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Group align="flex-start" wrap="nowrap">
          <Avatar
            src={`${BACKEND_URL}/user/avatar/${user.uid}`}
            size={120}
            radius={120}
          />
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group justify="space-between" align="center">
              <div>
                <Title order={2}>{user.username}</Title>
                <Text c="dimmed" size="sm">UID: {user.uid}</Text>
              </div>
              <Group>
                <Badge color="blue">注册于 {new Date(user.createTime).toLocaleDateString()}</Badge>
                {user.role === 'ADMIN' && <Badge color="red">管理员</Badge>}
              </Group>
            </Group>
            
            <Text>{user.bio || '这个人很懒，什么都没有写~'}</Text>
          </Stack>
        </Group>
      </Paper>

      <Tabs defaultValue="articles" mt="xl">
        <Tabs.List>
          <Tabs.Tab value="articles">文章</Tabs.Tab>
          <Tabs.Tab value="comments">评论</Tabs.Tab>
          <Tabs.Tab value="collections">收藏</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="articles" pt="md">
          <Grid>
            {user.articles?.map((article: any) => (
              <Grid.Col key={article.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Text fw={500} size="lg" mb="xs">
                    {article.title}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {article.description}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="comments" pt="md">
          <Stack>
            {user.comments?.map((comment: any) => (
              <Paper key={comment.id} shadow="xs" p="md">
                <Text size="sm">{comment.content}</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  发表于 {new Date(comment.createTime).toLocaleString()}
                </Text>
              </Paper>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="collections" pt="md">
          <Grid>
            {user.collections?.map((collection: any) => (
              <Grid.Col key={collection.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Text fw={500} size="lg" mb="xs">
                    {collection.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    收藏于 {new Date(collection.createTime).toLocaleString()}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}