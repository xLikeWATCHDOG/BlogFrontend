import { useEffect, useState } from 'react';
import { Button, Modal, Select, Stack, Text } from '@mantine/core';


declare module '@mantine/core';



interface Props {
    packName: string;
    opened: boolean;
    onClose: () => void;
}

export function DownloadModal({packName, opened, onClose}: Props) {
    const [versions, setVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch('https://data.elfidc.com/api/fs/list', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        path: `/Minecraft/整合包/${packName}`
                    })
                });
                const data = await response.json();
                if (data?.data?.content) {
                    const zipFiles = data.data.content
                        .filter((item: any) => item.name.endsWith('.zip'))
                        .map((item: any) => item.name);
                    setVersions(zipFiles);
                    setSelectedVersion(zipFiles[0] || '');
                }
            } catch (error) {
                console.error('获取版本列表失败:', error);
            } finally {
                setLoading(false);
            }
        };

        if (opened) {
            fetchVersions();
        }
    }, [opened, packName]);

    const handleDownload = () => {
        if (selectedVersion) {
            window.open(`https://data.elfidc.com/d/Minecraft/整合包/${packName}/${selectedVersion}`);
            onClose();
        }
    };

    return (
      <Modal opened={opened} onClose={onClose} title="下载整合包" centered>
        <Stack>
          <Text>您正在下载整合包 "{packName}"</Text>
          <Select
            label="请选择版本"
            placeholder="选择版本"
            data={versions}
            value={selectedVersion}
            onChange={(value) => setSelectedVersion(value || '')}
            disabled={loading || versions.length === 0}
          />
          <Button onClick={handleDownload} disabled={!selectedVersion || loading} loading={loading}>
            下载
          </Button>
        </Stack>
      </Modal>
    );
}