import { ArrowRight } from 'lucide-react'
import { NftImage } from '@/shared/ui/commerce/NftImage'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { UnavailableButton } from '@/shared/ui/feedback/UnavailableNotice'

interface Article {
  src: string
  alt: string
  date: string
  minutes: number
  title: string
  summary: string
}

const articles: Article[] = [
  {
    src: '/nfts/ivory-baron',
    alt: 'Macaco de pelagem escura com blazer claro em retrato digital',
    date: '12 de setembro',
    minutes: 6,
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Entenda o que você realmente possui ao comprar uma obra digital e como isso fica registrado.',
  },
  {
    src: '/nfts/emerald-ape',
    alt: 'Macaco de óculos escuros e jaqueta verde em retrato digital',
    date: '13 de setembro',
    minutes: 2,
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que estão moldando a cultura digital com coleções autorais.',
  },
  {
    src: '/nfts/violet-nomad',
    alt: 'Macaco de chapéu verde e moletom roxo em retrato digital',
    date: '15 de setembro',
    minutes: 3,
    title: 'Raridade, atributos e procedência',
    summary: 'Aprenda a ler atributos, comparar edições e verificar a origem de cada obra.',
  },
  {
    src: '/nfts/golden-beat',
    alt: 'Macaco alaranjado com fones de ouvido em retrato digital',
    date: '15 de setembro',
    minutes: 2,
    title: 'Como proteger sua carteira',
    summary: 'Boas práticas simples para manter suas chaves e seus ativos digitais em segurança.',
  },
]

export function MintJournal() {
  return (
    <section aria-labelledby="mint-journal-title" className="page flex flex-col gap-8">
      <SectionHeading
        id="mint-journal-title"
        level={1}
        align="center"
        title="Diário da Cunhagem"
        description="Histórias, guias e insights para colecionadores sobre o universo da propriedade digital."
      />
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <li key={article.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-md bg-card">
              <NftImage
                src={article.src}
                alt={article.alt}
                sizes="(min-width: 1024px) 288px, (min-width: 768px) 50vw, 100vw"
                className="rounded-none"
              />
              <div className="flex flex-1 flex-col items-start gap-3 p-4">
                <p className="text-caption whitespace-nowrap text-subtle">
                  {article.date} · {article.minutes} min de leitura
                </p>
                <h3 className="text-body-lg font-bold text-foreground">{article.title}</h3>
                <p className="flex-1 text-small text-muted-foreground">{article.summary}</p>
                <UnavailableButton
                  feature="O conteúdo do Diário da Cunhagem"
                  unstyled
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm text-small font-bold text-highlight underline-offset-4 hover:underline"
                >
                  Ler mais
                  <span className="sr-only">: {article.title}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </UnavailableButton>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
