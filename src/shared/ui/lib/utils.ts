import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const textSizes = ['caption', 'small', 'body', 'body-lg', 'title', 'heading', 'display-sm', 'display']

const colors = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'success',
  'border',
  'border-soft',
  'input',
  'ring',
  'highlight',
  'subtle',
  'coral',
  'amber',
  'surface-raised',
  'surface-dark',
  'white',
  'black',
  'transparent',
  'current',
]

const twMerge = extendTailwindMerge({
  override: {
    theme: {
      text: textSizes,
      color: colors,
      radius: ['sm', 'md', 'lg'],
      container: ['page', 'dialog'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
