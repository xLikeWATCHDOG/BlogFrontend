import React, { useCallback, useEffect, useState } from 'react';
import { IconBrandGithub, IconBrandGoogle, IconBrandQq } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';
import { Button, Divider, Group, Modal, Paper, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';


interface UserLoginModalProps {
  opened: boolean;
  onClose: () => void;
}

// Add these API fetcher functions
const sendMailFetcher = async (_url: string, { arg }: { arg: { email: string; captcha: unknown } }) => {
  const response = await fetch(`${BACKEND_URL}/user/mail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      captcha: JSON.stringify(arg.captcha),
    },
    body: JSON.stringify({ email: arg.email }),
  });
  return response.json();
};

async function sendPhoneFetcher(url: string, { arg }: { arg: { phone: string; captcha: unknown } }) {
  const response = await fetch(`${BACKEND_URL}/user/phone/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      captcha: JSON.stringify(arg.captcha),
    },
    body: JSON.stringify({ phone: arg.phone }),
  });
  return response.json();
}

export function UserLoginModal({ opened, onClose }: UserLoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'phone'>('login');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);

  useEffect(() => {
    const fetchOauthProviders = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/oauth/list`);
        const data = await response.json();
        if (data.code === 20000 && Array.isArray(data.data)) {
          setOauthProviders(data.data);
        } else {
          console.error('Invalid OAuth providers data:', data);
          setOauthProviders([]);
        }
      } catch (error) {
        console.error('Failed to fetch OAuth providers:', error);
        setOauthProviders([]);
        notifications.show({
          title: '请求失败',
          message: '网络错误，请稍后重试',
          color: 'red',
        });
      }
    };

    fetchOauthProviders();
  }, []);

  const { trigger: sendMailTrigger } = useSWRMutation('/api/sendMail', sendMailFetcher);
  const { trigger: sendPhoneTrigger } = useSWRMutation('/api/sendPhone', sendPhoneFetcher);

  const startCountdown = useCallback((type: 'email' | 'phone') => {
    const setCountdown = type === 'email' ? setEmailCountdown : setPhoneCountdown;
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendMail = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            const email = registerForm.values.email;
            const response = await sendMailTrigger({ email, captcha: res });

            if (response?.code === 20000) {
              notifications.show({
                title: '发送成功',
                message: '验证码已发送到您的邮箱',
                color: 'teal',
              });
              startCountdown('email');
            } else {
              notifications.show({
                title: '发送失败',
                message: response?.message || '请稍后重试',
                color: 'red',
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            notifications.show({
              title: '发送失败',
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

  const handleSendPhone = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            const phone = phoneForm.values.phone;
            const response = await sendPhoneTrigger({ phone, captcha: res });

            if (response?.code === 20000) {
              notifications.show({
                title: '发送成功',
                message: '验证码已发送到您的手机',
                color: 'teal',
              });
              startCountdown('phone');
            } else {
              notifications.show({
                title: '发送失败',
                message: response?.message || '请稍后重试',
                color: 'red',
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            notifications.show({
              title: '发送失败',
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

  const handleClose = () => {
    setMode('login');
    emailForm.reset();
    phoneForm.reset();
    registerForm.reset();
    onClose();
  };

  // 添加一个通用的验证码处理函数
  const handleFormSubmitWithCaptcha = async (values: unknown, action: string) => {
    notifications.clean(); // 先清理之前的通知

    notifications.show({
      loading: true,
      title: '处理中...',
      message: '请稍候',
      autoClose: false,
      withCloseButton: false,
      color: 'blue',
    });

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            const response = await fetch(`${BACKEND_URL}/user/${action}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                captcha: JSON.stringify(res),
              },
              body: JSON.stringify(values),
            });

            const data = await response.json();

            notifications.clean(); // 清理加载中的通知

            if (response.ok && data.code === 20000) {
              notifications.show({
                title: '操作成功',
                message: action === 'login' ? '欢迎回来！' : '注册成功！',
                color: 'teal',
                autoClose: 2000,
              });

              if ((action === 'login' || action === 'register') && data.data) {
                const date = new Date();
                date.setDate(date.getDate() + 7);
                document.cookie = `loginToken=${data.data.token}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
                localStorage.setItem('loginToken', data.data.token ?? '');

                setTimeout(() => {
                  handleClose();
                  window.location.reload();
                }, 1000);
              }
            } else {
              notifications.show({
                title: '操作失败',
                message: data.message || '服务器错误',
                color: 'red',
                autoClose: 3000,
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error: unknown) {
            notifications.clean();
            notifications.show({
              title: '请求失败',
              message: '网络错误，请稍后重试',
              color: 'red',
              autoClose: 3000,
            });
          }
        } else {
          notifications.clean();
          notifications.show({
            title: '验证失败',
            message: '请完成验证',
            color: 'red',
            autoClose: 3000,
          });
        }
      });

      captcha.show();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notifications.clean();
      notifications.show({
        title: '系统错误',
        message: '验证码加载失败',
        color: 'red',
        autoClose: 3000,
      });
    }
  };

  const emailForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '请输入有效的邮箱地址'),
      password: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
    },
  });

  const phoneForm = useForm({
    initialValues: {
      phone: '',
      code: '',
    },
    validate: {
      phone: (value) => (/^1\d{10}$/.test(value) ? null : '请输入有效的手机号'),
      code: (value) => (/^\d{6}$/.test(value) ? null : '验证码必须是6位数字'),
    },
  });

  const registerForm = useForm({
    initialValues: {
      username: '',
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      username: (value) => (value.length < 2 ? '用户名至少需要2个字符' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '请输入有效的邮箱地址'),
      code: (value) => (/^\d{6}$/.test(value) ? null : '验证码必须是6位数字'), // 已修改为 code
      password: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? '两次输入的密码不一致' : null,
    },
  });

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <form
            onSubmit={emailForm.onSubmit((values) => handleFormSubmitWithCaptcha(values, 'login'))}
          >
            <Stack>
              <TextInput
                required
                label="邮箱"
                placeholder="邮箱"
                radius="md"
                {...emailForm.getInputProps('email')}
              />
              <PasswordInput
                required
                label="密码"
                placeholder="输入密码"
                radius="md"
                {...emailForm.getInputProps('password')}
              />
              <Group justify="space-between" mt="md">
                <Text
                  size="sm"
                  c="blue"
                  onClick={() => setMode('forgot')}
                  style={{ cursor: 'pointer' }}
                >
                  忘记密码？
                </Text>
                <Text
                  size="sm"
                  c="blue"
                  onClick={() => setMode('phone')}
                  style={{ cursor: 'pointer' }}
                >
                  手机号登录
                </Text>
              </Group>
              <Button type="submit" radius="xl">
                登录
              </Button>
              <Text c="dimmed" size="sm" ta="center">
                还没有账号？{' '}
                <Text
                  span
                  c="blue"
                  onClick={() => setMode('register')}
                  style={{ cursor: 'pointer' }}
                >
                  注册
                </Text>
              </Text>
            </Stack>
          </form>
        );

      case 'register':
        return (
          <form
            onSubmit={registerForm.onSubmit((values) =>
              handleFormSubmitWithCaptcha(values, 'register')
            )}
          >
            <Stack>
              <TextInput
                required
                label="用户名"
                placeholder="输入用户名"
                radius="md"
                {...registerForm.getInputProps('username')}
              />
              <TextInput
                required
                label="邮箱"
                placeholder="邮箱"
                radius="md"
                {...registerForm.getInputProps('email')}
              />
              <Group grow>
                <TextInput
                  required
                  label="验证码"
                  placeholder="请输入验证码"
                  radius="md"
                  {...registerForm.getInputProps('code')}
                />
                <Button
                  style={{ marginTop: 'var(--mantine-spacing-lg)' }}
                  disabled={!/^\S+@\S+$/.test(registerForm.values.email) || emailCountdown > 0}
                  radius="xl"
                  onClick={handleSendMail}
                >
                  {emailCountdown > 0 ? `${emailCountdown}秒后重试` : '获取验证码'}
                </Button>
              </Group>
              <PasswordInput
                required
                label="密码"
                placeholder="输入密码"
                radius="md"
                {...registerForm.getInputProps('password')}
              />
              <PasswordInput
                required
                label="确认密码"
                placeholder="再次输入密码"
                radius="md"
                {...registerForm.getInputProps('confirmPassword')}
              />
              <Button type="submit" radius="xl">
                注册
              </Button>
              <Text c="dimmed" size="sm" ta="center">
                已有账号？{' '}
                <Text span c="blue" onClick={() => setMode('login')} style={{ cursor: 'pointer' }}>
                  登录
                </Text>
              </Text>
            </Stack>
          </form>
        );

      case 'forgot':
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault(); // 阻止表单默认提交行为
              try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const captcha = new TencentCaptcha('190249560', async (res) => {
                  if (res.ret === 0) {
                    try {
                      const response = await fetch(`${BACKEND_URL}/user/forget`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          captcha: JSON.stringify(res),
                        },
                        body: JSON.stringify({ email: emailForm.values.email }),
                      });

                      const data = await response.json();

                      if (data.code === 20000) {
                        notifications.show({
                          title: '发送成功',
                          message: '重置邮件已发送，请查收',
                          color: 'teal',
                        });
                        handleClose();
                      } else {
                        notifications.show({
                          title: '发送失败',
                          message: data.message || '请稍后重试',
                          color: 'red',
                        });
                      }
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                      notifications.show({
                        title: '发送失败',
                        message: '网络错误，请稍后重试',
                        color: 'red',
                      });
                    }
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
            }}
          >
            <Stack>
              <TextInput
                required
                label="邮箱"
                placeholder="邮箱"
                radius="md"
                {...emailForm.getInputProps('email')}
              />
              <Button type="submit" radius="xl">
                发送重置邮件
              </Button>
              <Text c="dimmed" size="sm" ta="center">
                记起密码了？{' '}
                <Text span c="blue" onClick={() => setMode('login')} style={{ cursor: 'pointer' }}>
                  返回登录
                </Text>
              </Text>
            </Stack>
          </form>
        );

      case 'phone':
        return (
          <form
            onSubmit={phoneForm.onSubmit((values) =>
              handleFormSubmitWithCaptcha(values, 'phoneLogin')
            )}
          >
            <Stack>
              <TextInput
                required
                label="手机号"
                placeholder="请输入手机号"
                radius="md"
                type="tel"
                {...phoneForm.getInputProps('phone')}
              />
              <Group grow>
                <TextInput
                  required
                  label="验证码"
                  placeholder="请输入验证码"
                  radius="md"
                  {...phoneForm.getInputProps('code')}
                />
                <Button
                  style={{ marginTop: 'var(--mantine-spacing-lg)' }}
                  disabled={!/^1\d{10}$/.test(phoneForm.values.phone) || phoneCountdown > 0}
                  radius="xl"
                  onClick={handleSendPhone}
                >
                  {phoneCountdown > 0 ? `${phoneCountdown}秒后重试` : '获取验证码'}
                </Button>
              </Group>
              <Button type="submit" radius="xl">
                登录
              </Button>
              <Text c="dimmed" size="sm" ta="center">
                返回{' '}
                <Text span c="blue" onClick={() => setMode('login')} style={{ cursor: 'pointer' }}>
                  密码登录
                </Text>
              </Text>
            </Stack>
          </form>
        );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size="md"
      radius="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      transitionProps={{
        transition: 'slide-up',
        duration: 300,
        timingFunction: 'ease-out',
      }}
    >
      <Paper radius="lg" p="xl">
        <Text
          size="xl"
          fw={600}
          ta="center"
          mb="xl"
          variant="gradient"
          gradient={{ from: 'violet', to: 'cyan' }}
        >
          {mode === 'login'
            ? '欢迎回来'
            : mode === 'register'
              ? '创建账号'
              : mode === 'phone'
                ? '手机号登录'
                : '重置密码'}
        </Text>

        {renderForm()}

        {mode === 'login' && oauthProviders.length > 0 && (
          <>
            <Divider label="或者使用以下方式登录" labelPosition="center" my="lg" />

            <Group grow mb="md" mt="md">
              {oauthProviders.map((provider) => (
                <Button
                  key={provider}
                  leftSection={
                    provider === 'github' ? (
                      <IconBrandGithub size={20} />
                    ) : provider === 'google' ? (
                      <IconBrandGoogle size={20} />
                    ) : provider === 'qq' ? (
                      <IconBrandQq size={20} />
                    ) : null
                  }
                  variant="default"
                  radius="xl"
                  onClick={() => (window.location.href = `${BACKEND_URL}/oauth/${provider}`)}
                >
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              ))}
            </Group>
          </>
        )}
      </Paper>
    </Modal>
  );
}
