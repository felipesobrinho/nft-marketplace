import type { Ref } from 'react'

interface StepHeadingProps {
  title: string
  description?: string
  headingRef: Ref<HTMLHeadingElement>
}

export function StepHeading({ title, description, headingRef }: StepHeadingProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3">
      <h2 ref={headingRef} tabIndex={-1} className="text-title font-bold text-highlight outline-none">
        {title}
      </h2>
      {description ? <p className="text-small text-muted-foreground">{description}</p> : null}
    </div>
  )
}
