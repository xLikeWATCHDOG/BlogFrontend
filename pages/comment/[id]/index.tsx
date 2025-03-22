import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconAlertCircle, IconArrowLeft, IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { 
  Alert, 
  Box, 
  Button, 
  Container, 
  Divider, 
  Group, 
  Loader, 
  Modal, 
  Paper, 
  Stack, 
  Text, 
  Title 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

// 评论数据接口
interface Comment {
  id: number;
  uid: number;  // 用户ID
  aid?: number; // 文章ID
  mid?: number; // 整合包ID
  content: string;
  createTime: string;
  updateTime: string;
  available: number; // 可用性状态
  // 前端额外字段
  username?: string;
  userAvatar?: string;
  articleTitle?: string;
  modpackName?: string;
}

export default function CommentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

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
        
        // 获取评论详情
        if (id) {
          fetchCommentDetail(id as string);
        }
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
  }, [router, id]);

  // 获取评论详情
  const fetchCommentDetail = async (commentId: string) => {
    try {
      setIsLoading(true);
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/comment/${commentId}`, {
        headers: {
          loginToken: loginToken || '',
        },
      });

      if (!response.ok) {
        throw new Error('获取评论详情失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '获取评论详情失败');
      }

      setComment(data.data);
    } catch (err) {
      console.error('获取评论详情失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async () => {
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/comment/${comment?.id}`, {
        method: 'DELETE',
        headers: {
          loginToken: loginToken || '',
        },
      });

      if (!response.ok) {
        throw new Error('删除评论失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '删除评论失败');
      }

      notifications.show({
        title: '成功',
        message: '评论已删除',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      close();
      router.push('/admin/report');
    } catch (err) {
      console.error('删除评论失败:', err);
      notifications.show({
        title: '失败',
        message: err instanceof Error ? err.message : '未知错误',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  // 获取评论状态文本
  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return '正常';
      case 1:
        return '已删除';
      case 2:
        return '已屏蔽';
      default:
        return '未知状态';
    }
  };

  // 加载中状态
  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="获取数据失败" color="red" radius="md">
          {error}
        </Alert>
        <Button mt="md" leftSection={<IconArrowLeft size={14} />} onClick={() => router.back()}>
          返回上一页
        </Button>
      </Container>
    );
  }

  // 评论不存在
  if (!comment) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="评论不存在" color="yellow" radius="md">
          找不到ID为 {id} 的评论
        </Alert>
        <Button mt="md" leftSection={<IconArrowLeft size={14} />} onClick={() => router.back()}>
          返回上一页
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group mb="xl" justify="space-between">
        <Title order={2}>评论详情</Title>
        <Button leftSection={<IconArrowLeft size={14} />} variant="subtle" onClick={() => router.back()}>
          返回
        </Button>
      </Group>

      <Paper withBorder p="md" radius="md" mb="xl">
        <Stack>
          <Group justify="space-between">
            <Text fw={700} size="lg">评论ID: {comment.id}</Text>
            <Text c="dimmed" size="sm">
              {new Date(comment.createTime).toLocaleString('zh-CN')}
            </Text>
          </Group>

          <Divider />

          <Box>
            <Text fw={700} mb="xs">评论内容:</Text>
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Text>{comment.content}</Text>
            </Paper>
          </Box>

          <Group>
            <Text fw={700}>评论者:</Text>
            <Text>
              {comment.username || '未知用户'} (ID: {comment.uid})
            </Text>
          </Group>

          {comment.aid && (
            <Group>
              <Text fw={700}>所属文章:</Text>
              <Text>
                {comment.articleTitle || '未知文章'} (ID: {comment.aid})
              </Text>
              <Button 
                size="xs" 
                variant="subtle" 
                onClick={() => router.push(`/blog/${comment.aid}`)}
              >
                查看文章
              </Button>
            </Group>
          )}

          {comment.mid && (
            <Group>
              <Text fw={700}>所属整合包:</Text>
              <Text>
                {comment.modpackName || '未知整合包'} (ID: {comment.mid})
              </Text>
              <Button 
                size="xs" 
                variant="subtle" 
                onClick={() => router.push(`/modpack/${comment.mid}`)}
              >
                查看整合包
              </Button>
            </Group>
          )}

          {/* 移除父评论部分，因为API返回中没有这个字段 */}

          <Group>
            <Text fw={700}>状态:</Text>
            <Text>{getStatusText(comment.available)}</Text>
          </Group>

          <Group>
            <Text fw={700}>最后更新:</Text>
            <Text>{new Date(comment.updateTime).toLocaleString('zh-CN')}</Text>
          </Group>
        </Stack>
      </Paper>

      <Group justify="space-between">
        <Button 
          color="red" 
          leftSection={<IconTrash size={14} />} 
          onClick={open}
        >
          删除评论
        </Button>
        <Button 
          onClick={() => router.push(`/profile/${comment.uid}`)}
        >
          查看用户资料
        </Button>
      </Group>

      {/* 删除确认对话框 */}
      <Modal opened={opened} onClose={close} title="确认删除" centered>
        <Text mb="lg">您确定要删除这条评论吗？此操作不可撤销。</Text>
        <Group justify="center">
          <Button variant="outline" onClick={close}>取消</Button>
          <Button color="red" onClick={handleDeleteComment}>确认删除</Button>
        </Group>
      </Modal>
    </Container>
  );
}
