import {useCallback, useState} from 'react';
import Link from 'next/link';
import {IconSearch} from '@tabler/icons-react';
import {AppShell, Autocomplete, Burger, Button, Divider, Drawer, Group, Stack, Text, Title} from '@mantine/core';
import {useDebouncedValue, useDisclosure, useMediaQuery} from '@mantine/hooks';
import {UserLoginModal} from '@/components/User/UserLoginModal';

export function HeaderComponent() {
    const [opened, {toggle, close}] = useDisclosure();
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 300);
    const isMobile = useMediaQuery('(max-width: 48em)');
    const isSmallScreen = useMediaQuery('(max-width: 36em)');
    const [loginOpened, {open: openLogin, close: closeLogin}] = useDisclosure(false);

    const mockSuggestions = [
        {value: '前端开发'},
        {value: 'React 教程'},
        {value: 'TypeScript 入门'},
        {value: '性能优化'},
    ];

    const handleSearchSubmit = useCallback((value: string) => {
        console.log('执行搜索:', value);
    }, []);

    const NavLinks = () => (
        <>
            <Link href="/" style={{textDecoration: 'none'}}>
                <Button variant="transparent" size="lg">
                    <Text
                        variant="gradient"
                        gradient={{from: 'violet', to: 'cyan'}}
                        size="lg"
                        fw={500}
                    >
                        主页
                    </Text>
                </Button>
            </Link>
            <Link href="/hot" style={{textDecoration: 'none'}}>
                <Button variant="transparent" size="lg">
                    <Text
                        variant="gradient"
                        gradient={{from: 'orange', to: 'red'}}
                        size="lg"
                        fw={500}
                    >
                        热门
                    </Text>
                </Button>
            </Link>
            <Link href="/rank" style={{textDecoration: 'none'}}>
                <Button variant="transparent" size="lg">
                    <Text
                        variant="gradient"
                        gradient={{from: 'indigo', to: 'grape'}}
                        size="lg"
                        fw={500}
                    >
                        排行
                    </Text>
                </Button>
            </Link>

            <Divider orientation="vertical"/>

            <Link href="/modpack" style={{textDecoration: 'none'}}>
                <Button variant="transparent" size="lg">
                    <Text
                        variant="gradient"
                        gradient={{from: 'teal', to: 'lime'}}
                        size="lg"
                        fw={500}
                    >
                        整合包
                    </Text>
                </Button>
            </Link>
        </>
    );

    return (
        <>
            <AppShell.Header>
                <Group px="md" h="100%" justify="space-between">
                    <Group>
                        {isMobile && (
                            <Burger
                                opened={opened}
                                onClick={toggle}
                                size="sm"
                                aria-label="Toggle navigation"
                            />
                        )}
                        <Link href="/" style={{textDecoration: 'none'}}>
                            <Title order={isMobile ? 3 : 2}>
                                <Text
                                    inherit
                                    variant="gradient"
                                    component="span"
                                    gradient={{from: 'pink', to: 'blue'}}
                                >
                                    Birdy's Blog
                                </Text>
                            </Title>
                        </Link>
                    </Group>

                    {!isMobile && (
                        <Group gap="xs">
                            <NavLinks/>
                        </Group>
                    )}

                    <Group gap="xs">
                        {!isSmallScreen && (
                            <Autocomplete
                                value={searchValue}
                                onChange={setSearchValue}
                                placeholder="搜索文章/整合包..."
                                leftSection={<IconSearch size={16}/>}
                                data={mockSuggestions}
                                size="sm"
                                w={200}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && searchValue !== '') {
                                        handleSearchSubmit(searchValue);
                                    }
                                }}
                            />
                        )}
                        <Button
                            variant="gradient"
                            gradient={{from: 'violet', to: 'cyan'}}
                            size="sm"
                            onClick={openLogin}
                        >
                            登录
                        </Button>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* 移动端导航抽屉 */}
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
                    {isSmallScreen && (
                        <Autocomplete
                            value={searchValue}
                            onChange={setSearchValue}
                            placeholder="搜索文章/整合包..."
                            leftSection={<IconSearch size={16}/>}
                            data={mockSuggestions}
                            w="100%"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && searchValue !== '') {
                                    handleSearchSubmit(searchValue);
                                    close();
                                }
                            }}
                        />
                    )}
                    <Stack w="100%">
                        <NavLinks/>
                    </Stack>
                </Group>
            </Drawer>

            <UserLoginModal opened={loginOpened} onClose={closeLogin}/>
        </>
    );
}
