import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useSWRMutation from 'swr/mutation';
import { Box, Button, Container, FileButton, Group, Image, MultiSelect, Stack, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';


interface FormValues {
  title: string;
  summary: string;
  tags: string[];
  content: string;
  image: File | null;
}

export default function NewBlogPost() {
  const form = useForm<FormValues>({
    initialValues: {
      title: '',
      summary: '',
      tags: [],
      content: '',
      image: null,
    },
    validate: {
      title: (value) => (value.trim().length === 0 ? '标题不能为空' : null),
      summary: (value) => (value.trim().length === 0 ? '简介不能为空' : null),
      content: (value) => (value.trim().length === 0 ? '内容不能为空' : null),
      tags: (value) => (value.length === 0 ? '请至少选择一个标签' : null),
    },
  });

  const [tagOptions] = useState([
    '技术',
    '资源',
    '生活',
    '旅行',
    '教育',
    '健康',
    '艺术',
    '科学',
    '音乐',
    '电影',
    '体育',
    '美食',
    '时尚',
    '历史',
    '文化',
    '自然',
    '政治',
    '经济',
    '哲学',
    '心理学',
    '文学',
  ]);

  const { trigger: createPost, isMutating } = useSWRMutation(
    `${BACKEND_URL}/blog`,
    async (url, { arg }: { arg: unknown }) => {
      const loginToken = localStorage.getItem('loginToken');

      // Check if image exists
      if (!form.values.image) {
        throw new Error('请上传图片');
      }

      // 构建包含所有参数的 URL
      const urlWithParams = new URL(url);
      urlWithParams.searchParams.append('title', form.values.title);
      urlWithParams.searchParams.append('summary', form.values.summary);
      urlWithParams.searchParams.append('content', form.values.content);
      form.values.tags.forEach((tag) => {
        urlWithParams.searchParams.append('tags', tag);
      });

      // 只将图片作为请求体传输
      const formData = new FormData();
      formData.append('image', form.values.image);

      const response = await fetch(urlWithParams.toString(), {
        method: 'POST',
        headers: {
          captcha: JSON.stringify(arg),
          loginToken: loginToken || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '发布失败');
      }

      return response.json();
    }
  );

  const handleSubmit = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            const result = await createPost(res);
            notifications.show({
              title: '发布成功',
              message: '文章已成功发布',
              color: 'green',
            });
            // 使用返回的文章ID跳转到文章详情页
            if (result && result.data) {
              router.push(`/blog/${result.data}`);
            }
          } catch (error) {
            notifications.show({
              title: '发布失败',
              message: error instanceof Error ? error.message : '未知错误',
              color: 'red',
            });
          }
        }
      });
      captcha.show();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notifications.show({
        title: '验证失败',
        message: '请稍后重试',
        color: 'red',
      });
    }
  };

  // 移除 handleModalClose 函数，因为不再需要
  const router = useRouter();

  return (
    <>
      {/* 移除 UserLoginModal 组件 */}
      <Box pb={80}>
        <Container size="sm" mt="xl">
          <Title order={2} ta="center" mb="xl">
            发布新帖子
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              {' '}
              {/* 调整堆栈间距 */}
              <TextInput
                required
                label="标题"
                placeholder="输入帖子标题"
                {...form.getInputProps('title')}
              />
              <TextInput
                required
                label="简介"
                placeholder="输入帖子简介"
                {...form.getInputProps('summary')}
              />
              <Box>
                <Text fw={500} size="sm" mb={5}>
                  图片{' '}
                  <Text component="span" c="red">
                    *
                  </Text>
                </Text>
                <Group>
                  <FileButton
                    onChange={(file) => form.setFieldValue('image', file)}
                    accept="image/png,image/jpeg,image/jpg"
                  >
                    {(props) => <Button {...props}>上传图片</Button>}
                  </FileButton>
                  {form.values.image && <Text size="sm">已选择: {form.values.image.name}</Text>}
                </Group>
                {form.errors.image && (
                  <Text c="red" size="xs" mt={5}>
                    {form.errors.image}
                  </Text>
                )}
              </Box>
              {form.values.image && URL.createObjectURL(form.values.image) && (
                <Box>
                  <Text fw={500} size="sm" mb={5}>
                    预览:
                  </Text>
                  <Image
                    src={URL.createObjectURL(form.values.image)}
                    alt="预览图"
                    width={200}
                    height={150}
                    fit="cover"
                    radius="md"
                  />
                </Box>
              )}
              <MultiSelect
                required
                label="标签"
                placeholder="选择标签"
                data={tagOptions.map((tag) => ({ value: tag, label: tag }))}
                searchable
                {...form.getInputProps('tags')}
              />
              <Box>
                <Text fw={500} size="md" mb={10}>
                  内容{' '}
                  <Text component="span" c="red">
                    *
                  </Text>
                </Text>
                <Tabs defaultValue="edit">
                  <Tabs.List>
                    <Tabs.Tab value="edit">编辑</Tabs.Tab>
                    <Tabs.Tab value="preview">预览</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="edit">
                    <div
                      data-color-mode="light"
                      style={{ backgroundColor: 'var(--mantine-color-body)' }}
                    >
                      <textarea
                        placeholder="输入Markdown内容"
                        value={form.values.content}
                        onChange={(event) => form.setFieldValue('content', event.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '400px',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </Tabs.Panel>

                  <Tabs.Panel value="preview">
                    <div
                      data-color-mode="light"
                      style={{ backgroundColor: 'var(--mantine-color-body)' }}
                    >
                      <Box
                        p="md"
                        style={{
                          minHeight: '400px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                        }}
                      >
                        <Markdown remarkPlugins={[remarkGfm]}>{form.values.content}</Markdown>
                      </Box>
                    </div>
                  </Tabs.Panel>
                </Tabs>
              </Box>
              <Stack align="center" mt="md" mb="xl">
                <Button type="submit" size="md" loading={isMutating}>
                  {isMutating ? '发布中...' : '发布'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Container>
      </Box>
    </>
  );
}
