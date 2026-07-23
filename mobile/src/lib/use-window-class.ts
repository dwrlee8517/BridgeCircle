import { useWindowDimensions } from 'react-native'
import { type WindowClass, windowClassForWidth } from './window-class'

export function useWindowClass(): WindowClass {
  const { width } = useWindowDimensions()
  return windowClassForWidth(width)
}
