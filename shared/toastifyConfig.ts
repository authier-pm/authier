import { Flip, ToastContainerProps } from 'react-toastify' // use react-toastify instead of chakra toast. Chakra toast is somehow weirdly broken in extension, see: https://github.com/chakra-ui/chakra-ui/issues/4619
import type { ToastPosition } from 'react-toastify' // use react-toastify instead of chakra toast. Chakra toast is somehow weirdly broken in extension, see: https://github.com/chakra-ui/chakra-ui/issues/4619

export const toastifyConfig = (
  position: ToastPosition | undefined
): ToastContainerProps => {
  return {
    limit: 1,
    closeOnClick: true,
    pauseOnHover: false,
    autoClose: 2700,
    hideProgressBar: true,
    transition: Flip,
    position
  }
}
