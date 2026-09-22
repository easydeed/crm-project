import { HomeStory } from '@/app/home-story'
import { canonicalFacts } from '@/digest/canonical-facts'

export default function Home() {
  return <HomeStory facts={canonicalFacts()} />
}
