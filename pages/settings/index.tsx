import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Avatar, Button, Container, Divider, FileButton, Group, LoadingOverlay, Paper, PasswordInput, Select, Stack, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loginToken, setLoginToken] = useState<string | null>(null);

  // 在客户端获取 loginToken
  useEffect(() => {
    const token = localStorage.getItem('loginToken');
    setLoginToken(token);
  }, []);

  // 基本信息表单
  const profileForm = useForm({
    initialValues: {
      username: '',
      gender: '',
    },
    validate: {
      username: (value) => (value.length < 2 ? '用户名至少需要2个字符' : null),
    },
  });

  // 密码表单
  const passwordForm = useForm({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      oldPassword: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
      newPassword: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
      confirmPassword: (value, values) =>
        value !== values.newPassword ? '两次输入的密码不一致' : null,
    },
  });

  // 邮箱表单
  const emailForm = useForm({
    initialValues: {
      newEmail: '',
      password: '',
    },
    validate: {
      newEmail: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : '请输入有效的邮箱地址'),
      password: (value) => (value.length < 6 ? '密码至少需要6个字符' : null),
    },
  });

  // 获取用户信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!loginToken) return;

      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/user/token`, {
          method: 'POST',
          headers: {
            loginToken: loginToken,
          },
        });

        if (!response.ok) {
          notifications.show({
            title: '获取用户信息失败',
            message: '未授权访问',
            color: 'red',
          });
        }

        const data = await response.json();

        if (data.code === 20000 && data.data) {
          setUser(data.data);
          profileForm.setValues({
            username: data.data.username,
            gender: data.data.gender.toString(),
          });
          emailForm.setValues({
            newEmail: data.data.email,
            password: '',
          });
        } else {
          notifications.show({
            title: '获取用户信息失败',
            message: data.message || '请重新登录',
            color: 'red',
          });
          router.push('/');
        }
      } catch (error) {
        console.error('获取用户信息时发生错误:', error);
        notifications.show({
          title: '错误',
          message: '网络错误，请稍后重试',
          color: 'red',
        });
        if ((error as Error).message === '未授权访问') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [loginToken]);

  // 处理头像预览
  useEffect(() => {
    if (avatarFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(avatarFile);
    }
  }, [avatarFile]);

  // 上传头像
  const handleAvatarUpload = async () => {
    if (!avatarFile || !loginToken) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', avatarFile);
      const response = await fetch(`${BACKEND_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          loginToken: loginToken,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.code === 20000) {
        notifications.show({
          title: '成功',
          message: '头像更新成功',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        // 更新用户信息
        if (user) {
          setUser({ ...user, avatar: data.data });
        }
        // 添加页面刷新
        window.location.reload();
      } else {
        notifications.show({
          title: '失败',
          message: data.message || '头像上传失败',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '网络错误，请稍后重试',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 更新基本信息
  const handleUpdateProfile = async (values: typeof profileForm.values) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          username: values.username,
          gender: parseInt(values.gender),
        }),
      });

      const data = await response.json();

      if (data.code === 20000) {
        notifications.show({
          title: '成功',
          message: '个人信息更新成功',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        // 更新用户信息
        if (user) {
          setUser({
            ...user,
            username: values.username,
            gender: parseInt(values.gender),
          });
        }
      } else {
        notifications.show({
          title: '失败',
          message: data.message || '更新失败',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '网络错误，请稍后重试',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新密码
  const handleUpdatePassword = async (values: typeof passwordForm.values) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/user/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (data.code === 20000) {
        notifications.show({
          title: '成功',
          message: '密码更新成功，请重新登录',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        // 清除表单
        passwordForm.reset();
        // 退出登录
        localStorage.removeItem('token');
        router.push('/');
      } else {
        notifications.show({
          title: '失败',
          message: data.message || '密码更新失败',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '网络错误，请稍后重试',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新邮箱
  const handleUpdateEmail = async (values: typeof emailForm.values) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/user/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          newEmail: values.newEmail,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (data.code === 20000) {
        notifications.show({
          title: '成功',
          message: '邮箱更新成功',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        // 更新用户信息
        if (user) {
          setUser({ ...user, email: values.newEmail });
        }
        // 清除密码
        emailForm.setFieldValue('password', '');
      } else {
        notifications.show({
          title: '失败',
          message: data.message || '邮箱更新失败',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '网络错误，请稍后重试',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取头像URL
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (!user || !user.avatar) return null;
    return user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}/photo/${user.avatar}`;
  };

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md" pos="relative">
        <LoadingOverlay visible={loading} />

        <Title order={2} mb="xl">
          账号设置
        </Title>

        <Tabs defaultValue="profile">
          <Tabs.List>
            <Tabs.Tab value="profile">个人资料</Tabs.Tab>
            <Tabs.Tab value="password">修改密码</Tabs.Tab>
            <Tabs.Tab value="email">修改邮箱</Tabs.Tab>
          </Tabs.List>

          {/* 个人资料 */}
          <Tabs.Panel value="profile" pt="xl">
            <Stack>
              <Group justify="center" mb="md">
                <Stack align="center">
                  <Avatar
                    src={getAvatarUrl()}
                    size={120}
                    radius="md"
                    alt={user?.username || '用户头像'}
                  />
                  <Group>
                    <FileButton onChange={setAvatarFile} accept="image/png,image/jpeg,image/gif">
                      {(props) => (
                        <Button {...props} size="xs">
                          选择头像
                        </Button>
                      )}
                    </FileButton>
                    {avatarFile && (
                      <Button
                        size="xs"
                        onClick={handleAvatarUpload}
                        loading={uploadingAvatar}
                        color="green"
                      >
                        上传
                      </Button>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    支持 JPG、PNG、GIF 格式，文件大小不超过 2MB
                  </Text>
                </Stack>
              </Group>

              <Divider my="md" />

              <form onSubmit={profileForm.onSubmit(handleUpdateProfile)}>
                <Stack>
                  <TextInput
                    label="用户名"
                    placeholder="请输入用户名"
                    {...profileForm.getInputProps('username')}
                  />

                  <Select
                    label="性别"
                    placeholder="请选择性别"
                    data={[
                      { value: '1', label: '男' },
                      { value: '2', label: '女' },
                      { value: '3', label: '保密' },
                    ]}
                    {...profileForm.getInputProps('gender')}
                  />

                  <Group justify="flex-end" mt="md">
                    <Button type="submit">保存修改</Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Tabs.Panel>

          {/* 修改密码 */}
          <Tabs.Panel value="password" pt="xl">
            <form onSubmit={passwordForm.onSubmit(handleUpdatePassword)}>
              <Stack>
                <PasswordInput
                  label="当前密码"
                  placeholder="请输入当前密码"
                  {...passwordForm.getInputProps('oldPassword')}
                />

                <PasswordInput
                  label="新密码"
                  placeholder="请输入新密码"
                  {...passwordForm.getInputProps('newPassword')}
                />

                <PasswordInput
                  label="确认新密码"
                  placeholder="请再次输入新密码"
                  {...passwordForm.getInputProps('confirmPassword')}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" color="blue">
                    更新密码
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* 修改邮箱 */}
          <Tabs.Panel value="email" pt="xl">
            <form onSubmit={emailForm.onSubmit(handleUpdateEmail)}>
              <Stack>
                <TextInput label="当前邮箱" value={user?.email || ''} disabled />

                <TextInput
                  label="新邮箱"
                  placeholder="请输入新邮箱"
                  {...emailForm.getInputProps('newEmail')}
                />

                <PasswordInput
                  label="当前密码"
                  placeholder="请输入当前密码以验证身份"
                  {...emailForm.getInputProps('password')}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" color="blue">
                    更新邮箱
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
