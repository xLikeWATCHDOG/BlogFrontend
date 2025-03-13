import {useEffect} from 'react';
import {useMantineColorScheme} from '@mantine/core';

export default function AutoTheme() {
    const {setColorScheme} = useMantineColorScheme();

    useEffect(() => {
        setColorScheme('auto');
    }, []);
    return <></>;
}
