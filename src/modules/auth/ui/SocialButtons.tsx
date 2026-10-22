import { Globe, UserRound } from 'lucide-react'
import { UnavailableButton } from '@/shared/ui/feedback/UnavailableNotice'

export function SocialButtons() {
  return (
    <div className="flex flex-col gap-3">
      <UnavailableButton feature="O login social" variant="outline" className="w-full justify-center">
        <Globe aria-hidden="true" />
        Continuar com Google
      </UnavailableButton>
      <UnavailableButton feature="O login social" variant="outline" className="w-full justify-center">
        <UserRound aria-hidden="true" />
        Continuar com Facebook
      </UnavailableButton>
    </div>
  )
}
