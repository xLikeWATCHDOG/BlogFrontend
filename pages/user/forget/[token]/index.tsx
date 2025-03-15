import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Container, Loader, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [isValidToken, setIsValidToken] = useState(false);

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? '两次输入的密码不一致' : null,
    },
  });

  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${BACKEND_URL}/user/check/forget`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();
          if (data.code === 20000) {
            setIsValidToken(true);
          } else {
            notifications.show({
              title: '链接无效',
              message: '重置链接已过期或无效',
              color: 'red',
            });
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          notifications.show({
            title: '验证失败',
            message: '请稍后重试',
            color: 'red',
          });
        }
      }
    };

    checkToken();
  }, [token, router]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            const response = await fetch(`${BACKEND_URL}/user/forget/password`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                captcha: JSON.stringify(res),
                forgetToken: token as string,
              },
              body: JSON.stringify({
                password: values.password,
              }),
            });

            const data = await response.json();

            if (data.code === 20000) {
              notifications.show({
                title: '重置成功',
                message: '密码已重置，请重新登录',
                color: 'teal',
              });
              setTimeout(() => {
                router.push('/');
              }, 2000);
            } else {
              notifications.show({
                title: '重置失败',
                message: data.message || '请稍后重试',
                color: 'red',
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            notifications.show({
              title: '请求失败',
              message: '网络错误，请稍后重试',
              color: 'red',
            });
          }
        } else {
          notifications.show({
            title: '验证失败',
            message: '请完成验证',
            color: 'red',
          });
        }
      });
      captcha.show();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notifications.show({
        title: '系统错误',
        message: '验证码加载失败',
        color: 'red',
      });
    }
  };

  if (!isValidToken) {
    return (
      <Container size="xs" mt="xl">
        <Stack align="center" gap="md">
          <Title order={2} ta="center">
            验证中...
          </Title>
          <Loader color="blue" size="lg" type="dots" />
          <Text size="sm" c="dimmed">
            正在验证重置链接的有效性
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs" mt="xl">
      <Title order={2} ta="center" mb="xl">
        重置密码
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <PasswordInput
            required
            label="新密码"
            placeholder="请输入新密码"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            required
            label="确认密码"
            placeholder="请再次输入新密码"
            {...form.getInputProps('confirmPassword')}
          />
          <Button type="submit" fullWidth mt="md">
            重置密码
          </Button>
        </Stack>
      </form>
    </Container>
  );
}