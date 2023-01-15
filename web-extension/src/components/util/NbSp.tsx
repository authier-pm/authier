import { FC } from 'react'
/**
 *  just non breaking space for JSX from https://stackoverflow.com/a/54485712/671457
 *  JSX is weird with &nbsp; even though people claim otherwise
 */
export const NbSp: FC = () => '\u00A0' as any as JSX.Element
