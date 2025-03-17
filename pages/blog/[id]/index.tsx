import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconCalendar, IconEye, IconMessage, IconUser } from '@tabler/icons-react';
import Markdown from 'react-markdown';
import { Avatar, Badge, Box, Button, Card, Container, Divider, Group, Image, Pagination, Paper, Skeleton, Stack, Text, Textarea, Title } from '@mantine/core';
import { BACKEND_URL } from '@/data/global';


// 添加评论相关接口
interface ArticleComment {
  id: number;
  aid: number;
  content: string;
  createTime: string;
  username: string;
  avatar?: string;
}

// 修改 CommentPage 接口以匹配后端返回的数据结构
interface CommentPage {
  records: ArticleComment[];
  current: number;     // 当前页号
  pageSize: number;    // 页面大小
  totalPage: number;   // 总页数
  totalRow: number;    // 总记录数
}

interface ArticleVO {
  id: number;
  title: string;
  description: string;
  createTime: string;
  tags: string[];
  views: number;
  image: string;
  author: string;
  content?: string; // 文章内容
}

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState<ArticleVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 评论相关状态
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [commentPage, setCommentPage] = useState<CommentPage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchArticle(id as string);
      fetchComments(id as string, 1);
    }
  }, [id]);

  // 获取用户信息
  useEffect(() => {
    const loginToken = localStorage.getItem('loginToken');
    if (loginToken) {
      fetch(`${BACKEND_URL}/user/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 20000 && data.data) {
            setUser(data.data);
          }
        })
        .catch((err) => console.error('获取用户信息失败:', err));
    }
  }, []);

  // 从URL获取当前页码
  useEffect(() => {
    if (router.query.page) {
      const pageNum = parseInt(router.query.page as string, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
        if (id) {
          fetchComments(id as string, pageNum);
        }
      }
    }
  }, [router.query.page, id]);

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/blog/${articleId}`);

      if (!response.ok) {
        throw new Error('文章获取失败');
      }

      const data = await response.json();

      if (data.code === 20000 && data.data) {
        setArticle(data.data);
      } else {
        throw new Error(data.message || '文章获取失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取评论的函数
  const fetchComments = async (articleId: string, page: number) => {
    try {
      setCommentLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/blog/comment?id=${articleId}&current=${page}&pageSize=10`
      );

      if (!response.ok) {
        throw new Error('评论获取失败');
      }

      const data = await response.json();

      if (data.code === 20000 && data.data) {
        console.log('评论分页数据:', data.data);
        setCommentPage(data.data);
        setComments(data.data.records || []);
      } else {
        console.error('获取评论失败:', data.message);
      }
    } catch (err) {
      console.error('获取评论失败:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  // 提交评论
  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/blog/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          aid: id,
          content: newComment,
          uid: user.uid, // 添加用户ID
        }),
      });

      if (!response.ok) {
        throw new Error('评论发布失败');
      }

      const data = await response.json();

      if (data.code === 20000) {
        setNewComment('');
        // 更新路由，将页码设为1（最新评论页）
        router.push({
          pathname: `/blog/${id}`,
          query: { page: 1 }
        }, undefined, { shallow: true });
        // 重新获取第一页评论
        fetchComments(id as string, 1);
        setCurrentPage(1);
      } else {
        throw new Error(data.message || '评论发布失败');
      }
    } catch (err) {
      console.error('评论发布失败:', err);
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    // 更新路由中的页码
    router.push({
      pathname: `/blog/${id}`,
      query: { page }
    }, undefined, { shallow: true });
    
    setCurrentPage(page);
    fetchComments(id as string, page);
  };

  if (loading) {
    return (
      <Box pb={80}>
        <Container size="sm" mt="xl">
          <Skeleton height={50} width="70%" mb="xl" />
          <Group mb="md">
            <Skeleton height={20} width={100} />
            <Skeleton height={20} width={100} />
            <Skeleton height={20} width={100} />
          </Group>
          <Skeleton height={300} mb="xl" />
          <Skeleton height={20} width="90%" mb="sm" />
          <Skeleton height={20} width="95%" mb="sm" />
          <Skeleton height={20} width="85%" mb="sm" />
          <Skeleton height={20} width="90%" mb="sm" />
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box pb={80}>
        <Container size="sm" mt="xl">
          <Title order={1} c="red">
            出错了
          </Title>
          <Box
            mt="md"
            p="md"
            style={{ border: '1px solid red', borderRadius: '4px', backgroundColor: '#ffeeee' }}
          >
            <Text size="lg">{error}</Text>
          </Box>
          <Box mt="xl">
            <Button onClick={() => router.push('/')} color="blue">
              返回首页
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!article) {
    return (
      <Box pb={80}>
        <Container size="sm" mt="xl">
          <Title order={1}>文章不存在</Title>
          <Box mt="xl">
            <Button onClick={() => router.push('/')} color="blue">
              返回首页
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box pb={80}>
      <Container size="lg" mt="xl">
        <Title order={1} mb="md">
          {article.title}
        </Title>

        <Group mb="lg">
          <Group gap="xs">
            <IconUser size={16} />
            <Text size="sm">{article.author}</Text>
          </Group>
          <Group gap="xs">
            <IconCalendar size={16} />
            <Text size="sm">{new Date(article.createTime).toLocaleDateString('zh-CN')}</Text>
          </Group>
          <Group gap="xs">
            <IconEye size={16} />
            <Text size="sm">{article.views} 次浏览</Text>
          </Group>
        </Group>

        <Group mb="lg">
          {article.tags.map((tag) => (
            <Badge key={tag} color="blue" variant="light">
              {tag}
            </Badge>
          ))}
        </Group>

        {article.image && (
          <Image
            src={
              article.image.startsWith('http')
                ? article.image
                : `${BACKEND_URL}/photo/${article.image}`
            }
            alt={article.title}
            radius="md"
            mb="lg"
            style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
          />
        )}

        <Text size="lg" mb="lg" fw={500}>
          {article.description}
        </Text>

        <Divider my="lg" />

        <Box className="article-content">
          {article.content ? <Markdown>{article.content}</Markdown> : <Text>暂无内容</Text>}
        </Box>

        {/* 评论区 */}
        <Box mt={50}>
          <Divider
            my="xl"
            labelPosition="center"
            label={
              <Group gap="xs">
                <IconMessage size={16} />
                <Text>评论区</Text>
              </Group>
            }
          />

          {/* 评论输入框 */}
          <Paper p="md" withBorder mb="xl">
            <Textarea
              placeholder={user ? '发表你的评论...' : '登录后发表评论'}
              value={newComment}
              onChange={(e) => setNewComment(e.currentTarget.value)}
              minRows={3}
              mb="md"
              disabled={!user}
            />
            <Group justify="flex-end">
              <Button onClick={submitComment} disabled={!user || !newComment.trim()}>
                发表评论
              </Button>
            </Group>
          </Paper>

          {/* 评论列表 */}
          {commentLoading ? (
            <Stack>
              <Skeleton height={100} radius="md" />
              <Skeleton height={100} radius="md" />
              <Skeleton height={100} radius="md" />
            </Stack>
          ) : comments.length > 0 ? (
            <>
              <Stack gap="md">
                {comments.map((comment) => (
                  <Card key={comment.id} withBorder shadow="sm" radius="md" p="md">
                    <Group gap="sm" mb="xs">
                      <Avatar src={comment.avatar} radius="xl" color="blue">
                        {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box>
                        <Text fw={500}>{comment.username || '匿名用户'}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(comment.createTime).toLocaleString('zh-CN')}
                        </Text>
                      </Box>
                    </Group>
                    <Text pl={40}>{comment.content}</Text>
                  </Card>
                ))}
              </Stack>

              {/* 分页控件 */}
              <Group justify="center" mt="xl">
                <Stack align="center" gap="xs">
                  <Pagination
                    total={commentPage?.totalPage || 1}
                    value={currentPage}
                    onChange={handlePageChange}
                    radius="md"
                    withEdges
                  />
                  <Text size="sm" c="dimmed">
                    共 {commentPage?.totalPage || 0} 页，{commentPage?.totalRow || 0} 条评论
                  </Text>
                </Stack>
              </Group>
            </>
          ) : (
            <Box ta="center" py="xl">
              <Text c="dimmed">暂无评论，快来发表第一条评论吧！</Text>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}