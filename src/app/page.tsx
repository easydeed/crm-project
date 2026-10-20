import { HomeStory } from '@/app/home-story'
import { canonicalFacts, fullDigest } from '@/digest/canonical-facts'

export default function Home() {
  return <HomeStory facts={canonicalFacts()} digest={fullDigest()} />
}
