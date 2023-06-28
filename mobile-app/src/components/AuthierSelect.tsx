import { ISelectProps, Select } from 'native-base'
import React from 'react'

interface IAuthierSelectProps extends ISelectProps {
  children: React.ReactNode
}

export const AuthierSelect: React.FC<IAuthierSelectProps> = ({
  children,
  ...props
}) => {
  return (
    <Select
      //@ts-expect-error https://github.com/GeekyAnts/NativeBase/issues/5687
      optimized={false}
      minW={150}
      {...props}
    >
      {children}
    </Select>
  )
}
