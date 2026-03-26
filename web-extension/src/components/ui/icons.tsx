import type { ComponentType } from 'react'
import {
  IoAdd,
  IoCheckmark,
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoCopyOutline,
  IoEye,
  IoEyeOff,
  IoLockClosed,
  IoSettingsOutline,
  IoTrashOutline,
  IoWarningOutline
} from 'react-icons/io5'
import { FiSettings } from 'react-icons/fi'

const createIcon = (IconComponent: ComponentType<any>) => {
  return function WrappedIcon({ boxSize, ...props }: { boxSize?: number | string; [key: string]: any }) {
    return <IconComponent size={boxSize} {...props} />
  }
}

export const AddIcon = createIcon(IoAdd)
export const CheckIcon = createIcon(IoCheckmark)
export const ChevronDownIcon = createIcon(IoChevronDown)
export const ChevronUpIcon = createIcon(IoChevronUp)
export const CloseIcon = createIcon(IoClose)
export const CopyIcon = createIcon(IoCopyOutline)
export const DeleteIcon = createIcon(IoTrashOutline)
export const EditIcon = createIcon(FiSettings)
export const LockIcon = createIcon(IoLockClosed)
export const QuestionOutlineIcon = createIcon(IoWarningOutline)
export const SettingsIcon = createIcon(IoSettingsOutline)
export const ViewIcon = createIcon(IoEye)
export const ViewOffIcon = createIcon(IoEyeOff)
