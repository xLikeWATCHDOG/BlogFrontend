import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconDashboard,
  IconFlag,
  IconLogout,
  IconPackage,
  IconPlus,
  IconSettings,
  IconUserCircle,
} from '@tabler/icons-react';
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { UserLoginModal } from '@/components/User/UserLoginModal';
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

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function HeaderComponent() {
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure();
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isSmallScreen = useMediaQuery('(max-width: 36em)');
  const [loginOpened, { open: openLogin, close: closeLogin }] = useDisclosure(false);
  const [user, setUser] = useState<UserVO>();
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/user/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: localStorage.getItem('loginToken') || '',
        },
      });

      const data = await response.json();

      if (data.code === 20000) {
        document.cookie = 'loginToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('loginToken');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setUser(null);
        notifications.show({
          title: '退出成功',
          message: '期待您的下次访问',
          color: 'teal',
        });
        router.push('/');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notifications.show({
        title: '退出失败',
        message: '请稍后重试',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const cookies = document.cookie.split(';');
        const loginToken = cookies
          .find((cookie) => cookie.trim().startsWith('loginToken='))
          ?.split('=')[1];

        if (loginToken) {
          const tokenResponse = await fetch(`${BACKEND_URL}/user/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              loginToken,
            },
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.code === 20000 && tokenData.data) {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            document.cookie = `loginToken=${tokenData.data.token}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
            localStorage.setItem('loginToken', tokenData.data.token);

            setUser(tokenData.data);
            notifications.show({
              title: '欢迎回来',
              message: `${tokenData.data.username}`,
              color: 'teal',
              autoClose: 2000,
            });
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const mockSuggestions = [
    { value: '前端开发' },
    { value: 'React 教程' },
    { value: 'TypeScript 入门' },
    { value: '性能优化' },
  ];

  const handleSearchSubmit = useCallback((value: string) => {
    console.log('执行搜索:', value);
  }, []);

  return (
    <>
      <AppShell.Header>
        <Group px="md" h="100%" justify="space-between">
          <Group>
            {isMobile && (
              <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Title order={isMobile ? 3 : 2}>
                <Text
                  inherit
                  variant="gradient"
                  component="span"
                  gradient={{ from: 'pink', to: 'blue' }}
                >
                  整合包中心
                </Text>
              </Title>
            </Link>
          </Group>

          <Group gap="xs">
            {!loading &&
              (user ? (
                <>
                  <Menu shadow="md" width={150} position="bottom-end">
                    <Menu.Target>
                      <Button variant="subtle" leftSection={<IconPlus size={16} />} size="sm">
                        发布
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => router.push('/modpack/new')}>新资源</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                      <Avatar
                        src={`${BACKEND_URL}/user/avatar/${user.uid}`}
                        radius="xl"
                        size="md"
                        style={{ cursor: 'pointer' }}
                      />
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconSettings size={14} />}
                        onClick={() => router.push(`/settings`)}
                      >
                        设置
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconPackage size={14} />}
                        onClick={() => router.push(`/modpack/my`)}
                      >
                        我的资源
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconFlag size={14} />}
                        onClick={() => router.push('/report')}
                      >
                        举报列表
                      </Menu.Item>
                      <Menu.Divider />
                      {(user.group?.permission === '*' ||
                        user.group?.permission === 'group.admin') && (
                        <>
                          <Menu.Item
                            leftSection={<IconDashboard size={14} />}
                            onClick={() => router.push('/admin')}
                          >
                            管理面板
                          </Menu.Item>
                        </>
                      )}
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={handleLogout}
                      >
                        退出
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'cyan' }}
                  size="sm"
                  onClick={openLogin}
                >
                  登录
                </Button>
              ))}
          </Group>
        </Group>
      </AppShell.Header>

      {/* 移动端导航抽屉也需要添加发表选项 */}
      <Drawer
        opened={opened}
        onClose={close}
        size="xs"
        padding="md"
        title={
          <Text size="lg" fw={500}>
            导航菜单
          </Text>
        }
      >
        <Group gap="sm">
          <Stack w="100%">
            {user && (
              <>
                <Divider />
                <Text fw={500}>发表内容</Text>
                <Button
                  variant="light"
                  onClick={() => {
                    router.push('/modpack/new');
                    close();
                  }}
                >
                  新资源
                </Button>
              </>
            )}
          </Stack>
        </Group>
      </Drawer>

      <UserLoginModal opened={loginOpened} onClose={closeLogin} />
    </>
  );
}
